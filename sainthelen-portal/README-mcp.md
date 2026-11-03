# Portal MCP server

The portal exposes a small [Model Context Protocol](https://modelcontextprotocol.io) server so a Claude client (Claude.ai connectors, Claude Desktop, Claude Code) can read and update requests directly.

## Connector URL

```
https://comms.sainthelen.org/api/mcp/<MCP_TOKEN>
```

The token in the path is the only credential. Add the URL as a custom connector / remote MCP server with no extra auth. Any other path under `/api/mcp/` answers `404`, and every response carries `X-Robots-Tag: noindex`.

Streamable HTTP is the transport (MCP 2026-07-28, with the 2025 stateless fallback). For a stdio-only client use `npx -y mcp-remote <url>`.

## Tools

| Tool | What it does |
| --- | --- |
| `list_requests` | Requests from every form (or one `type`), `status` open / completed / all, `since` (default 60 days), `limit`. One-line `summary` per row plus the date fields each table has. |
| `get_request` | One request in full: every column, untruncated text, `sign_up_links` and `file_links` as absolute URLs, `notes` (staff comments and Claude's notes), website-update `changes`, announcement `calendar_review`. |
| `list_announcements` | Announcements with run dates and requested channels. `window` upcoming (next 30 days, default) / current (should be running now) / all; `channel` such as `Email Blast`, `Bulletin`, `Church Screens`. The Wednesday email tool. |
| `list_ministries` | Ministries with id, name, description, aliases, contact (approval coordinator), requires_approval. `search` matches name, aliases, description. |
| `mark_complete` | Sets `completed` and `completed_date` (clears them with `completed: false`), finishes website-update changes and the linked Tasks-tab item, notifies the submitter in the portal. |
| `add_note` | Appends an internal comment authored as "Claude" so staff see what was done. |

Request `type` values: `announcement`, `website_update`, `graphic_design`, `av_request`, `sms_request`, `flyer_review`, `photo_submission`. Each tool's description explains its columns in plain English, so a client needs nothing beyond `tools/list`.

## Setup

1. Generate a token (at least 32 random characters):
   ```
   openssl rand -hex 32
   ```
2. Add it to the Vercel project as `MCP_TOKEN` (Production; add Preview too if you want preview deployments reachable) and redeploy.
3. Give the client `https://comms.sainthelen.org/api/mcp/<MCP_TOKEN>`.

`USE_NEON_DB=true` must be set, as it already is in production; the server answers `503` otherwise.

## Rotating the token

1. Generate a new token.
2. Replace the value of `MCP_TOKEN` in Vercel and redeploy. The old URL starts returning `404` as soon as the deployment is live.
3. Update the URL in every connected client.

Treat the URL like a password: anyone who has it can read every request and mark things complete. Rotate it if it is ever pasted somewhere shared.

## Testing locally

```
MCP_TOKEN=local-test-token-0123456789 USE_NEON_DB=true DATABASE_URL=<dev neon url> npm run dev
npx @modelcontextprotocol/inspector --cli http://localhost:3000/api/mcp/local-test-token-0123456789 --transport http --method tools/list
npx @modelcontextprotocol/inspector --cli http://localhost:3000/api/mcp/local-test-token-0123456789 --transport http --method tools/call --tool-name list_ministries
```

Code: `app/api/mcp/[token]/route.ts` (token gate, transport) and `app/lib/mcp/portal-tools.ts` (the tools).
