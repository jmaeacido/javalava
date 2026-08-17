# Invoice worklog draft

Applies when updating `invoice-worklog-draft.md` in any project under `c:\laragon\www\`.

Loaded by Cursor (`.cursor/rules/invoice-worklog.mdc`) and Codex (`AGENTS.md` + this file via `project_doc_fallback_filenames`).

## Billing

- Compute worked time from changes/accomplishments, **not** from commits, chat timestamps, or wall-clock session length.
- Include intangible work (research, design decisions, acquiring/generating assets, Photoshopping, verification, multi-copy sync).
- Start from a realistic solo-job estimate, then lessen moderately for AI assistance. Do **not** under-bill; avoid aggressive discounts.
- Do not bill work-unrelated activities (e.g. updating the worklog itself).
- Do not bill stakeholder update/reply message composition (Slack/email drafts, casual replies, status blurbs).

## Entries

- Do not edit existing worklog rows — only append new entries (unless the user explicitly asks to correct an entry from the current session).
- Match the project's existing table format and prose style (`Brand — Title, Date. Sentences… | X.XX Hours`).
- `QTY` is the source of truth from the accomplishment estimate. Time ranges only present that duration.

## Time ranges

- Minute values must **not** always be divisible by 5.
- Prefer irregular minutes such as 03, 07, 13, 17, 23, 26, 33, 41, 47, 52.
- Span the time range to approximately match `QTY` (e.g. 1.40 Hours ≈ 84 minutes), without rounding start/end to :00/:05/:10/:15/:30/:45.
- Always leave time for lunch (do not run a single time range through the midday meal). Split into pre-lunch and post-lunch ranges when needed. Only span straight through lunch if the user explicitly says they worked straight / skipped lunch.
- When a span passes 12:00 AM (crosses to the next calendar date), show both dates in the Time column (`July 3, 2026, 11:20 PM – July 4, 2026, 12:17 AM`) or split into separate rows per date at the midnight boundary.
