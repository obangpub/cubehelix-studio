## Summary

<!-- One or two sentences on what this PR does and why. -->

## Scope

<!-- Check all that apply. -->

- [ ] `@cubehelix-studio/core` (TypeScript)
- [ ] `cubehelix-studio` (Python)
- [ ] `@cubehelix-studio/web`
- [ ] Parity fixture / shared math
- [ ] Tooling, CI, or docs

## Parity

<!-- Required if this PR changes cubehelix math in either implementation. -->

- [ ] Not applicable — no math changes
- [ ] Updated both `packages/core/src/cubehelix.ts` and `packages/python/src/cubehelix_studio/cubehelix.py`
- [ ] Regenerated `fixtures/parity.json` via `pnpm tsx scripts/generate-parity-fixture.ts`
- [ ] Both test suites pass against the regenerated fixture

## Testing

<!-- What did you run? Any manual verification (e.g., web app smoke test)? -->

## Notes for reviewers

<!-- Anything reviewers should pay particular attention to: tradeoffs, follow-up work, alternatives considered. Delete the section if there's nothing to add. -->
