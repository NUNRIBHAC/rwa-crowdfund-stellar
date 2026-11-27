import { createHash, randomBytes } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import type { RefundRecord, RefundStore } from './automatic-refunds.js';

// Single-host durable store. Locks are never reclaimed by guessing that a
// process died. A stale lock requires an operator to reconcile the signed hash
// before removing it. A production multi-host adapter must use database locks.
export class FileRefundStore implements RefundStore {
  constructor(private readonly directory: string) {}
  private filename(key: string): string {
    return join(this.directory, createHash('sha256').update(key).digest('hex'));
  }
  private async ready(): Promise<void> {
    await mkdir(this.directory, { recursive: true, mode: 0o700 });
    await chmod(this.directory, 0o700);
  }
  async exclusive<T>(key: string, run: () => Promise<T>): Promise<T> {
    await this.ready();
    const lock = this.filename(key) + '.lock';
    await mkdir(lock, { mode: 0o700 });
    try {
      return await run();
    } finally {
      await rm(lock, { recursive: true });
    }
  }
  async read(key: string): Promise<RefundRecord | undefined> {
    try {
      const value: unknown = JSON.parse(await readFile(this.filename(key) + '.json', 'utf8'));
      if (!value || typeof value !== 'object' || !('state' in value) || !('campaign' in value) || !('contributor' in value))
        throw new Error('AUTO_REFUND_INVALID_STORED_RECORD');
      return value as RefundRecord;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
  }
  async write(key: string, record: RefundRecord): Promise<void> {
    await this.ready();
    const prior = await this.read(key);
    if (key.startsWith('["refund-retired-history",') && prior) {
      if (JSON.stringify(prior) !== JSON.stringify(record)) throw new Error('AUTO_REFUND_RETIREMENT_IMMUTABLE');
      return;
    }
    if (record.campaign && record.contributor && prior?.campaign === record.campaign && prior.contributor === record.contributor && prior.attempts?.length) {
      if (
        !record.attempts ||
        record.attempts.length < prior.attempts.length ||
        prior.attempts.some((attempt, i) => JSON.stringify(attempt) !== JSON.stringify(record.attempts![i]))
      )
        throw new Error('AUTO_REFUND_ATTEMPT_HISTORY_IMMUTABLE');
    }
    const name = this.filename(key);
    const temporary = name + '.' + randomBytes(16).toString('hex') + '.tmp';
    const file = await open(temporary, 'wx', 0o600);
    try {
      await file.writeFile(JSON.stringify(record));
      await file.sync();
    } finally {
      await file.close();
    }
    try {
      await rename(temporary, name + '.json');
      const dir = await open(this.directory, 'r');
      try {
        await dir.sync();
      } finally {
        await dir.close();
      }
    } finally {
      await rm(temporary, { force: true });
    }
  }
}
