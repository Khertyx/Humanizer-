from humanizer.core import HumanizeOptions, humanize


def test_replaces_cliches():
    text = "In conclusion, we utilize a plethora of tools."
    result = humanize(text, HumanizeOptions(seed=1, vary_sentence_starts=False))
    assert "utilize" not in result.lower()
    assert "plethora" not in result.lower()
    assert "in conclusion" not in result.lower()


def test_cliche_replacement_preserves_capitalization():
    text = "Furthermore, the plan works."
    result = humanize(text, HumanizeOptions(seed=1, vary_sentence_starts=False))
    assert result[0].isupper()


def test_contractions_applied():
    text = "It is not clear that we can not do it."
    result = humanize(text, HumanizeOptions(seed=1, vary_sentence_starts=False))
    assert "it's" in result.lower()
    assert "can't" in result.lower()


def test_contractions_can_be_disabled():
    text = "It is raining."
    result = humanize(text, HumanizeOptions(contractions=False, vary_sentence_starts=False))
    assert result == "It is raining."


def test_deterministic_with_seed():
    text = "In conclusion, furthermore, we must delve into a plethora of ideas."
    first = humanize(text, HumanizeOptions(seed=42))
    second = humanize(text, HumanizeOptions(seed=42))
    assert first == second


def test_empty_string():
    assert humanize("") == ""
