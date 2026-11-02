import PDFDocument from 'pdfkit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ShareRegisterPayload, ShareRegisterRow } from './share-register.js';

// PDF rendering of the share-register payload (read-only operator export).
// The embedded font (JetBrains Mono, OFL - see assets/fonts/JetBrainsMono-OFL.txt)
// covers ASCII, Latin-1, Latin Extended-A/B, Greek and Cyrillic. Anything
// outside that coverage is rendered as a visible [U+XXXX] escape marker,
// declared on the document's face - a bounded, testable behaviour instead of
// a silently dropped glyph. The register's dynamic data (keys, amounts,
// hashes, timestamps, code-generated notes) is ASCII by construction; the
// escape path exists for operator-set names.

const FONT_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/fonts/JetBrainsMono-Regular.ttf');

const COVERED = /^[\u0020-\u007E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u0370-\u03FF\u0400-\u04FF]*$/;

// Replaces every codepoint outside the embedded font's coverage with a
// visible [U+XXXX] marker. Exported for tests.
export function escapeForPdf(text: string): string {
  if (COVERED.test(text)) return text;
  let out = '';
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    out += cp <= 0xffff && COVERED.test(ch) ? ch : `[U+${cp.toString(16).toUpperCase().padStart(4, '0')}]`;
  }
  return out;
}

const MARGIN = 50;
const MONO = 'JetBrainsMono';

function rowLines(row: ShareRegisterRow): string[] {
  const lines = [
    `${escapeForPdf(row.publicKey)}${row.registered ? '' : '  [NOT IN REGISTRY - see notes]'}`,
    `    first confirmed: ${row.firstConfirmedAt ?? 'n/a'}   contributions: ${row.contributeCount}   refunds: ${row.refundCount}`,
    `    contributed(intended): ${row.contributedIntended}   refunded(intended): ${row.refundedIntended}   net(intended): ${row.netIntended}`,
  ];
  if (row.missingAmountIntents > 0) lines.push(`    intents without amount: ${row.missingAmountIntents}`);
  if (row.intentHashes.length > 0) lines.push(`    intent hashes: ${row.intentHashes.join('  ')}`);
  return lines;
}

function render(payload: ShareRegisterPayload, totalPages: number): Promise<{ pdf: Buffer; pages: number }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: { Title: `Share register export - ${payload.campaignId} (demo)` },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve({ pdf: Buffer.concat(chunks), pages: pageCount }));
    doc.on('error', reject);

    doc.registerFont(MONO, FONT_PATH);
    doc.font(MONO);

    const banner = 'SYNTHETIC TESTNET DEMO DATA - not an accounting, custody, audit-opinion or legal share register.';
    let pageCount = 1;
    const footer = () => {
      const label = totalPages > 0 ? `Page ${pageCount} of ${totalPages}` : `Page ${pageCount}`;
      // Writing below the bottom margin would itself trigger pagination
      // (recursing pageAdded); lift the margin just for the footer line.
      const bottom = doc.page.margins.bottom;
      const resumeY = doc.y;
      doc.page.margins.bottom = 0;
      doc
        .fontSize(7)
        .text(banner + '   ' + label, MARGIN, doc.page.height - bottom + 12, { align: 'center', width: doc.page.width - 2 * MARGIN, lineBreak: false });
      doc.page.margins.bottom = bottom;
      doc.y = resumeY; // the footer write moved the flow cursor; restore it
    };
    // Footer for page 1 now; each later page gets one when it is added.
    // (No bufferPages: auto-flushed pages made switchToPage footers land on
    // trailing empty pages - two-pass gives an exact total instead.)
    footer();
    doc.on('pageAdded', () => {
      pageCount += 1;
      footer();
    });

    doc.fontSize(13).text('Share register export (operator)', { continued: false });
    doc.fontSize(9).text(`Campaign: ${escapeForPdf(payload.campaignId)}   Network: ${escapeForPdf(payload.network)}   Generated: ${payload.generatedAt}`);
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor('#b54708').text(banner);
    doc.fillColor('#000000');
    doc.moveDown(0.8);

    doc.fontSize(8).text(escapeForPdf(payload.semantics), { align: 'left' });
    doc.moveDown(0.4);
    doc.fontSize(8).text('Characters outside the embedded font coverage (Latin/Greek/Cyrillic) are shown as visible [U+XXXX] escapes.', { align: 'left' });
    doc.moveDown(1);

    const t = payload.totals;
    doc.fontSize(10).text('Totals');
    doc.fontSize(9).text(`contributors: ${t.contributors}   contributions: ${t.contributeCount}   refunds: ${t.refundCount}`);
    doc
      .fontSize(9)
      .text(
        `contributed(intended): ${t.contributedIntended}   refunded(intended): ${t.refundedIntended}   net(intended): ${t.netIntended}   intents without amount: ${t.missingAmountIntents}`,
      );
    doc.moveDown(1);

    doc.fontSize(10).text(`Contributors (${payload.contributors.length})`);
    doc.moveDown(0.3);
    doc.fontSize(8);
    payload.contributors.forEach((row, i) => {
      const lines = rowLines(row);
      const all = [`${i + 1}. ${lines[0]}`, ...lines.slice(1)];
      // Keep each contributor block on one page when it fits one: measure the
      // block (wrapped lines included) and start a fresh page instead of
      // splitting identity lines from their amounts across the boundary.
      // Blocks taller than a full page still flow and paginate naturally.
      const usableHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
      const blockHeight = all.reduce((h, line) => h + doc.heightOfString(line), 0) + 0.4 * doc.currentLineHeight();
      if (blockHeight < usableHeight && doc.y + blockHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
      // Manual addPage is safe here: footers are drawn by the pageAdded
      // listener, which numbers every page as it appears.
      for (const line of all) doc.text(line);
      doc.moveDown(0.4);
    });

    if (payload.notes.length > 0) {
      doc.moveDown(0.6);
      doc.fontSize(10).text('Notes');
      doc.fontSize(8);
      for (const note of payload.notes) doc.text(`- ${escapeForPdf(note)}`);
    }

    doc.end();
  });
}

export async function buildShareRegisterPdf(payload: ShareRegisterPayload): Promise<Buffer> {
  // Pass 1 counts pages (footer without total); pass 2 renders the exact
  // "Page N of M" footer on every page.
  const first = await render(payload, 0);
  const second = await render(payload, first.pages);
  return second.pdf;
}
