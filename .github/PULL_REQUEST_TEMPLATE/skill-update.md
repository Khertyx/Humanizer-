## Summary

<!-- Which existing rewrite rule / skill is being changed, and why? -->

## Example

<!-- Before/after example showing the change in behavior -->

```
Before this change:
After this change:
```

## Checklist

- [ ] Change is conservative and doesn't change the meaning of the text
- [ ] Any randomness goes through the seeded `random.Random` instance
- [ ] Replacement preserves capitalization (see `_match_case`)
- [ ] Existing tests updated to reflect the new behavior
- [ ] `README.md` updated if public API/CLI changed
- [ ] `pytest` passes locally
