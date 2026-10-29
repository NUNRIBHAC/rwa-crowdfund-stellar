import fs from 'node:fs';
import path from 'node:path';
export type State = { version: 1; identities: Record<string, any>; valuations: Record<string, any>; proposals: Record<string, any>; cashouts: Record<string, any>; audit: any[] };
export class Store {
  private busy = false;
  constructor(public readonly filename: string) {}
  read(): State {
    if (!fs.existsSync(this.filename)) return { version: 1, identities: {}, valuations: {}, proposals: {}, cashouts: {}, audit: [] };
    const value = JSON.parse(fs.readFileSync(this.filename, 'utf8'));
    if (value.version !== 1 || !value.audit || !value.identities || !value.valuations || !value.proposals || !value.cashouts) throw new Error('invalid infrastructure store; restore or reconcile manually');
    return value;
  }
  change<T>(fn: (state: State) => T): T {
    if (this.busy) throw new Error('reentrant store write');
    this.busy = true;
    try {
      const state = this.read(); const result = fn(state);
      fs.mkdirSync(path.dirname(this.filename), { recursive: true });
      const tmp = `${this.filename}.tmp-${process.pid}`;
      const fd = fs.openSync(tmp, 'w', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify(state, null, 2)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
      fs.renameSync(tmp, this.filename);
      const dir = fs.openSync(path.dirname(this.filename), 'r');
      try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
      return result;
    } finally { this.busy = false; }
  }
}
