# Estimation rule book

Writing conventions for how line items, deliverables and workstreams in the
Project Estimator should be described. This is a living reference — extend it
as new wording decisions are made, rather than re-deciding the same question
per estimation.

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

### Confirmed tags

- **Sales Implementation → "Sales & marketing alignment"**
  (`sales_implementation-9-sales-marketing-alignment`) —
  `Only for multi-dimensional projects`. It only means something when both
  Sales and Marketing Hub are in scope on the same project; drop it (or set
  its line to disabled) on a Sales-only estimation.

### Not yet reviewed

The rest of the line items across all nine standard workstreams have not
been individually reviewed for uni-/multi-dimensional applicability. Don't
assume an item is scoped one way or the other unless it's listed above —
add it here with a one-line justification once it's actually decided, the
same way the confirmed entry above is documented. Guessing a tag onto an
item without checking is worse than leaving it untagged.
