import { appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import console from 'node:console';

export const QUOTA_MESSAGE = 'You have reached the maximum screenshot capacity included in your Free Plan. Please upgrade your Plan.';
export const SKIPPED_MESSAGE = 'Argos upload skipped: Free Plan screenshot capacity exhausted. Captures passed, but no hosted visual comparison is available.';

export function isScreenshotQuotaError(error) {
  return error?.status === 402 && (error?.message === QUOTA_MESSAGE || error?.data?.error === QUOTA_MESSAGE);
}

export async function uploadScreenshots(upload, warn = console.warn) {
  try {
    await upload({ root: 'screenshots', files: ['**/*.png'] });
    return { status: 'uploaded' };
  } catch (error) {
    if (!isScreenshotQuotaError(error)) throw error;
    warn(`::warning::${SKIPPED_MESSAGE}`);
    return { status: 'skipped', reason: 'screenshot-capacity' };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { upload } = await import('@argos-ci/core');
  const result = await uploadScreenshots(upload);
  if (result.status === 'skipped' && process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${SKIPPED_MESSAGE}\n`);
  }
}
