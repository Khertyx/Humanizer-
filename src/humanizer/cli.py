"""Command-line interface for humanizer."""

from __future__ import annotations

import argparse
import sys

from .core import HumanizeOptions, humanize


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="humanizer",
        description="Rewrite text to reduce repetitive, formulaic AI-sounding phrasing.",
    )
    parser.add_argument(
        "input",
        nargs="?",
        type=argparse.FileType("r"),
        default=sys.stdin,
        help="File to read input text from (defaults to stdin).",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=argparse.FileType("w"),
        default=sys.stdout,
        help="File to write output text to (defaults to stdout).",
    )
    parser.add_argument(
        "--no-contractions",
        action="store_false",
        dest="contractions",
        help="Don't convert phrases like 'it is' to 'it's'.",
    )
    parser.add_argument(
        "--no-vary-starts",
        action="store_false",
        dest="vary_sentence_starts",
        help="Don't vary repeated sentence openers.",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducible output.",
    )
    args = parser.parse_args(argv)

    text = args.input.read()
    options = HumanizeOptions(
        contractions=args.contractions,
        vary_sentence_starts=args.vary_sentence_starts,
        seed=args.seed,
    )
    args.output.write(humanize(text, options))
    if args.output is not sys.stdout:
        args.output.write("\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
