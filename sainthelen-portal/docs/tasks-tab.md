# Tasks tab

One to-do list at `/admin/tasks`, fed by three sources: the morning inbox
scan (Claude, outside the portal), portal requests (automatic), and quick adds.

## API

All routes accept a signed-in portal session **or**
`Authorization: Bearer <TASKS_API_KEY>` (set on the Vercel project).

| Method | Path | What it does |
|---|---|---|
| GET | `/api/tasks?status=open` | Open tasks, newest first. Snoozed items are hidden until their time passes. `status=done` lists finished ones. |
| POST | `/api/tasks` | Create one task or an array. Upserts on `source_ref`: an open task with the same ref is updated (title, notes, due date, link, importance) instead of duplicated. A done task with that ref is left alone. |
| PATCH | `/api/tasks/:id` | Any of `title`, `notes`, `category`, `due_at`, `importance`, `status` (`open`/`done`), `snoozed_until`. Marking a portal task done also marks the request completed, and back. |
| DELETE | `/api/tasks/:id` | Remove. |
| GET | `/api/tasks/digest` | Open tasks that are `importance: high` or due within 48 hours. The daily digest email reads the same query directly. |

Task payload (all fields except `title` optional):

```json
{
  "title": "Update young-adult-ministry page (Patricia Gomez)",
  "notes": "Marked urgent, 24 hour window. Swap the Abide blurb and add the Nov 12 sign-up link.",
  "source": "email",
  "source_ref": "<internetMessageId>",
  "source_link": "<Outlook webLink>",
  "requester_name": "Patricia Gomez",
  "requester_email": "pgomez@sainthelen.org",
  "category": "website",
  "due_at": "2026-10-28T22:00:00Z",
  "importance": "high"
}
```

`source`: `email | portal | manual`. `category`: `reply | bulletin | website | calendar | av | admin | other`. `importance`: `normal | high`.

## Portal requests

Every new request creates a task with `source: portal` and
`source_ref: portal:<request id>`, linked to `/admin?open=<id>`. Categories:
announcement → bulletin, website update → website, A/V → av, texts, flier
reviews and design → other. Urgent website, flier and design requests arrive
as `high`.

## Digest

`/api/cron/daily-digest` runs at 12:15 UTC (8:15 am Eastern in winter,
7:15 am in summer), after the 6:43 am inbox scan. When the digest query
returns anything, a "Needs attention" block appears at the top of the email,
one line per task, linking to the Tasks tab.

## Inbox scan (runs in Claude, not in the portal)

Schedule: weekdays 6:43 am Eastern. Prompt outline:

1. Read mboyle@sainthelen.org for the last 24 hours.
2. Skip newsletters, receipts and automated notices that need no action:
   Eventbrite orders, SharePoint notifications, Read.ai reports, and funeral
   PDF copies when the livestream notice already covers the same funeral.
3. For each email that needs Matthew to do something, build the payload
   above. `source_ref` is the message's `internetMessageId`; `source_link` is
   its `webLink`. Title: the action plus the requester in parentheses. Notes:
   one to three sentences of context. `due_at` only when a date is stated.
4. `importance: high` when any of: the sender marked it urgent or high
   importance; due within 48 hours; it is from Msgr. Tom and asks for
   something; it is a livestream or recording request with a date; someone is
   waiting on a reply about a meeting already on the calendar. Otherwise
   `normal`.
5. POST the array to `https://comms.sainthelen.org/api/tasks` with the
   bearer token. Re-posting the same message is safe.
