// KeysByTheDoorController — single owner of all "Keys by the Door" state.
//
// Owns: the demo clock, the reminder state machine
//   waiting → reminding → keysTaken → left   (or waiting/reminding → left),
//   the "heading for the door" check, the card bounce, the out-of-view arrow
//   and the chime. Reads the user position from the main Camera every frame.
// Inputs: Camera + FrontDoor SceneObjects, the two UI views, the arrow, the chime
//   track, and the tunable thresholds below.
// Must NOT: author UI (text/buttons live in the *UI.ts views) or build the stand-in
//   hallway (it is authored in the scene).
//
// Public read-only API for tests (LEAF): state, keysTaken, isBouncing,
//   reminderVisible, hasLeft, headingForDoor, arrowVisible, cardInView,
//   demoClockText, demoClockSeconds, commuteSeconds, secondsUntilCommute,
//   distanceToDoorCm, userPosition, chimePlayCount.
// Public methods: markKeysTaken(), debugAdvanceClock(s), debugSetClockSeconds(s),
//   debugSetUserPosition(x,y,z), debugClearUserPosition(), debugReset().

import {KeysByTheDoorReminderCardUI, CardMode} from "./KeysByTheDoorReminderCardUI"
import {KeysByTheDoorClockUI} from "./KeysByTheDoorClockUI"
import {KeysByTheDoorDirectionArrow} from "./KeysByTheDoorDirectionArrow"

export type KeysState = "waiting" | "reminding" | "keysTaken" | "left"

const TAG = "[KeysByTheDoor]"

