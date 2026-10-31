# Tasks tab

One to-do list at `/admin/tasks`. It is fed by:

- the **inbox scan**: a portal cron that reads the Director's Outlook inbox
  and sent mail (and Teams chats where allowed) every hour on weekdays,
- **portal requests**: every new request creates a task; a website update
  creates one task per change,
- **quick adds** from the tab.

The Command Center is gone. Its tables (`tasks`, `notes`,
`recurring_reminders`, `social_media_content`) are dropped by migration 0010;
the list now lives in `portal_tasks`, with every decision logged to
`task_events`.

## Statuses

`open` → `in_progress` → `claimed_done` → `done`. Snoozing is a date, not a
status. A task reaches `done` only by a person ticking it, a portal request
being completed, or a verified website change. The Director acknowledging a
request never completes it.

## API

Session or `Authorization: Bearer <TASKS_API_KEY>`.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/tasks?status=open` | Open tasks (snoozed hidden until due); `status=done` for finished. Sorted so high importance and chased items float up. |
| POST | `/api/tasks` | One task or an array. Upserts on `source_ref`. |
| GET | `/api/tasks/:id` | The task and its audit trail. |
| PATCH | `/api/tasks/:id` | `title`, `notes`, `category`, `due_at`, `importance`, `status`, `snoozed_until`, `page_url`. Done/open on a portal task syncs the request (and its change item). |
| DELETE | `/api/tasks/:id` | Remove, trail included. |
| GET | `/api/tasks/digest` | Open tasks that are high importance, due within 48 hours, or past a date the Director committed to. |
| GET | `/api/cron/scan-inbox` | Run the inbox scan now (cron secret or tasks key). `?dry=1` returns the decisions without writing; `?dry=1&since=<ISO>` replays a window. |

Task payload fields: `title`, `notes`, `source` (email | teams | portal |
manual), `source_ref`, `source_link`, `conversation_id`, `requester_name`,
`requester_email`, `category` (reply | bulletin | website | calendar | av |
admin | other), `due_at`, `importance` (normal | high), `page_url`,
`requested_at`.

## The inbox scan

`app/lib/inbox-scan.ts`, scheduled in `vercel.json` at 20 past the hour,
10:00–23:00 UTC, Monday to Friday. It:

1. reads inbox and sent messages since the last cursor (Graph, application
   permission `Mail.Read`, ideally scoped to the one mailbox with an
   application access policy), strips quoted history, drops automated
   senders and newsletters;
2. reads Teams chats when `TEAMS_SCAN_ENABLED=true` (needs `Chat.Read.All`
   and Microsoft's protected-API approval; a 403 is reported, not fatal);
3. gives Claude the batch plus the open task list and gets one decision per
   message: `none`, `create`, `follow_up`, `commitment`, `in_progress`,
   `claimed_done`, each with a confidence and a one-line reason;
4. applies them: creates tasks (one per distinct ask), bumps follow-up
   counts (two or more chases makes the task high), records commitments
   with the date the Director named, records progress and claims;
5. for a claimed website change with a known page URL, fetches the live page
   and compares a hash of its main text to the snapshot taken when the task
   was created. Changed: `verified_done`. Unchanged or no snapshot: stays
   `claimed_done` for the Director to confirm in the tab.

Everything it does is written to `task_events` with the message link.

### Environment

| Variable | Purpose |
|---|---|
| `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` | Already set for sending mail. The app registration also needs `Mail.Read` (application). |
| `SCAN_MAILBOX` | Mailbox to read. Defaults to `MAILBOX_TO_SEND_FROM`. |
| `SCAN_DIRECTOR_NAME` | Defaults to "Matthew Boyle". |
| `PASTOR_EMAILS` | Comma-separated addresses that count as the pastor for the importance rule. |
| `TEAMS_SCAN_ENABLED` | `true` to read Teams chats. |
| `TASKS_API_KEY` | Bearer token for the API and for running the scan by hand. |
| `CRON_SECRET` | Vercel cron auth, already set. |

## Website updates

The public form takes one page (a sainthelen.org address, validated, or a
working title with "This is a new page" ticked) and any number of changes.
Each change is stored in `website_update_items`, shows as a checklist in the
admin panel, and has its own task (`source_ref: portal:<id>#<n>`). Ticking
the last change completes the request; completing the request ticks every
change.

## Digest

`/api/cron/daily-digest` at 12:15 UTC adds a "Needs attention" block for the
digest query above, linking to the Tasks tab.
