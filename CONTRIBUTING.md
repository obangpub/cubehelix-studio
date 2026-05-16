# Contributing

Thanks for your interest in Cubehelix Studio. This document covers local setup, the parity contract between the two libraries, and what CI expects before a pull request can merge.

## Repository layout

```text
packages/core/      @cubehelix-studio/core (TypeScript, npm)
packages/python/    cubehelix-studio (PyPI)
apps/web/           @cubehelix-studio/web (Vite + React)
fixtures/           parity.json — shared cross-language test fixture
scripts/            parity fixture generator
```

The TypeScript and Python libraries are independent implementations of the same math. They are kept aligned by [`fixtures/parity.json`](fixtures/parity.json), which both test suites read.

## Prerequisites

- Node `>=22` (pinned in the repo's [`.nvmrc`](.nvmrc))
- pnpm (any recent version; the lockfile is `pnpm-lock.yaml`)
- Python `>=3.10`
- [uv](https://docs.astral.sh/uv/) for the Python package

## Setup

```bash
# JavaScript / TypeScript
pnpm install

# Python
cd packages/python
uv sync --all-extras
```

## Common tasks

```bash
# JS: run from repo root
pnpm -r typecheck
pnpm -r lint
pnpm -r test
pnpm -r build
pnpm exec prettier --check .

# Web app dev server
pnpm --filter @cubehelix-studio/web dev

# Python: run from packages/python
uv run pytest
uv run ruff check
uv run ruff format --check
uv run mypy src/
```

## Measuring performance

Profile against a production build, not the dev server. Dev-mode React adds
per-element instrumentation — owner-stack tracking via `console.createTask` and
the `jsxDEV` runtime — that inflates scripting time and can manufacture
bottlenecks that do not exist in production.

```bash
pnpm --filter @cubehelix-studio/web build
pnpm --filter @cubehelix-studio/web exec vite preview
```

Reproduce the slowness on the previewed build, with DevTools closed, before
diagnosing or optimizing.

## The parity contract

Both libraries must produce identical RGB output for identical inputs. [`fixtures/parity.json`](fixtures/parity.json) is the source of truth:

- The TypeScript implementation in [`packages/core/src/cubehelix.ts`](packages/core/src/cubehelix.ts) is canonical.
- [`scripts/generate-parity-fixture.ts`](scripts/generate-parity-fixture.ts) sweeps a grid of parameter combinations through the TS implementation and writes the fixture.
- Both test suites read the fixture and assert byte-identical RGB output across the same parameter sweep.

If you change the cubehelix math, the workflow is:

1. Update [`packages/core/src/cubehelix.ts`](packages/core/src/cubehelix.ts).
2. Mirror the change in [`packages/python/src/cubehelix_studio/cubehelix.py`](packages/python/src/cubehelix_studio/cubehelix.py).
3. Regenerate the fixture:
   ```bash
   pnpm tsx scripts/generate-parity-fixture.ts
   ```
4. Run both test suites and confirm parity passes on each side.
5. Commit the regenerated fixture in the same PR as the math change.

If you only change one implementation, the parity tests on the other side will fail; that is the intended check.

## Style and conventions

- TypeScript: ESLint + Prettier. Run `pnpm exec prettier --write .` before committing if formatting drifts.
- Python: Ruff for both linting and formatting; mypy for types.
- Commit messages: one line, present tense, scoped where useful (e.g., `feat(core): ...`, `fix(web): ...`). Recent history in `git log` shows the prevailing style.

## Pull requests

CI runs on every PR:

- [`ci-js.yml`](.github/workflows/ci-js.yml): typecheck, lint, prettier, tests, builds for `core` and `web`.
- [`ci-python.yml`](.github/workflows/ci-python.yml): ruff, mypy, pytest on Python 3.10, 3.11, and 3.12.

Workflows are path-filtered, so a Python-only change skips the JS workflow and vice versa. Changes that touch [`fixtures/`](fixtures/) trigger both.

Before opening a PR:

- Confirm the relevant test suite passes locally.
- If the change touches cubehelix math, confirm the parity fixture is regenerated and both suites pass.
- Keep the PR scoped — math changes, web app changes, and tooling changes are easier to review separately.

## Releases

Releases are tag-driven and run from [`release.yml`](.github/workflows/release.yml):

- `core-vX.Y.Z` → publish `@cubehelix-studio/core` to npm with provenance.
- `python-vX.Y.Z` → publish `cubehelix-studio` to PyPI via Trusted Publisher.

Tag format must match exactly. Both jobs also support `workflow_dispatch` for manual runs.

## Reporting issues

- Bugs and feature requests: open a GitHub issue with reproduction steps or a clear description of the desired behavior.
- Security issues: see [SECURITY.md](SECURITY.md) — please do not file a public issue.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE) that covers the rest of the project.
