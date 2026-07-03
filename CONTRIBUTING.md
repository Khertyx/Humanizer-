# Contributing

Thanks for your interest in improving Humanizer.

## Setup

```bash
pip install -e ".[dev]"
```

## Making changes

- Keep edits conservative and rule-based — Humanizer never calls an LLM or
  external service, and no change should alter the meaning of the input
  text.
- Route any new randomness through the `random.Random` instance seeded from
  `HumanizeOptions.seed`, so output stays reproducible when a seed is given.
- Preserve capitalization of replaced phrases (see `_match_case` in
  `src/humanizer/core.py`) when adding new replacement rules.
- Add or update tests in `tests/test_core.py` for any behavior change.
- Update `README.md` if the public API or CLI flags change.

## Tests

Run the full test suite before opening a pull request:

```bash
pytest
```

## Pull requests

Use the matching PR template under `.github/PULL_REQUEST_TEMPLATE/` when
one fits your change (new rewrite rule, update to an existing rule, or
documentation-only change). Describe the change with a before/after example
where relevant, and make sure `pytest` passes.

## Reporting issues

Use the issue templates under `.github/ISSUE_TEMPLATE/` to suggest a new
rewrite rule/capability, or open a blank issue for anything else (bug
reports, questions).
