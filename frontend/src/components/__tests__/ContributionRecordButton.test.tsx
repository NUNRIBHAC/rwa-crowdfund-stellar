import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../i18n';
import ContributionRecordButton from '../ContributionRecordButton';
const row = { hash: 'a'.repeat(64), campaign: 'staging-load', action: 'contribute', status: 'SUCCESS', amount: '0.1000001', createdAt: null };
const actor = 'G' + 'A'.repeat(55);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const show = (props = {}) =>
  render(
    <I18nProvider>
      <ContributionRecordButton row={row} actor={actor} network="testnet" productionEligible={false} {...props} />
    </I18nProvider>,
  );
describe('local contribution record download', () => {
  it('downloads one JSON blob with a sanitized hash filename, without fetch or signing', () => {
    const create = vi.fn((_blob: Blob) => 'blob:test'),
      revoke = vi.fn(),
      fetcher = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    vi.stubGlobal('fetch', fetcher);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    show();
    fireEvent.click(screen.getByRole('button', { name: /Download testnet journal record/ }));
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(click).toHaveBeenCalledOnce();
    const link = click.mock.instances[0] as HTMLAnchorElement;
    expect(link.download).toBe(`blockallisto-testnet-contribution-${row.hash}.json`);
    expect(revoke).toHaveBeenCalledWith('blob:test');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('never offers a success record for unknown or failed status', () => {
    show({ row: { ...row, status: 'UNKNOWN' } });
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('never offers a testnet export for public or missing network', () => {
    show({ network: 'public' });
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('removes download after actor becomes unauthenticated', () => {
    const { rerender } = show();
    expect(screen.getByRole('button')).toBeTruthy();
    rerender(
      <I18nProvider>
        <ContributionRecordButton row={row} actor="" network="testnet" productionEligible={false} />
      </I18nProvider>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('binds a rerendered record to the current visible actor', () => {
    const create = vi.fn((_blob: Blob) => 'blob:test');
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { rerender } = show();
    const other = 'G' + 'B'.repeat(55);
    rerender(
      <I18nProvider>
        <ContributionRecordButton row={row} actor={other} network="testnet" productionEligible={false} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(create).toHaveBeenCalledOnce();
  });
});
