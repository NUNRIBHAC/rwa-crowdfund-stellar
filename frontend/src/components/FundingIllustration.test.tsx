import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '../i18n';
import FundingIllustration from './FundingIllustration';

describe('funding outcome illustration', () => {
  it('keeps the deadline, signer and illustrative scale explicit in both outcomes', () => {
    localStorage.setItem('blockallisto-language', 'en');
    render(
      <I18nProvider>
        <FundingIllustration />
      </I18nProvider>,
    );
    expect(screen.getByText('Interactive illustration - no transaction')).toBeTruthy();
    expect(screen.getByText('Each block is 1% of this illustrative goal.')).toBeTruthy();
    expect(screen.getByText('After the deadline, the creator can sign to withdraw once.')).toBeTruthy();
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('100%');
    fireEvent.click(screen.getByRole('button', { name: 'Goal missed' }));
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('60%');
    expect(screen.getByText('After the deadline, each contributor signs their own refund. Refunds are not automatic.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Goal missed' }).getAttribute('aria-pressed')).toBe('true');
  });
});
