# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project overview

Humanizer is a small Python library and CLI that rewrites text to reduce
repetitive, formulaic AI-sounding phrasing. It applies conservative,
rule-based edits (no LLM calls, no external services) and never changes the
meaning of the text.

- `src/humanizer/core.py` — the rewrite logic (`humanize`, `HumanizeOptions`).
- `src/humanizer/cli.py` — the `humanizer` CLI entry point.
- `tests/test_core.py` — pytest tests for the core logic.

## Setup

```bash
pip install -e ".[dev]"
```

## Tests

Run the full test suite before committing:

```bash
pytest
```

There is no separate lint/type-check command configured — keep changes
consistent with the existing style (type hints, `from __future__ import
annotations`, dataclasses for options).

## Conventions

- Keep edits conservative and rule-based; don't introduce dependencies on
  external services or LLM calls — that defeats the purpose of the library.
- Preserve determinism: any randomness must go through the `random.Random`
  instance seeded from `HumanizeOptions.seed`.
- Preserve capitalization of replaced phrases (see `_match_case` in
  `core.py`) when adding new replacement rules.
- Add or update tests in `tests/test_core.py` for any behavior change.
- Update `README.md` if CLI flags or public API change.
