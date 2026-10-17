// Criterion 1 — at commute time (08:00) the car-keys card appears in the hallway by the door.
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {KeysByTheDoorController} from "../Scripts/KeysByTheDoorController"
import {
  frames, getCamera, getCardObject, getController, getDoor, log, resetLens,
  restoreCamera, showReminderFast, snapshotCamera, waitUntil,
} from "./KbdTestUtils"

async function assertWaiting(ctrl: KeysByTheDoorController): Promise<void> {
  expect(ctrl.state).toBe("waiting")
  expect(ctrl.reminderVisible).toBe(false)
  expect(ctrl.keysTaken).toBe(false)
  expect(getCardObject().enabled).toBe(false)
  expect(ctrl.secondsUntilCommute).toBeGreaterThan(0)
}

function assertCardPlacement(startZ: number): void {
  const card = getCardObject().getTransform().getWorldPosition()
  const door = getDoor().getTransform().getWorldPosition()
  log(`card world=(${card.x.toFixed(1)}, ${card.y.toFixed(1)}, ${card.z.toFixed(1)}) door z=${door.z.toFixed(1)} start z=${startZ.toFixed(1)}`)
  // Between the user's start position and the front door, in the hallway.
  expect(card.z < startZ).toBe(true)
  expect(card.z > door.z).toBe(true)
  // ~1.2 m in front of the door (door z≈-300, card z≈-180).
  const gap = card.z - door.z
  expect(gap).toBeGreaterThan(100)
  expect(140).toBeGreaterThan(gap)
  // Mid-air: above the door object's origin (floor level) and roughly centered in the hallway.
  expect(card.y).toBeGreaterThan(door.y + 50)
  expect(Math.abs(card.x - door.x) < 50).toBe(true)
}

async function assertReminding(ctrl: KeysByTheDoorController, startZ: number): Promise<void> {
  expect(ctrl.state).toBe("reminding")
  expect(ctrl.reminderVisible).toBe(true)
  expect(ctrl.secondsUntilCommute <= 0).toBe(true)
  await frames(2)
  expect(getCardObject().enabled).toBe(true)
  assertCardPlacement(startZ)
}

/** 1a: real-time tick past 08:00 (clock set to commute − 2 s, then wait). */
export async function runReminderNaturalTick(): Promise<void> {
  const ctrl = getController()
  const cam = snapshotCamera()
  try {
    await resetLens(ctrl)
    await assertWaiting(ctrl)
    const startZ = getCamera().getTransform().getWorldPosition().z

    ctrl.debugSetClockSeconds(ctrl.commuteSeconds - 2)
    await frames(2)
    expect(ctrl.state).toBe("waiting")
    expect(ctrl.demoClockText).toBe("07:59:58")
    const t0 = getTime()
    await waitUntil(() => ctrl.state === "reminding", 5000, "natural tick to 08:00")
    const elapsed = getTime() - t0
    log(`natural tick: reminding after ${elapsed.toFixed(2)} s real time, clock ${ctrl.demoClockText}`)
    expect(elapsed).toBeGreaterThan(1.0)
    expect(ctrl.demoClockText.indexOf("08:00") === 0).toBe(true)
    await assertReminding(ctrl, startZ)
  } finally {
    await restoreCamera(cam)
    await resetLens(ctrl)
  }
}

/** 1b: jump the clock with debugAdvanceClock. */
export async function runReminderFastClock(): Promise<void> {
  const ctrl = getController()
  const cam = snapshotCamera()
  try {
    await resetLens(ctrl)
    await assertWaiting(ctrl)
    const startZ = getCamera().getTransform().getWorldPosition().z
    await showReminderFast(ctrl)
    await assertReminding(ctrl, startZ)
  } finally {
    await restoreCamera(cam)
    await resetLens(ctrl)
  }
}