@component
export class KeysByTheDoorController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">KeysByTheDoorController – reminder state, demo clock, door logic</span>')
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">References</span>')
  @ui.group_start("References")
  @input
  @hint("Main camera SceneObject; its world position is the user's position")
  cameraObject!: SceneObject

  @input
  @hint("Front door SceneObject; its local +Z faces into the hallway (toward the user)")
  frontDoor!: SceneObject

  @input
  @hint("Car-keys reminder card view (KeysReminderCard)")
  reminderCard!: KeysByTheDoorReminderCardUI

  @input
  @hint("Demo clock view in the living room")
  clockPanel!: KeysByTheDoorClockUI

  @input
  @hint("Out-of-view hint arrow (DirectionArrow)")
  directionArrow!: KeysByTheDoorDirectionArrow

  @input
  @allowUndefined
  @hint("Soft chime played when the reminder appears out of view (optional)")
  chimeTrack: AudioTrackAsset
  @ui.group_end
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Settings</span>')
  @ui.group_start("Settings")
  @input
  @hint("Commute time, HH:MM (24 h). The reminder shows when the demo clock reaches it.")
  commuteTime: string = "08:00"

  @input
  @hint("Demo clock starts this many seconds before the commute time")
  @widget(new SliderWidget(0, 600, 1))
  clockLeadSeconds: number = 60

  @input
  @hint("Demo clock speed (1 = real time)")
  @widget(new SliderWidget(0.1, 20, 0.1))
  clockSpeed: number = 1

  @input
  @hint("Heading for the door = closer than this to the door plane (cm, measured along the hallway)")
  @widget(new SliderWidget(50, 300, 5))
  approachDistanceCm: number = 220

  @input
  @hint("Left for work = this far past the door plane (cm)")
  @widget(new SliderWidget(0, 60, 1))
  passMarginCm: number = 10

  @input
  @hint("Card counts as out of view when it is more than this many degrees off the view direction")
  @widget(new SliderWidget(10, 60, 1))
  outOfViewAngleDeg: number = 25

  @input
  @hint("Bounce height of the card (cm)")
  @widget(new SliderWidget(0.5, 10, 0.5))
  bounceHeightCm: number = 4

  @input
  @hint("Bounces per second")
  @widget(new SliderWidget(0.5, 5, 0.1))
  bounceHz: number = 2

  @input
  @hint("Chime volume")
  @widget(new SliderWidget(0, 1, 0.05))
  chimeVolume: number = 0.6
  @ui.group_end
  @ui.separator
  @ui.label('<span style="color: #60A5FA;">Debug</span>')
  @ui.group_start("Debug")
  @input
  @hint("Print state changes to the log")
  debugLogs: boolean = true
  @ui.group_end

  private _state: KeysState = "waiting"
  private _keysTaken = false
  private _heading = false
  private _cardInView = true
  private _arrowVisible = false
  private _clockSeconds = 0
  private _commuteSeconds = 8 * 3600
  private _signedDoorDist = 0
  private _userPos: vec3 = vec3.zero()
  private _userOverride: vec3 | null = null
  private _chimeCount = 0
  private _bounceTime = 0
  private _bounceOffset = 0
  private _cardBaseLocal: vec3 = vec3.zero()
  private _lastClockText = ""
  private audio: AudioComponent | null = null

  // ── Read-only state for tests ──────────────────────────────────────────
  get state(): KeysState { return this._state }
  get keysTaken(): boolean { return this._keysTaken }
  get isBouncing(): boolean { return this._state === "reminding" && this._heading }
  get reminderVisible(): boolean { return this._state === "reminding" || this._state === "keysTaken" }
  get hasLeft(): boolean { return this._state === "left" }
  get headingForDoor(): boolean { return this._heading }
  get arrowVisible(): boolean { return this._arrowVisible }
  get cardInView(): boolean { return this._cardInView }
  get demoClockSeconds(): number { return this._clockSeconds }
  get demoClockText(): string { return KeysByTheDoorController.format(this._clockSeconds, true) }
  get commuteSeconds(): number { return this._commuteSeconds }
  get secondsUntilCommute(): number { return this._commuteSeconds - this._clockSeconds }
  /** Signed distance from the door plane along the hallway (cm): + = still inside, − = past the door. */
  get distanceToDoorCm(): number { return this._signedDoorDist }
  get userPosition(): vec3 { return this._userPos }
  get chimePlayCount(): number { return this._chimeCount }
  get bounceOffsetCm(): number { return this._bounceOffset }

  onAwake() {
    if (!this.cameraObject || !this.frontDoor || !this.reminderCard || !this.clockPanel || !this.directionArrow) {
      print(`${TAG} ERROR: a required @input is not wired (cameraObject, frontDoor, reminderCard, clockPanel, directionArrow).`)
      return
    }
    this._commuteSeconds = KeysByTheDoorController.parseTime(this.commuteTime, 8 * 3600)
    this._clockSeconds = this._commuteSeconds - this.clockLeadSeconds
    this._cardBaseLocal = this.reminderCard.getSceneObject().getTransform().getLocalPosition()

    if (this.chimeTrack) {
      this.audio = this.sceneObject.createComponent("Component.AudioComponent") as AudioComponent
      this.audio.audioTrack = this.chimeTrack
      this.audio.volume = this.chimeVolume
      this.audio.playbackMode = Audio.PlaybackMode.LowLatency
    }

    // The card's own fields are initialised after this onAwake (it sits lower in the
    // hierarchy), so subscribe to its event and start the frame loop on start.
    this.createEvent("OnStartEvent").bind(() => {
      this.reminderCard.onHaveKeys.add(() => this.markKeysTaken())
      this.createEvent("UpdateEvent").bind(() => this.onUpdate())
    })
    this.log(`ready: demo clock ${this.demoClockText}, commute ${KeysByTheDoorController.format(this._commuteSeconds, false)}`)
  }

  // ── Public actions ─────────────────────────────────────────────────────
  /** Same as pinching "I have my keys". Only acts while the reminder is showing. */
  markKeysTaken(): void {
    if (this._state !== "reminding") {
      this.log(`markKeysTaken ignored in state ${this._state}`)
      return
    }
    this._keysTaken = true
    this.setState("keysTaken")
  }

  /** Jump the demo clock forward (tests: avoid waiting 60 real seconds). */
  debugAdvanceClock(seconds: number): void {
    this._clockSeconds += seconds
    this.log(`clock advanced by ${seconds}s → ${this.demoClockText}`)
  }

  debugSetClockSeconds(secondsSinceMidnight: number): void {
    this._clockSeconds = secondsSinceMidnight
  }

  /** Use a fixed user position instead of the camera (tests). */
  debugSetUserPosition(x: number, y: number, z: number): void {
    this._userOverride = new vec3(x, y, z)
  }

  debugClearUserPosition(): void {
    this._userOverride = null
  }

  /** Back to the start: clock at commute − lead, keys not taken, card hidden. */
  debugReset(): void {
    this._keysTaken = false
    this._heading = false
    this._userOverride = null
    this._clockSeconds = this._commuteSeconds - this.clockLeadSeconds
    this.setState("waiting")
  }

  // ── Frame loop ─────────────────────────────────────────────────────────
  private onUpdate(): void {
    const dt = getDeltaTime()
    this._clockSeconds += dt * this.clockSpeed

    const camT = this.cameraObject.getTransform()
    const camPos = camT.getWorldPosition()
    const camRot = camT.getWorldRotation()
    this._userPos = this._userOverride ? this._userOverride : camPos

    const doorT = this.frontDoor.getTransform()
    const doorFwd = doorT.getWorldRotation().multiplyVec3(new vec3(0, 0, 1))
    const toUser = this._userPos.sub(doorT.getWorldPosition())
    this._signedDoorDist = toUser.x * doorFwd.x + toUser.z * doorFwd.z

    // Transitions
    if (this._state !== "left" && this._signedDoorDist < -this.passMarginCm) {
      this.setState("left")
    } else if (this._state === "waiting" && this._clockSeconds >= this._commuteSeconds) {
      this.setState("reminding")
    }

    this._heading = this._state === "reminding" && this._signedDoorDist < this.approachDistanceCm

    // Is the card in view?
    const cardPos = this.cardWorldBase()
    const toCard = cardPos.sub(this._userPos)
    const fwd = camRot.multiplyVec3(new vec3(0, 0, -1))
    const len = toCard.length
    const cosA = len > 0.001 ? toCard.dot(fwd) / len : 1
    this._cardInView = cosA >= Math.cos((this.outOfViewAngleDeg * Math.PI) / 180)

    this.applyView(dt, camPos, camRot, cardPos)
  }


  private setState(next: KeysState): void {
    if (next === this._state) return
    const prev = this._state
    this._state = next
    this.log(`state ${prev} → ${next} (clock ${this.demoClockText}, door dist ${this._signedDoorDist.toFixed(0)} cm)`)
    if (next === "reminding") this.onReminderShown()
  }

  private onReminderShown(): void {
    const camT = this.cameraObject.getTransform()
    const toCard = this.cardWorldBase().sub(this._userPos)
    const fwd = camT.getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
    const len = toCard.length
    const inView = len < 0.001 || toCard.dot(fwd) / len >= Math.cos((this.outOfViewAngleDeg * Math.PI) / 180)
    this._cardInView = inView
    if (!inView) {
      this._chimeCount++
      if (this.audio) this.audio.play(1)
      this.log("reminder appeared out of view → chime + arrow")
    }
  }

  private applyView(dt: number, camPos: vec3, camRot: quat, cardPos: vec3): void {
    const visible = this.reminderVisible
    this.reminderCard.setVisible(visible)

    // Card mode
    let mode: CardMode = "reminding"
    if (this._state === "keysTaken") mode = "taken"
    else if (this.isBouncing) mode = "urgent"
    if (this.reminderCard.currentMode !== mode) this.reminderCard.setMode(mode)

    // Bounce (sine bob on the card root)
    if (this.isBouncing) {
      this._bounceTime += dt
      this._bounceOffset = this.bounceHeightCm * Math.abs(Math.sin(Math.PI * this.bounceHz * this._bounceTime))
    } else {
      this._bounceTime = 0
      this._bounceOffset = Math.max(0, this._bounceOffset - dt * 40)
    }
    const base = this._cardBaseLocal
    this.reminderCard.getSceneObject().getTransform()
      .setLocalPosition(new vec3(base.x, base.y + this._bounceOffset, base.z))

    // Clock text (card + living-room panel)
    const clock = this.demoClockText
    if (clock !== this._lastClockText) {
      this._lastClockText = clock
      const commute = KeysByTheDoorController.format(this._commuteSeconds, false)
      this.reminderCard.setClock(`${clock}  ·  leave ${commute}`)
      const left = this.secondsUntilCommute
      let status: string
      if (this._state === "left") status = "Left for work"
      else if (this._state === "keysTaken") status = "Keys taken"
      else if (left > 0) status = `Leave at ${commute} (in ${Math.ceil(left)} s)`
      else status = "Time to leave!"
      this.clockPanel.setClock(clock, status)
    }

    // Out-of-view arrow
    this._arrowVisible = this._state === "reminding" && !this._cardInView
    this.directionArrow.setVisible(this._arrowVisible)
    if (this._arrowVisible) this.directionArrow.pointAt(camPos, camRot, cardPos)
  }

  private cardWorldBase(): vec3 {
    const parent = this.reminderCard.getSceneObject().getParent()
    if (!parent) return this._cardBaseLocal
    // Base (un-bounced) position in world space.
    return parent.getTransform().getWorldTransform().multiplyPoint(this._cardBaseLocal)
  }

  private log(msg: string): void {
    if (this.debugLogs) print(`${TAG} ${msg}`)
  }

  static parseTime(text: string, fallback: number): number {
    const m = /^\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/.exec(text || "")
    if (!m) return fallback
    return parseInt(m[1], 10) * 3600 + parseInt(m[2], 10) * 60 + (m[3] ? parseInt(m[3], 10) : 0)
  }

  static format(totalSeconds: number, withSeconds: boolean): string {
    let s = Math.floor(totalSeconds)
    s = ((s % 86400) + 86400) % 86400
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const pad = (n: number) => (n < 10 ? "0" + n : "" + n)
    return withSeconds ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}`
  }
}
