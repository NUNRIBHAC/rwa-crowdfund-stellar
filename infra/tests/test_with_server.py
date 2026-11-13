"""Local subprocess-only lifecycle checks. No external services or credentials."""
import os
from pathlib import Path
import shlex
import signal
import socket
import subprocess
import sys
import tempfile
import time
import unittest

WRAPPER = Path(__file__).resolve().parents[2] / 'docs/skills-reference/skills/webapp-testing/scripts/with_server.py'


def available_port():
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


def listening(port):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=.1):
            return True
    except OSError:
        return False


@unittest.skipUnless(os.name == 'posix', 'requires POSIX process groups')
class WithServerLifecycle(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.pidfile = self.root / 'pid'
        self.port = available_port()
        self.server = self.root / 'server.py'
        self.server.write_text('import os,pathlib,socket,time,signal,sys\n'
            'pathlib.Path(sys.argv[2]).write_text(str(os.getpid()))\n'
            's=socket.socket();s.bind(("127.0.0.1",int(sys.argv[1])));s.listen()\n'
            'if "ignore" in sys.argv: signal.signal(signal.SIGTERM,signal.SIG_IGN)\n'
            'while True: time.sleep(.05)\n')
        self.started = []
        self.logs = []

    def tearDown(self):
        for proc in self.started:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            if proc.poll() is None:
                proc.kill()
            proc.wait(timeout=3)
        if self.pidfile.exists():
            try:
                os.kill(int(self.pidfile.read_text()), signal.SIGKILL)
            except ProcessLookupError:
                pass
        for log in self.logs:
            log.close()
        self.tmp.cleanup()

    def command(self, suffix=''):
        return ' '.join(shlex.quote(str(x)) for x in [sys.executable, self.server, self.port, self.pidfile]) + suffix

    def launch(self, server=None, command=None, extra=None):
        args = [sys.executable, str(WRAPPER), '--timeout', '2', '--server', server or self.command(' & wait'), '--port', str(self.port)]
        args += extra or []
        args += ['--', sys.executable, '-c', command or 'pass']
        log = tempfile.TemporaryFile()
        self.logs.append(log)
        proc = subprocess.Popen(args, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        self.started.append(proc)
        return proc

    def finish(self, proc):
        code = proc.wait(timeout=10)
        end = time.monotonic() + 3
        while listening(self.port) and time.monotonic() < end:
            time.sleep(.03)
        self.assertFalse(listening(self.port), 'descendant still accepts connections')
        return code

    def test_shell_child_is_stopped_on_success(self):
        self.assertEqual(self.finish(self.launch()), 0)

    def test_shell_exit_does_not_orphan_server(self):
        self.assertEqual(self.finish(self.launch(server=self.command(' &'))), 0)

    def test_command_failure_still_stops_descendant(self):
        self.assertEqual(self.finish(self.launch(command='raise SystemExit(7)')), 7)

    def test_ignoring_term_requires_bounded_kill(self):
        self.assertEqual(self.finish(self.launch(server=self.command(' ignore & wait'))), 0)

    def test_preoccupied_port_is_not_treated_as_this_server(self):
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', self.port));sock.listen()
            proc = self.launch()
            self.assertNotEqual(proc.wait(timeout=5), 0)
            self.assertFalse(self.pidfile.exists(), 'server launched despite occupied port')

    def test_startup_failure_returns_error(self):
        self.assertNotEqual(self.finish(self.launch(server='exit 4')), 0)

    def test_startup_timeout_cleans_descendants(self):
        self.assertNotEqual(self.finish(self.launch(server='sleep 30 & wait')), 0)

    def test_term_signal_cleans_descendants(self):
        proc = self.launch(command='import time;time.sleep(30)')
        end = time.monotonic() + 5
        while not listening(self.port) and time.monotonic() < end:
            time.sleep(.03)
        self.assertTrue(listening(self.port))
        proc.send_signal(signal.SIGTERM)
        self.assertNotEqual(self.finish(proc), 0)

    def test_command_timeout_stops_server_and_command_group(self):
        self.assertEqual(self.finish(self.launch(command='import time;time.sleep(30)', extra=['--command-timeout', '.1'])), 124)

    def test_verbose_server_does_not_deadlock_on_undrained_pipe(self):
        self.server.write_text('print("x"*200000,flush=True)\n' + self.server.read_text())
        self.assertEqual(self.finish(self.launch()), 0)

    def test_grandchild_is_stopped(self):
        inner = 'sh -c ' + shlex.quote(self.command(' & wait')) + ' & wait'
        self.assertEqual(self.finish(self.launch(server=inner)), 0)

    def test_second_preoccupied_port_prevents_first_server_launch(self):
        port = available_port()
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', port));sock.listen()
            proc = self.launch(extra=['--server', 'sleep 30', '--port', str(port)])
            self.assertNotEqual(proc.wait(timeout=5), 0)
            self.assertFalse(self.pidfile.exists())

    def test_repeated_runs_release_the_port(self):
        for _ in range(2):
            self.assertEqual(self.finish(self.launch()), 0)
