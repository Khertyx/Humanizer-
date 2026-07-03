"""Rule-based rewriting to reduce repetitive, formulaic AI-sounding phrasing."""

from __future__ import annotations

import random
import re
from dataclasses import dataclass

# Stock phrases that show up disproportionately often in AI-generated text,
# mapped to more conversational alternatives.
_CLICHE_REPLACEMENTS: dict[str, list[str]] = {
    "in conclusion": ["overall", "in the end", "all things considered"],
    "furthermore": ["also", "on top of that", "what's more"],
    "moreover": ["also", "besides that", "what's more"],
    "additionally": ["also", "plus", "on top of that"],
    "it is important to note that": ["worth noting:", "keep in mind that", "note that"],
    "it is worth noting that": ["notably,", "worth noting,"],
    "in today's world": ["these days", "nowadays"],
    "utilize": ["use"],
    "utilizes": ["uses"],
    "utilizing": ["using"],
    "delve into": ["dig into", "look at", "explore"],
    "a plethora of": ["a lot of", "plenty of", "many"],
    "in order to": ["to"],
    "due to the fact that": ["because"],
    "at this point in time": ["now"],
    "on the other hand": ["that said", "then again"],
    "as previously mentioned": ["as noted earlier", "like I said"],
}

# Longer phrases must be matched before their substrings (e.g. "it is worth
# noting that" before a bare "utilize" could ever collide), so sort once.
_CLICHE_PATTERN = re.compile(
    "|".join(re.escape(p) for p in sorted(_CLICHE_REPLACEMENTS, key=len, reverse=True)),
    re.IGNORECASE,
)

_CONTRACTIONS: dict[str, str] = {
    "it is": "it's",
    "that is": "that's",
    "there is": "there's",
    "we are": "we're",
    "they are": "they're",
    "you are": "you're",
    "I am": "I'm",
    "do not": "don't",
    "does not": "doesn't",
    "did not": "didn't",
    "cannot": "can't",
    "can not": "can't",
    "will not": "won't",
    "has not": "hasn't",
    "have not": "haven't",
    "would not": "wouldn't",
    "should not": "shouldn't",
    "could not": "couldn't",
}

_CONTRACTION_PATTERN = re.compile(
    "|".join(r"\b" + re.escape(p) + r"\b" for p in _CONTRACTIONS), re.IGNORECASE
)

_SENTENCE_STARTERS = ["Also, ", "That said, ", "Beyond that, ", "On top of that, "]


@dataclass
class HumanizeOptions:
    """Options controlling how :func:`humanize` rewrites text."""

    contractions: bool = True
    vary_sentence_starts: bool = True
    seed: int | None = None


def _match_case(replacement: str, original: str) -> str:
    if original[:1].isupper():
        return replacement[:1].upper() + replacement[1:]
    return replacement


def _replace_cliches(text: str, rng: random.Random) -> str:
    def repl(match: re.Match[str]) -> str:
        phrase = match.group(0)
        options = _CLICHE_REPLACEMENTS[phrase.lower()]
        return _match_case(rng.choice(options), phrase)

    return _CLICHE_PATTERN.sub(repl, text)


def _apply_contractions(text: str) -> str:
    def repl(match: re.Match[str]) -> str:
        phrase = match.group(0)
        return _match_case(_CONTRACTIONS[phrase.lower()], phrase)

    return _CONTRACTION_PATTERN.sub(repl, text)


def _vary_sentence_starts(sentences: list[str], rng: random.Random) -> list[str]:
    seen_starts: dict[str, int] = {}
    result = []
    for sentence in sentences:
        if not sentence:
            result.append(sentence)
            continue
        first_word = sentence.split(" ", 1)[0].lower()
        seen_starts[first_word] = seen_starts.get(first_word, 0) + 1
        if seen_starts[first_word] > 1 and rng.random() < 0.5:
            starter = rng.choice(_SENTENCE_STARTERS)
            sentence = starter + sentence[0].lower() + sentence[1:]
        result.append(sentence)
    return result


def humanize(text: str, options: HumanizeOptions | None = None) -> str:
    """Rewrite ``text`` to reduce repetitive, formulaic AI-sounding phrasing.

    This applies conservative, rule-based edits (swapping stock transition
    phrases for conversational alternatives, contracting verb phrases, and
    varying repeated sentence openers) — it does not paraphrase meaning.
    """
    options = options or HumanizeOptions()
    rng = random.Random(options.seed)

    text = _replace_cliches(text, rng)

    if options.contractions:
        text = _apply_contractions(text)

    if options.vary_sentence_starts:
        sentences = re.split(r"(?<=[.!?])\s+", text)
        text = " ".join(_vary_sentence_starts(sentences, rng))

    return text
