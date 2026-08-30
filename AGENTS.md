# hr-tax-rates

Два калькулятори на одному рушії, кожен зі своїм питанням.

- `apps/web` — **usporedba**: який із шести режимів обрати. Плюс референсне порівняння з українським ФОП 3 групи.
- `apps/druga-djelatnost` — **kombinacija**: людина працює за наймом і веде `paušalni obrt` поряд; скільки податків іде з якого джерела. Українською, без перемикача мов.

Чому це не сьомий режим у першому — ADR-0006.

## Agent skills

### Issue tracker

GitHub Issues in `klaipher/hr-tax-rates`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical labels, used verbatim. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
