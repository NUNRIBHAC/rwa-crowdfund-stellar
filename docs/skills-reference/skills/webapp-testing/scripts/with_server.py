#!/usr/bin/env python3
"""
Start one or more servers, wait for them to be ready, run a command, then clean up.

POSIX only: shell commands and the test command each own a new session/process
group. Cleanup signals their entire group, including descendants whose shell
has exited, with bounded TERM then KILL waits. Descendants must not deliberately
escape their group with setsid/daemonization. No process-discovery heuristic can
safely claim an escaped process belongs to this run. Repeated cleanup tolerates
already-exited groups. Server output is inherited, not buffered in undrained
pipes. Existing listeners and duplicate ports fail before launch. This TCP
readiness check is not an HTTP health check or a port-ownership proof against
another concurrent local program; choose distinct ports for concurrent runs.
Use --command-timeout when a bounded test-command duration is required.


Usage:
    # Single server
    python scripts/with_server.py --server "npm run dev" --port 5173 -- python automation.py
    python scripts/with_server.py --server "npm start" --port 3000 -- python test.py

    # Multiple servers
    python scripts/with_server.py \
      --server "cd backend && python server.py" --port 3000 \
      --server "cd frontend && npm run dev" --port 5173 \
      -- python test.py
"""

import argparse
import os
import signal
import socket
import subprocess
import sys
import time


class Interrupted(Exception):
    def __init__(self, signum):
        self.signum = signum


def port_ready(port):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=.1):
            return True
    except OSError:
        return False


def group_exists(pid):
    try:
        os.killpg(pid, 0)
        return True
    except ProcessLookupError:
        return False


def stop_group(process):
    """The shell may have exited already; its process group still owns children."""
    for sig, seconds in [(signal.SIGTERM, 1), (signal.SIGKILL, 1)]:
        try:
            os.killpg(process.pid, sig)
        except ProcessLookupError:
            break
        end = time.monotonic() + seconds
        while group_exists(process.pid) and time.monotonic() < end:
            process.poll()
            time.sleep(.02)
    # Reap the direct child. Orphan zombies are the OS reaper's responsibility;
    # group signalling is not a promise that every zombie PID is already gone.
    try:
        process.wait(timeout=1)
    except subprocess.TimeoutExpired:
        raise RuntimeError('process group did not stop within cleanup bound')


def main():
    parser = argparse.ArgumentParser(description='Run command with owned local server process groups (POSIX only)')
    parser.add_argument('--server', action='append', dest='servers', required=True)
    parser.add_argument('--port', action='append', dest='ports', type=int, required=True)
    parser.add_argument('--timeout', type=float, default=30, help='Startup timeout in seconds per server')
    parser.add_argument('--command-timeout', type=float, default=None, help='Optional command timeout in seconds')
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    if args.command and args.command[0] == '--':
        args.command = args.command[1:]
    if os.name != 'posix':
        parser.error('POSIX process groups required; no server was started')
    if not args.command or len(args.servers) != len(args.ports):
        parser.error('supply a command and one port per server')
    if args.timeout <= 0 or (args.command_timeout is not None and args.command_timeout <= 0):
        parser.error('timeouts must be positive')
    if len(set(args.ports)) != len(args.ports) or any(not 0 < p < 65536 for p in args.ports):
        parser.error('ports must be unique and between 1 and 65535')
    # Check all ports before starting anything, never accept a known old listener.
    # A local port check cannot reserve ownership across arbitrary shell commands;
    # callers must still avoid concurrent launches using the same port.
    if any(port_ready(port) for port in args.ports):
        parser.error('a requested port is already listening; no server was started')

    processes = []
    previous = {}
    def interrupted(signum, _frame):
        raise Interrupted(signum)
    for sig in (signal.SIGINT, signal.SIGTERM):
        previous[sig] = signal.signal(sig, interrupted)
    result = 1
    try:
        for cmd, port in zip(args.servers, args.ports):
            print(f'Starting local server on port {port}', flush=True)
            # Inherit output. Undrained PIPEs can block a verbose server before
            # it binds, and test output belongs in the caller's normal log.
            process = subprocess.Popen(cmd, shell=True, start_new_session=True)
            processes.append(process)
            deadline = time.monotonic() + args.timeout
            while not port_ready(port):
                code = process.poll()
                if code is not None and code != 0:
                    raise RuntimeError(f'server command exited with {code}')
                if time.monotonic() >= deadline:
                    raise RuntimeError(f'server did not listen on port {port} before timeout')
                time.sleep(.03)
        command = subprocess.Popen(args.command, start_new_session=True)
        processes.append(command)
        try:
            result = command.wait(timeout=args.command_timeout)
            if result < 0:
                result = 128 - result
        except subprocess.TimeoutExpired:
            print('Command timed out', file=sys.stderr)
            result = 124
    except Interrupted as exc:
        result = 128 + exc.signum
    except (OSError, RuntimeError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        result = 1
    finally:
        # Repeated termination signals cannot interrupt ownership cleanup.
        for sig in previous:
            signal.signal(sig, signal.SIG_IGN)
        try:
            for process in reversed(processes):
                try:
                    stop_group(process)
                except (OSError, RuntimeError) as exc:
                    print(f'Cleanup error: {exc}', file=sys.stderr)
                    result = 1
        finally:
            for sig, handler in previous.items():
                signal.signal(sig, handler)
    return result


if __name__ == '__main__':
    sys.exit(main())
