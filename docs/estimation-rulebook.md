# Estimation rule book

Writing conventions for how line items, deliverables and workstreams in the
Project Estimator should be described. This is a living reference — extend it
as new wording decisions are made, rather than re-deciding the same question
per estimation.

## Where this is visible

This file itself is a repo document, referenced from `CLAUDE.md` — it's
visible to anyone working in the codebase (and to Claude Code as a standing
instruction), but it is **not** shown anywhere inside the deployed web app.
End users making an estimation never see this markdown file. (The
workbook's own "ESTIMATION RULEBOOK" tab — how to use the template — is a
different thing; it is shown in the app as a collapsible card on the Cover
page, `src/components/editor/Rulebook.tsx`.)

The wording decisions recorded here only reach the app when they're also
applied to the actual data: the `comment` field on a `StandardLineItem` in
`src/lib/templates.ts`, rendered next to that item's Topic in
`WorkstreamPanel.tsx` (the editable tab) and `ProposalSummary.tsx` (the
client-facing print view) via the shared `LineItemNote` component. A
decision written here but not also set on the line item's `comment` field
stays invisible in the app.

## Deliverable descriptions: writing rules

- State what happens, what gets produced, and where it lands. No filler
  ("holistisch", "diepgaand", "strategische sessie") — Elixir is RevOps
  Engineers, not generic consultants. Say the concrete thing.
- A topic label (e.g. "Strategy Interview") stays short — it's a column
  value, not a sentence. The deliverable *description* is where the actual
  scope and output get spelled out, for use in proposals and client-facing
  screenshots (Proposal Summary tab).
- Keep it to one sentence where possible. Two only if the steps genuinely
  don't compress.

### Worked example: "Interview" topics (Business Assessment)

The topic label "Interview" (or "Strategy Interview", "Marketing Interview",
etc.) undersells what actually happens: a short interview, followed by
working out the findings, translated into recommendations and input for the
solution design. Decided wording (2026-09-18):

> **Full version** (deliverable description): Kort interview met de
> betrokken vakspecialist(en) om de huidige situatie en doelstellingen op te
> halen, uitgewerkt tot concrete bevindingen en vertaald naar aanbevelingen
> en input voor het solution design.
>
> **Short version** (tight spaces): Interview + uitwerking; input wordt
> vertaald naar aanbevelingen voor het solution design.

This pattern (interview → uitwerking → doorvertaling naar solution
design/aanbevelingen) applies to every "X Interview" topic in Business
Assessment (Strategy, Marketing, Sales, Service, Data/IT), not just one of
them — reuse the same shape, swap only the domain word.

Applied: the short version is now set as the `comment` on
`business_assessment-1` through `-5` in `src/lib/templates.ts`, and rendered
in the app next to the Topic column (WorkstreamPanel and Proposal Summary) —
same place the source spreadsheet's own Comment column sat.

Since the V3 workbook (applied 2026-10-09) each interview is two lines: a
2h **Session** and a 1h **Setup** line of the same name for the write-up.
The wording above sits on the Session line only, since it describes the
pair; it replaces V3's Content text for those rows ("C Level decision makers
for that area"). The Setup lines carry no comment, as in V3.

### Content column (V3)

The V3 workbook adds a **Content** column describing each line (e.g.
"Prep Miro & Deck", "Check on imports the client did, clarify issues"). It
is stored in the same `comment` field and shown in the same place, with a
Dutch translation. Its **Duration** column (session length in hours) is
stored as `duration` and shown in the editor only — informational, not
used in any total.

### Session Prep vs. Setup

Preparation lines use the activity **Session Prep** (light-blue row), not
Setup, so they stay visibly separate from the actual sessions and from the
HubSpot setup work. V3 labels five preparation lines as "Setup" even though
their Content says "Prep…"; those are reclassified as Session Prep here:
Technical Assessment "Best-practice integration flow" and "Adapted
integration flow", Data Migration "Best Practices & Customer Input", and
Marketing "Key User Training" / "Admin User Training". Hours are unchanged
(both use the setup complexity table).

## Uni-dimensional vs. multi-dimensional projects

A **dimension** = one HubSpot hub in scope (Sales, Service, Marketing, CMS,
DealHub).

- **Uni-dimensional project**: exactly one hub is in scope.
- **Multi-dimensional project**: two or more hubs are in scope together.

Some line items only make sense, or only carry their full described effort,
in one of these two situations. Tag those items so estimators (human or
Claude) don't apply them where they don't belong. Two tags to use verbatim,
next to the relevant line item or rule:

- `Only for uni-dimensional projects`
- `Only for multi-dimensional projects`

Untagged items apply regardless of how many hubs are in scope.

### Confirmed tags (V2 workbook — no longer in the template)

**V3 update (2026-10-09):** the V3 workbook removed all four tagged items
below and replaced the workshop-vs-presentation split with a single
"Fit Gap Analysis & Solution Design" session (3h) + setup (4h), untagged.
V3 contains no "Only for..." tags at all, so the current template has none.
Estimations created from the V2 template still carry these tags, and the app
still renders them as a badge. Whether dropping the uni/multi-dimensional
distinction was intended has not been confirmed with the Elixir team.

Verified directly against the V2 spreadsheet's Comment column (not
inferred) — these were the *only* four "Only for..." tags in that
workbook, all in Business Assessment, rendered as a small badge next to the
Topic in the app (WorkstreamPanel and Proposal Summary):

| Line item | id | Tag |
|---|---|---|
| Solution design workshop | `business_assessment-6-solution-design-workshop` | `Only for uni-dimensional projects` |
| Assessment presentation | `business_assessment-7-assessment-presentation` | `Only for multi dimensional projects` |
| Create solution design & user stories | `business_assessment-8-create-solution-design-user-stories` | `Only for uni-dimensional projects` |
| Prepare assessment presentation | `business_assessment-9-prepare-assessment-presentation` | `Only for multi dimensional projects` |

Reading of the pattern: a uni-dimensional (single-hub) project wraps up
Business Assessment with a **workshop** (solution design workshop + desk
work to turn it into a design/user stories). A multi-dimensional (2+ hubs)
project instead wraps up with a **presentation** (assessment presentation +
desk work to prepare it) — presumably because a cross-hub outcome needs a
formal readout rather than a single working session. This is a reading of
the source data, not confirmed with the Elixir team — check before treating
it as a hard rule for *why*, even though the tags themselves are directly
from the sheet.

Note: an earlier version of this section listed "Sales Implementation →
Sales & marketing alignment" as `Only for multi-dimensional projects`. That
was this document's own inference, not sourced from the spreadsheet — the
source workbook has no such tag anywhere outside Business Assessment.
Retracted (2026-09-18); that item remains untagged below.

### Not yet reviewed

No line item in the V3 workbook carries an "Only for..." tag (and none
outside Business Assessment did in V2). That doesn't mean none of them are
dimension-specific in practice (e.g. V2's "Sales & marketing alignment"
session, dropped in V3, clearly only meant something with both Sales and
Marketing Hub in scope) — it means the spreadsheet never tagged it. Treat
any such item as untagged/applies-regardless until someone makes an
explicit business decision to tag it, and documents that decision here with
a one-line justification the same way the confirmed entries above are
documented. Guessing a tag onto an item without checking is worse than
leaving it untagged.
