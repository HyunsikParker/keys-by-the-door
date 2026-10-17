// Criteria 3 and 4 — walking toward / out the front door.
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {nextFrame, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {
  frames, getCardObject, getCardUI, getController, log, moveUserToZ, resetLens,
  restoreCamera, showReminderFast, snapshotCamera,
} from "./KbdTestUtils"

const APPROACH_Z = -150
const OUTSIDE_Z = -330

async function sampleBounce(n: number): Promise<{offsets: number[]; ys: number[]; bouncing: boolean[]}> {
  const ctrl = getController()
  const t = getCardObject().getTransform()
  const offsets: number[] = []
  const ys: number[] = []
  const bouncing: boolean[] = []
  for (let i = 0; i < n; i++) {
    await nextFrame()
    offsets.push(ctrl.bounceOffsetCm)
    ys.push(t.getLocalPosition().y)
    bouncing.push(ctrl.isBouncing)
  }
  return {offsets, ys, bouncing}
}

const range = (a: number[]) => Math.max(...a) - Math.min(...a)

/** 3: approach without keys → card bounces. */
export async function runApproachBounce(): Promise<void> {
  const ctrl = getController()
  const cam = snapshotCamera()
  try {
    await resetLens(ctrl)
    await showReminderFast(ctrl)
    expect(ctrl.isBouncing).toBe(false)
    expect(ctrl.headingForDoor).toBe(false)
    const baseY = getCardObject().getTransform().getLocalPosition().y

    const how = await moveUserToZ(ctrl, APPROACH_Z)
    log(`approach movement method: ${how}`)
    expect(ctrl.state).toBe("reminding")
    expect(ctrl.headingForDoor).toBe(true)
    expect(ctrl.isBouncing).toBe(true)
    expect(ctrl.distanceToDoorCm < 220).toBe(true)
    expect(ctrl.distanceToDoorCm > 0).toBe(true)

    const s = await sampleBounce(20)
    log(`bounce offsets: ${s.offsets.map((v) => v.toFixed(2)).join(",")}`)
    log(`card local y: ${s.ys.map((v) => v.toFixed(2)).join(",")}`)
    expect(s.bouncing.every((b) => b)).toBe(true)
    expect(range(s.offsets)).toBeGreaterThan(0.5)
    expect(range(s.ys)).toBeGreaterThan(0.5)
    expect(Math.max(...s.ys)).toBeGreaterThan(baseY + 0.5)
    expect(getCardUI().currentMode).toBe("urgent")
  } finally {
    await restoreCamera(cam)
    await resetLens(ctrl)
  }
}

/** 3-control: keys taken, approaching does NOT bounce. */
export async function runApproachWithKeysNoBounce(): Promise<void> {
  const ctrl = getController()
  const cam = snapshotCamera()
  try {
    await resetLens(ctrl)
    await showReminderFast(ctrl)
    ctrl.markKeysTaken() // setup only for this control case
    await frames(2)
    expect(ctrl.state).toBe("keysTaken")
    const baseY = getCardObject().getTransform().getLocalPosition().y

    const how = await moveUserToZ(ctrl, APPROACH_Z)
    log(`control approach movement method: ${how}`)
    expect(ctrl.distanceToDoorCm < 220).toBe(true)
    expect(ctrl.headingForDoor).toBe(false)
    const s = await sampleBounce(20)
    log(`control offsets: ${s.offsets.map((v) => v.toFixed(2)).join(",")}`)
    expect(s.bouncing.some((b) => b)).toBe(false)
    expect(Math.max(...s.offsets)).toBeCloseTo(0, 2)
    expect(range(s.ys)).toBeCloseTo(0, 2)
    expect(s.ys[0]).toBeCloseTo(baseY, 2)
    expect(ctrl.state).toBe("keysTaken")
    expect(getCardUI().currentMode).toBe("taken")
  } finally {
    await restoreCamera(cam)
    await resetLens(ctrl)
  }
}

async function walkOut(keys: boolean): Promise<void> {
  const ctrl = getController()
  const cam = snapshotCamera()
  try {
    await resetLens(ctrl)
    await showReminderFast(ctrl)
    if (keys) {
      ctrl.markKeysTaken() // setup only
      await frames(2)
      expect(ctrl.state).toBe("keysTaken")
    }
    expect(getCardObject().enabled).toBe(true)
    const how = await moveUserToZ(ctrl, OUTSIDE_Z)
    log(`walk-out (keys=${keys}) movement method: ${how}`)
    await frames(2)
    expect(ctrl.distanceToDoorCm < -10).toBe(true)
    expect(ctrl.state).toBe("left")
    expect(ctrl.hasLeft).toBe(true)
    expect(ctrl.reminderVisible).toBe(false)
    expect(ctrl.isBouncing).toBe(false)
    expect(getCardObject().enabled).toBe(false)
    expect(ctrl.keysTaken).toBe(keys)
  } finally {
    await restoreCamera(cam)
    await resetLens(ctrl)
  }
}

/** 4a: walk out without keys → reminder disappears. */
export async function runWalkOutNoKeys(): Promise<void> {
  await walkOut(false)
}

/** 4b: walk out with keys → reminder disappears. */
export async function runWalkOutWithKeys(): Promise<void> {
  await walkOut(true)
}
