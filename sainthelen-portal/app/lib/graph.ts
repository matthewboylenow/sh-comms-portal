// app/lib/graph.ts
// Microsoft Graph with the portal's app credential. Mail and Teams reads for
// the inbox scan; the same token the portal already uses to send mail.
const TENANT_ID = process.env.AZURE_AD_TENANT_ID;
const CLIENT_ID = process.env.AZURE_AD_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET;

let cached: { token: string; exp: number } | null = null;

export function isGraphConfigured(): boolean {
  return !!(TENANT_ID && CLIENT_ID && CLIENT_SECRET);
}

export async function graphToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });
  if (!res.ok) throw new Error(`Graph token failed (${res.status})`);
  const data = await res.json();
  cached = { token: data.access_token, exp: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return cached.token;
}

export class GraphError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function graphGet<T = any>(path: string, init: { prefer?: string } = {}): Promise<T> {
  const token = await graphToken();
  const url = path.startsWith('https://') ? path : `https://graph.microsoft.com/v1.0${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, ...(init.prefer ? { Prefer: init.prefer } : {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new GraphError(res.status, body?.error?.message || `Graph ${res.status} on ${path}`, body?.error?.code);
  }
  return res.json();
}

/** Follow @odata.nextLink pages up to a cap. */
export async function graphList<T = any>(path: string, cap = 200): Promise<T[]> {
  const out: T[] = [];
  let next: string | null = path;
  while (next && out.length < cap) {
    const page: { value?: T[]; '@odata.nextLink'?: string } = await graphGet(next);
    out.push(...(page.value || []));
    next = page['@odata.nextLink'] || null;
  }
  return out.slice(0, cap);
}

/** Strip HTML to readable text for the model. */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** Drop quoted history from a reply so the model sees only the new words. */
export function stripQuotedReply(text: string): string {
  const markers = [
    /\nFrom: .+\nSent: .+/i,
    /\n-----Original Message-----/i,
    /\nOn .{10,80} wrote:\n/i,
    /\n_{10,}\n/,
  ];
  let cut = text.length;
  for (const m of markers) {
    const i = text.search(m);
    if (i > 0 && i < cut) cut = i;
  }
  return text.slice(0, cut).trim();
}
