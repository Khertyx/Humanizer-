# Humanizer

A small Python library and CLI that rewrites text to reduce repetitive,
formulaic phrasing common in AI-generated writing — stock transition words
("furthermore", "in conclusion"), stiff verb choices ("utilize"), and
repeated sentence openers. It applies conservative, rule-based edits and
does not change the meaning of the text or call out to any external service.

## Install

```bash
pip install -e .
```

## Library usage

```python
from humanizer import humanize, HumanizeOptions

text = "In conclusion, we utilize a plethora of tools. It is clear this works."
print(humanize(text))

# Reproducible output, contractions disabled
print(humanize(text, HumanizeOptions(seed=42, contractions=False)))
```

## CLI usage

```bash
humanizer input.txt -o output.txt
echo "In conclusion, we utilize many tools." | humanizer
```

Options:

- `--no-contractions` — don't convert phrases like "it is" to "it's".
- `--no-vary-starts` — don't vary repeated sentence openers.
- `--seed N` — random seed for reproducible output.

## Development

```bash
pip install -e ".[dev]"
pytest
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
