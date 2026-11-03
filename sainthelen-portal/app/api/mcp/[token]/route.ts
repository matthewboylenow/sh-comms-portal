// app/api/mcp/[token]/route.ts
//
// MCP server for the Communications Portal: lets a Claude client read and
// update requests (see README-mcp.md). The URL itself is the credential:
//   https://comms.sainthelen.org/api/mcp/<MCP_TOKEN>
// Anything but the exact token gets a 404 before the database is touched.
// There is no NextAuth middleware or CSRF check on /api routes, so the
// token comparison below is the whole gate.
import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import { createMcpHandler } from 'mcp-handler';
import { registerPortalTools } from '../../../lib/mcp/portal-tools';
import { useNeonDatabase } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' };

const mcp = createMcpHandler(
  (server) => {
    registerPortalTools(server);
  },
  { serverInfo: { name: 'saint-helen-comms-portal', version: '1.0.0' } }
);

function tokenMatches(given: string | undefined): boolean {
  const expected = process.env.MCP_TOKEN;
  if (!expected || expected.length < 16 || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: NextRequest, { params }: { params: { token: string } }) {
  if (!tokenMatches(params?.token)) {
    return new Response('Not found', { status: 404, headers: NOINDEX });
  }
  if (!useNeonDatabase()) {
    return Response.json({ error: 'The portal database is not enabled' }, { status: 503, headers: NOINDEX });
  }
  const res = await mcp(request);
  // Copy so the headers are writable whatever the handler returned
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(NOINDEX)) out.headers.set(k, v);
  return out;
}

export { handle as GET, handle as POST, handle as DELETE };
