# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Humanizer is a small Python library and CLI that rewrites text to reduce
repetitive, formulaic AI-sounding phrasing (stock transitions like
"furthermore"/"in conclusion", stiff verbs like "utilize", repeated sentence
openers). All edits are conservative and rule-based — there is no LLM or
external service call anywhere in this codebase, and no edit should change
the meaning of the input text.

## Commands

```bash
pip install -e ".[dev]"   # install with dev/test dependencies
pytest                    # run the full test suite
pytest tests/test_core.py::test_contractions_applied   # run a single test
```

There is no configured lint or type-check command.

## Architecture

- `src/humanizer/core.py` — all rewrite logic lives here:
  - `_CLICHE_REPLACEMENTS` / `_CLICHE_PATTERN`: stock-phrase → alternatives
    map, compiled into one regex (longest phrases first, so e.g. "it is
    worth noting that" matches before a shorter substring could).
  - `_CONTRACTIONS` / `_CONTRACTION_PATTERN`: verb-phrase contraction map,
    same longest-match-first regex approach.
  - `_vary_sentence_starts`: tracks each sentence's first word and, on
    repeats, randomly prepends one of `_SENTENCE_STARTERS`.
  - `humanize(text, options)` is the single public entry point; it runs
    cliche replacement, then contractions, then sentence-start variation,
    each gated by a flag on `HumanizeOptions`.
  - `_match_case` re-cases every replacement to match the original phrase's
    capitalization — required whenever adding a new replacement rule.
- `src/humanizer/cli.py` — thin argparse wrapper around `humanize`, reads
  from a file or stdin, writes to a file or stdout. CLI flags map directly
  to `HumanizeOptions` fields (`--no-contractions`, `--no-vary-starts`,
  `--seed`).
- All randomness is routed through a single `random.Random` instance seeded
  from `HumanizeOptions.seed`, so output is reproducible when a seed is
  given — never call `random` module functions directly.
- `tests/test_core.py` tests `humanize` directly; there are no CLI-level
  tests.

## Conventions (see also AGENTS.md)

- Keep edits conservative and rule-based; don't add dependencies on
  external services or LLM calls.
- Preserve determinism (route new randomness through the seeded RNG) and
  capitalization (`_match_case`) for any new replacement rule.
- Add/update tests in `tests/test_core.py` for behavior changes, and update
  `README.md` if the public API or CLI flags change.
