# Keys by the Door

A SPECS Lens that makes sure you take your car keys when you leave for work.

At commute time a car-keys reminder appears in mid-air in the hallway, on the way to the front door. Pinch its big button once you have your keys. If you head for the door without pressing it, the reminder bounces up and down. Once you walk out of the front door, it disappears.

The Lens was planned with the Devpost Learn skill pack (`plan-lens`) and built by an AI coding agent through Snap's CLAD plugin and the Lens Studio MCP. Everything runs in Lens Studio's preview; no SPECS device was used.

## Run it

1. Open `SpecsBaseTemplate.esproj` in Lens Studio 5.24 or later.
2. Start the Interactive Preview. You start in a small living room facing a hallway that ends at a front door.
3. Controls: W/A/S/D to move, Q/E to go down and up, right-drag (or hold Shift) to look around, left click to pinch.
4. The demo clock starts at 07:59:00. At 08:00 the reminder appears in the hallway. Walk toward the door, press "I have my keys", and walk out.

## What it does

| Moment | What you see |
|---|---|
| 08:00 on the demo clock | The car-keys reminder appears 1.2 m in front of the door, a little below eye level |
| You are not looking at the hallway when it appears | A soft chime plays and a small arrow points toward the reminder |
| You walk toward the door without pressing the button | The reminder bounces up and down |
| You pinch "I have my keys" | The card changes to "Keys taken" and stops bouncing |
| You walk out past the front door | The reminder disappears |

In the real version the glasses would recognise the keys and the door. The preview cannot recognise real objects, so the Lens uses stand-ins: the button tells it you have your keys, a virtual hallway and front door stand in for your home, and a demo clock stands in for the time of day.

## Tests

Each done criterion in the design brief has LEAF scenarios, run in Lens Studio's preview (`Assets/Tests/`), plus one scenario for the out-of-view hint. All nine passed in the last run.

| Done criterion | Scenarios |
|---|---|
| 1. At commute time the reminder appears in the hallway by the front door | `kbd-1a-reminder-natural-tick`, `kbd-1b-reminder-fast-clock` |
| 2. Pinching the big button marks the car keys as taken | `kbd-2-pinch-have-keys`, `kbd-2ik-pinch-have-keys-ik` |
| 3. Walking toward the door without pressing the button makes the reminder bounce | `kbd-3-approach-bounce`, plus the control `kbd-3c-approach-with-keys-no-bounce` |
| 4. Walking out past the front door makes the reminder disappear | `kbd-4a-walk-out-no-keys`, `kbd-4b-walk-out-with-keys` |
| Out-of-view hint: turned away at 08:00, the arrow shows and the chime is requested; facing the hallway hides the arrow | `kbd-5-out-of-view-arrow` |

The tests check that the chime is requested, not that it can be heard.

## How it was made

- `devpost/design-brief.md`: the design brief written by the `plan-lens` interview and approved before the build.
- `.claude/`: the project's agent setup (the CLAD plugin enabled for this project and the `plan-lens` skill).
- `Assets/Scripts/`: `KeysByTheDoorController.ts` (demo clock, reminder state, door checks, bounce, chime and arrow), `KeysByTheDoorReminderCardUI.ts`, `KeysByTheDoorClockUI.ts`, `KeysByTheDoorDirectionArrow.ts`.
- Built with Spectacles Interaction Kit and Spectacles UI Kit; tests use LEAF. The hallway and door are built from primitive shapes, and the chime was generated offline.

## Limits

- Logic proven in the preview: the four done criteria and the out-of-view arrow.
- Feel unproven: whether a bouncing reminder catches your eye on real glasses without becoming annoying, and comfort over time.
- Not included: recognising real keys or doors, other items or a to-do list, and remembering anything between sessions.
