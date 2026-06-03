# ReliefGrid System QA

Checked on June 3, 2026 with the Codex in-app browser against `http://127.0.0.1:8031`.

## Browser Flows Tested

- App load at `/`: title, main UI, 4 response zones, 4 first-hour actions, canvas map, and no console errors.
- Scenario switching: Heatwave and Flood both load the expected incident, resources, zones, and top mission.
- Live signal editing: changing zone severity recalculates the top mission, impact score, map, and action plan.
- Copy brief: writes a complete `ReliefGrid dispatch brief` to the browser clipboard using a fallback path when the Clipboard API is permission-blocked.
- PNG export: creates a 1200 x 780 dispatch brief image and enables the download link.
- Save / reload: saved plan now reloads from `localStorage` and restores incident, resources, zones, and ranking.
- Reset: clears saved local plan and returns to the default heatwave scenario.
- Devpost handoff: 8 copy buttons, including Judge Summary, screenshot media, WebM video preload, pitch deck link, and category/fit copy all work.
- Demo video maker: preview render works, full WebM generation completed in browser, progress updates, blob preview, and download state all work.
- Responsive QA: `/`, `/devpost-handoff.html`, and `/demo-video-maker.html` were checked at 390 x 844 mobile and 1280 x 900 desktop with no horizontal overflow.

## Issues Found And Fixed

- `Save` wrote to `localStorage` but did not restore after reload. Added saved-plan loading, validation, and reset clearing.
- Exported dispatch receipt could stay stale after editing. State changes now hide stale export output.
- Demo video maker showed an active-looking download link before generation. Disabled state now prevents clicks and is visually muted.
- Demo video maker allowed repeat generation clicks during recording. Generate and preview controls now disable during generation.
- Mobile Devpost handoff truncated the tagline inside a single-line input. Tagline is now a compact readonly textarea.
- Zone card rendering used `innerHTML`. Rebuilt it with DOM APIs to avoid local saved-data HTML injection risk.
- In-app browser denied `navigator.clipboard.writeText` on the handoff page. Added a selection-based copy fallback and verified Judge Summary plus app `Copy brief` write to the clipboard.

## Remaining Submission Boundary

The local prototype and media package are ready. The required public GitHub repository, public/unlisted video URL, and any hosted live demo URL still need to be created by the user before final Devpost submission.
