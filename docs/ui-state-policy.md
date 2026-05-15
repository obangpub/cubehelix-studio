# UI state policy (web app)

Every piece of UI state in `apps/web` falls into one of three tiers. The tier
decides whether the state is synced to the URL, persisted to `localStorage`,
and whether the header **Reset** button clears it. Classify new state by
answering two questions in order.

## Q1: Does this state describe the palette artifact itself?

Would two users with the same value see the same exported palette? Does it
belong in a shared link?

**Yes — Tier 1: document state.**

- Lives in `AppState` (`apps/web/src/lib/url-state.ts`).
- URL-synced via `encodeAppState` / `decodeAppState`.
- Cleared by Reset to `DEFAULT_APP_STATE` — Reset means "start a new palette."
- Members: `params`, `swatchCount`, `hueAuthoring`.

If the answer is no, continue to Q2.

## Q2: Is this a standing choice about the app or environment?

Something that should outlive any single palette — a theme, an accessibility
lens.

**Yes — Tier 2: workspace preference.**

- App- or component-local. Never URL-synced: a shared link must not impose the
  sender's environment on the recipient.
- Never cleared by Reset: Reset starts a new palette, not a new workspace.
- Persisted to `localStorage` only when it is a true standing preference;
  a Tier 2 member that is not a cross-visit preference simply goes unpersisted.
- Members: `appTheme`, `cubeTheme` (persisted); `previewMode` (a CVD preview
  lens — survives Reset like any Tier 2 state, but is not worth persisting
  across visits, so it is left in component state only).

**No — Tier 3: ephemeral or derived UI state.**

- Component-local. Never URL-synced, never persisted.
- Either derived from Tier 1 state or transient interaction state.
- Reset must return it to a clean default, because it describes the
  now-cleared palette or an interaction with it.
- Members: `userUnlinked`, `remembered`, the cube `view` / `snap` /
  `activePanel`, and `resetSignal` itself.

## Placement reference

| State                                | Tier | URL? | localStorage? | Reset clears?       |
| ------------------------------------ | ---- | ---- | ------------- | ------------------- |
| `params`                             | 1    | yes  | no            | yes                 |
| `swatchCount`                        | 1    | yes  | no            | yes                 |
| `hueAuthoring`                       | 1    | yes  | no            | yes                 |
| `appTheme`                           | 2    | no   | yes           | no                  |
| `cubeTheme`                          | 2    | no   | yes           | no                  |
| `previewMode`                        | 2    | no   | no            | no                  |
| `userUnlinked`                       | 3    | no   | no            | yes                 |
| `remembered`                         | 3    | no   | no            | yes                 |
| cube `view` / `snap` / `activePanel` | 3    | no   | no            | yes                 |
| `resetSignal`                        | 3    | no   | no            | n/a (the mechanism) |

## Clearing Tier 3 state on Reset

`handleReset` (`apps/web/src/App.tsx`) clears Tier 1 state and increments
`resetSignal`. A component holding Tier 3 state clears it on Reset in one of
two ways:

- **Remount via `key={resetSignal}`** — preferred for plain-React subtrees. It
  wipes all component-local state and re-seeds it from props, so any Tier 3
  state added later clears automatically. `ParamControls` uses this.
- **Consume `resetSignal` in a `useEffect`** — used where remounting is too
  costly, such as a WebGL scene that would re-initialize. `CubeVisualization`
  uses this to reset its camera and view toggles together.

When you add UI state, pick its tier with the two questions above, then wire
it to the matching mechanism. The policy is also summarized in comments above
`AppState` and `handleReset`.
