# Suppress autofill on player name inputs

## What & Why
Browser autofill is surfacing saved financial/personal data (credit cards, addresses) when users type in the player name fields on the setup screen. This is confusing and looks unprofessional. The inputs need attributes that tell browsers not to offer autofill suggestions.

## Done looks like
- Typing in a player name field no longer triggers a browser autofill dropdown
- Behaviour is consistent across Chrome, Safari, and Firefox on both desktop and mobile

## Out of scope
- Any other input fields in the app

## Steps
1. Add `autoComplete="off"` to the player name input in PlayerSetup. Also set `name` to a non-standard value (e.g. `"player-display-name"`) so browsers cannot infer the field type and override the autocomplete hint.

## Relevant files
- `client/src/components/PlayerSetup.tsx:166`
