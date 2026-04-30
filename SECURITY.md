# Security Policy

## Reporting a vulnerability

If you believe you have found a security vulnerability in any part of Cubehelix Studio — `@cubehelix-studio/core`, `cubehelix-studio` (Python), or `@cubehelix-studio/web` — please report it privately rather than opening a public issue.

Use GitHub's private vulnerability reporting:

1. Go to the repository's **Security** tab.
2. Click **Report a vulnerability**.
3. Provide a description, reproduction steps, affected versions, and any relevant logs or proof of concept.

Alternatively, email the maintainer at the address listed on the GitHub profile of the repository owner.

Please include:

- The package and version affected
- A description of the issue and its potential impact
- Steps to reproduce, or a minimal proof of concept
- Any suggested mitigations, if known

## Response

The maintainer will acknowledge receipt within seven days, work with you on a fix, and coordinate disclosure. Fixes are released as patch versions on the affected package(s); credit is given in release notes if you would like to be acknowledged.

## Scope

In scope:

- The published `@cubehelix-studio/core` npm package
- The published `cubehelix-studio` PyPI package
- The deployed `@cubehelix-studio/web` application
- Build and release workflows in this repository

Out of scope:

- Vulnerabilities in upstream dependencies (please report those to the relevant project; if the fix requires action here, file an issue once the upstream advisory is public)
- Issues that require physical access to a user's device
- Findings from automated scanners without a demonstrated impact

## Supply chain

This repository pins external dependencies and verifies integrity:

- npm and PyPI dependencies are locked with integrity hashes (`pnpm-lock.yaml`, `uv.lock`).
- GitHub Actions are pinned to commit SHAs.
- Releases use OIDC-based trusted publishing (npm provenance and PyPI Trusted Publisher) — no long-lived tokens.

If you spot a supply-chain concern (a missing pin, a weakened verification step, a suspicious dependency), please report it through the same channel.
