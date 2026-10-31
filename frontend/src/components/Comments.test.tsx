// Regression: the public comments endpoint returns PublicComment
// {id, campaignId, body, createdAt, author} (backend community.ts). Rendering
// a non-empty list must not crash and must show the server-resolved author
// label - an earlier version read c.displayName ?? shorten(c.publicKey) and
// threw on undefined.length with real data.
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Comments from './Comments';
import { CommunityAuthProvider } from '../community/CommunityAuth';

const WIRE_COMMENT = {
  id: 'cmt_1',
  campaignId: 'demo-solar',
  body: 'Real backend comment body',
  createdAt: 1730000000000,
  author: 'GABC…WXYZ',
};

function ok(v: unknown) {
  return new Response(JSON.stringify(v), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('Comments', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('renders the real backend comment shape without crashing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ comments: [WIRE_COMMENT] })));
    render(
      <CommunityAuthProvider messages={{ freighterMissing: 'x', walletNoSign: 'y' }}>
        <Comments campaignId="demo-solar" />
      </CommunityAuthProvider>,
    );
    expect(await screen.findByText('GABC…WXYZ')).toBeTruthy();
    expect(screen.getByText('Real backend comment body')).toBeTruthy();
  });
});
