// Single render path for every legal document body. Content comes from the
// block data in i18n/legal; legalMeta constants bind through {v} variants.
// The wrapper's lang/dir describe the ACTUALLY rendered content language:
// an English fallback renders lang=en dir=ltr even when the UI locale is ar.
import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { useI18n } from '../i18n';
import { legalBlocks } from '../i18n/legal';
import type { LegalBlock, LegalDocId, LegalInline } from '../i18n/legal/types';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED, NEON_REGION } from '../pages/legalMeta';

const VARS = { contactEmail: LEGAL_CONTACT_EMAIL, lastUpdated: LEGAL_LAST_UPDATED, neonRegion: NEON_REGION };

function renderInlines(list: LegalInline[]): ReactNode {
  return list.map((x, i) => {
    if (typeof x === 'string') return <Fragment key={i}>{x}</Fragment>;
    if ('b' in x) return <strong key={i}>{renderInlines(x.b)}</strong>;
    if ('i' in x) return <em key={i}>{renderInlines(x.i)}</em>;
    return <Fragment key={i}>{VARS[x.v]}</Fragment>;
  });
}

function renderBlock(block: LegalBlock, i: number): ReactNode {
  switch (block.t) {
    case 'notice':
      return (
        <p key={i} className="legal-demo-notice">
          {renderInlines(block.text)}
        </p>
      );
    case 'p':
      return <p key={i}>{renderInlines(block.text)}</p>;
    case 'h2':
      return <h2 key={i}>{renderInlines(block.text)}</h2>;
    case 'ul':
      return (
        <ul key={i}>
          {block.items.map((item, j) => (
            <li key={j}>{renderInlines(item)}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <table key={i} className="legal-table">
          <thead>
            {block.head.map((row, j) => (
              <tr key={j}>
                {row.map((cell, k) => (
                  <th key={k}>{renderInlines(cell)}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {block.rows.map((row, j) => (
              <tr key={j}>
                {row.map((cell, k) => (
                  <td key={k}>{renderInlines(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}

export default function LegalDoc({ doc }: { doc: LegalDocId }) {
  const { locale } = useI18n();
  const { blocks, renderedLocale } = legalBlocks(doc, locale);
  // Arabic renders with no dir attribute: the wrapper inherits ltr so tables
  // and blocks keep identical geometry across locales, while the global
  // html.rtl-text rules flip text direction inside cells and paragraphs.
  // Non-Arabic keeps dir=ltr so an English fallback under an Arabic UI locale
  // does not get flipped by those same rtl-text rules.
  const rtl = renderedLocale === 'ar';
  return (
    <div lang={renderedLocale} dir={rtl ? undefined : 'ltr'}>
      {locale !== renderedLocale && (
        <p className="legal-demo-notice">English version shown. An updated, verified translation for your selected language is not yet available.</p>
      )}
      {blocks.map(renderBlock)}
    </div>
  );
}
