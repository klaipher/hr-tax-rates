# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the glossary.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

This is a **single-context** repo:

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-ruleset-and-pretpostavke-are-separate-layers.md
│   ├── 0002-every-legal-number-carries-its-source.md
│   └── 0003-hok-divergences-are-registered-not-matched.md
└── packages/
```

If this ever grows a `CONTEXT-MAP.md` at the root, it becomes multi-context: the map points at one `CONTEXT.md` per context, and each context may carry its own `docs/adr/`.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

**This glossary is Croatian.** The canonical term is the Croatian legal one, with a translation in parentheses alongside — in the glossary and in JSDoc on every field. This matters more here than in most repos: `primitak`, `izdatak`, `dohodak` and `dobit` are four distinct legal concepts, and every one of them translates to "income" or "revenue" in careless English or Ukrainian. Collapsing them produces wrong numbers in exactly the places that are hardest to notice. The glossary's `_Avoid_` lines exist to stop that.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0002 (every legal number carries its source) — but worth reopening because…_
