---
title: Promote Cueing Emulator; Course Layouts coming soon
---
# Promote Emulator; Course Layouts Coming Soon

## What & Why
The Cueing Emulator is ready for users but is currently hidden behind a "Coming Soon / not fully developed" warning dialog. That dialog should be removed so the emulator opens directly from the CueMaster Tools menu. The **Course Layouts** accordion inside the emulator (preset ball arrangements matching the card deck) is still incomplete and will be a purchasable add-on — it should remain visible but clearly marked as "Coming Soon" so users understand it is not yet available.

## Done looks like
- Clicking "Cueing Emulator" in the CueMaster Tools wrench dropdown opens the emulator immediately — no warning dialog appears
- Inside the emulator, the "Course Layouts" accordion section is still present and can be expanded, but its content is replaced with a brief "Coming Soon — purchasable add-on" notice (no preset buttons)
- Same behavior in the standalone HTML: emulator opens directly, Course Layouts shows a coming-soon placeholder
- No "Coming Soon" warning dialog exists anywhere in the emulator entry flow

## Out of scope
- Implementing any actual course layout presets
- Any changes to the emulator physics, canvas rendering, or other settings panels

## Tasks
1. **Remove the warning dialog gate in SplashScreen** — Delete the `showEmulatorWarning` state and its Dialog component; make the Cueing Emulator menu item open the emulator directly.

2. **Mark Course Layouts as Coming Soon in CueingEmulator** — Replace the preset-button accordion content with a short coming-soon notice; keep the AccordionTrigger visible with a "Coming Soon" badge.

3. **Same changes in standalone HTML** — Remove the `showEmulatorWarning` state and dialog overlay from the splash screen render; replace the Course Layouts section body in `rEmulator()` with a coming-soon placeholder.

## Relevant files
- `client/src/components/SplashScreen.tsx:29-31,44-46,124-149`
- `client/src/components/CueingEmulator.tsx:1084-1134`
- `standalone/index.html:189-190,363,375-383,1041`