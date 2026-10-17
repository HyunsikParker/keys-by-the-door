// Shared helpers for the "Keys by the Door" LEAF scenarios (test-only).
import {findSceneObjectByName, nextFrame, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {KeysByTheDoorController} from "../Scripts/KeysByTheDoorController"
import {KeysByTheDoorReminderCardUI} from "../Scripts/KeysByTheDoorReminderCardUI"

export const TEST_TAG = "[KBD-TEST]"

export function log(msg: string): void {
  print(`${TEST_TAG} ${msg}`)
}

function mustFind(name: string): SceneObject {
  const so = findSceneObjectByName(name)
  if (!so) throw new Error(`SceneObject "${name}" not found`)
  return so
}

export function getController(): KeysByTheDoorController {
  const c = mustFind("KeysByTheDoorController").getComponent(
    KeysByTheDoorController.getTypeName(),
  ) as KeysByTheDoorController
  if (!c) throw new Error("KeysByTheDoorController component not found")
  return c
}

export function getCardObject(): SceneObject {
  return mustFind("KeysReminderCard")
}

export function getCardUI(): KeysByTheDoorReminderCardUI {
  const ui = getCardObject().getComponent(
    KeysByTheDoorReminderCardUI.getTypeName(),
  ) as KeysByTheDoorReminderCardUI
  if (!ui) throw new Error("KeysByTheDoorReminderCardUI component not found")
  return ui
}

export function getCamera(): SceneObject {
  return mustFind("Camera Object")
}

export function getDoor(): SceneObject {
  return mustFind("FrontDoor")
}

export async function frames(n: number): Promise<void> {
  for (let i = 0; i < n; i++) await nextFrame()
}

export async function waitUntil(cond: () => boolean, timeoutMs: number, what: string): Promise<void> {
  const start = getTime()
  while (!cond()) {
    if ((getTime() - start) * 1000 > timeoutMs) throw new Error(`Timed out after ${timeoutMs} ms waiting for: ${what}`)
    await nextFrame()
  }
}

/** Snapshot of the camera transform so it can be restored after a scenario. */
export type CamSnapshot = {pos: vec3; rot: quat}

export function snapshotCamera(): CamSnapshot {
  const t = getCamera().getTransform()
  return {pos: t.getWorldPosition(), rot: t.getWorldRotation()}
}

function getTracking(): DeviceTracking | null {
  return getCamera().getComponent("Component.DeviceTracking") as DeviceTracking
}

let pausedTracking = false

export async function restoreCamera(snap: CamSnapshot): Promise<void> {
  const t = getCamera().getTransform()
  t.setWorldPosition(snap.pos)
  t.setWorldRotation(snap.rot)
  const tr = getTracking()
  if (pausedTracking && tr) {
    tr.enabled = true
    pausedTracking = false
  }
  await frames(2)
}

/** Start every scenario from the same place: waiting, keys not taken, no override. */
export async function resetLens(ctrl: KeysByTheDoorController): Promise<void> {
  ctrl.debugClearUserPosition()
  ctrl.debugReset()
  await frames(3)
}

/**
 * Move the user to world z (keeping x/y of the camera) by moving the real
 * main Camera object. Returns "camera" if the controller saw the camera move.
 * If something (e.g. preview device tracking) overrides the camera transform,
 * falls back to debugSetUserPosition and returns "debug".
 */
export type MoveMethod = "camera" | "camera+trackingPaused" | "debug"

export async function moveUserToZ(
  ctrl: KeysByTheDoorController,
  z: number,
  allowFallback: boolean = true,
): Promise<MoveMethod> {
  const t = getCamera().getTransform()
  const p = t.getWorldPosition()
  const target = new vec3(p.x, p.y, z)
  const observed = () =>
    Math.abs(ctrl.userPosition.z - z) < 1 && Math.abs(t.getWorldPosition().z - z) < 1

  // 1) Plain move of the real camera.
  t.setWorldPosition(target)
  await frames(3)
  if (observed()) {
    log(`moved user via CAMERA to z=${z} (controller userPosition.z=${ctrl.userPosition.z.toFixed(1)})`)
    return "camera"
  }
  // 2) DeviceTracking writes the camera pose every frame in preview: pause it (test-only), move again.
  const tr = getTracking()
  if (tr) {
    tr.enabled = false
    pausedTracking = true
    t.setWorldPosition(target)
    await frames(3)
    if (observed()) {
      log(`moved user via CAMERA (DeviceTracking paused) to z=${z} (controller userPosition.z=${ctrl.userPosition.z.toFixed(1)})`)
      return "camera+trackingPaused"
    }
  }
  const camNow = t.getWorldPosition()
  if (!allowFallback) {
    throw new Error(`Camera move to z=${z} not observed: camera z=${camNow.z.toFixed(1)}, controller userPosition.z=${ctrl.userPosition.z.toFixed(1)}`)
  }
  log(`camera move NOT observed (camera z=${camNow.z.toFixed(1)}, user z=${ctrl.userPosition.z.toFixed(1)}) → FALLBACK debugSetUserPosition`)
  ctrl.debugSetUserPosition(target.x, target.y, target.z)
  await frames(3)
  return "debug"
}

/** Jump the demo clock to commute time and wait for the reminder. */
export async function showReminderFast(ctrl: KeysByTheDoorController): Promise<void> {
  ctrl.debugAdvanceClock(ctrl.secondsUntilCommute + 1)
  await waitUntil(() => ctrl.state === "reminding", 2000, "state reminding")
  await frames(2)
}

export async function settle(ms: number): Promise<void> {
  await sleep(ms)
}
