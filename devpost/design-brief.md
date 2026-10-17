---
status: approved
---

# Design brief: Keys by the Door (working name, default)

## The one spatial moment
It is commute time and you are standing in the living room getting ready to go out. A car-keys reminder hangs in mid-air in the hallway on the way to the front door. When you have your keys, you pinch its big button. If you head for the door without pressing it, the reminder bounces up and down. Once you have left for work, it disappears.

## Why it belongs on glasses
- Uses: draws in the world; leaves your body free.
- Why it's better than the phone or laptop version: the reminder waits in the hallway you walk through on your way out, where you are already looking, and it reacts when you head for the door without your keys. A phone reminder goes off at a time, not at the door you are about to walk through.

## Product or overlay
- Type: overlay: it responds to something real (leaving for work with or without the car keys).
- What the real version would sense: whether you are carrying your car keys, and when you walk out of the front door.
- Stand-in for the preview: a big "I have my keys" button on the reminder replaces recognizing the keys; leaving means walking past a virtual front door at the end of a virtual hallway; commute time is a demo clock that starts one minute before the set commute time, 08:00 (default).

## Where things live
- Where the user is looking during the main task: around the living room while getting ready, then down the hallway toward the front door.
- Hallway and front door (stand-in scene): a virtual hallway, about 1.2 m wide, ending at a front door about 3 m from where the user starts (default).
- Car-keys reminder card: in mid-air in the hallway on the way to the front door, about 1.2 m in front of the door, a little below eye level (about 1.4 m above the floor), about 30 x 18 cm (default). It is anchored in place, so it stays where it is when you turn your head.
- "I have my keys" button: on the card, large (about 8 cm across) (default).

## Hands and input
- Confirm the car keys: pinch the big button on the reminder (a mouse click in the preview).
- Targets are big and highlight when aimed at.
- Voice (if any) and the button that does the same job: none.

## When things show
- Car-keys reminder: shows at commute time, hides once you have left for work (walked past the front door).
- After the button is pressed: the card shows the keys as taken until you leave (default).
- Heading for the front door without pressing the button: the reminder bounces up and down.
- If something needs attention out of view: when the reminder appears and you are not facing the hallway, a soft chime and a small arrow pointing toward it (default).

## Done criteria
Each one can be checked in Lens Studio's preview.
1. When the demo clock reaches commute time, the car-keys reminder appears in mid-air in the hallway by the front door.
2. Pinching the big button on the reminder marks the car keys as taken.
3. Walking toward the front door without pressing the button makes the reminder bounce.
4. Walking out past the front door makes the reminder disappear.

## Out of scope
- Recognizing the real keys or the real front door with the camera.
- Other items and the day's to-do list; this version covers the car keys (default, to confirm).
- Remembering anything across days, and reading a real calendar or commute schedule.

## Risks and open questions
- Feel unproven: whether a bouncing reminder catches your eye on real glasses without becoming annoying, and how the real version would know you are carrying the keys.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
