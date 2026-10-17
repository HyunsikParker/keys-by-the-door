// Out-of-view hint (brief "When things show"): if the user is turned away from
// the hallway when the reminder appears, a chime plays and a small arrow points
// to it; facing the hallway again hides the arrow. Test-only.
import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {
  frames, getCamera, getController, log, resetLens, restoreCamera, snapshotCamera, waitUntil,
} from "./KbdTestUtils"

const TURN_AWAY_DEG = 90 // well past the controller's 25° out-of-view angle

function setCameraYaw(deg: number): void {
  getCamera().getTransform().setWorldRotation(quat.angleAxis((deg * Math.PI) / 180, vec3.up()))
}

function cameraYawObserved(deg: number): boolean {
  const fwd = getCamera().getTransform().getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
  const want = quat.angleAxis((deg * Math.PI) / 180, vec3.up()).multiplyVec3(new vec3(0, 0, -1))
  return fwd.dot(want) > 0.999
}

/** Turn the real camera; pause DeviceTracking only if it overwrites the rotation. */
async function turnCamera(deg: number, tracking: DeviceTracking | null): Promise<boolean> {
  setCameraYaw(deg)
  await frames(3)
  if (cameraYawObserved(deg)) return false
  if (!tracking) throw new Error(`Camera yaw ${deg}° not observed and no DeviceTracking to pause`)
  tracking.enabled = false
  setCameraYaw(deg)
  await frames(3)
  if (!cameraYawObserved(deg)) throw new Error(`Camera yaw ${deg}° not observed even with DeviceTracking paused`)
  return true
}

@component
export class KbdOutOfViewArrowScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    const ctrl = getController()
    const arrowObj = findSceneObjectByName("DirectionArrow")
    if (!arrowObj) throw new Error(`SceneObject "DirectionArrow" not found`)
    const tracking = getCamera().getComponent("Component.DeviceTracking") as DeviceTracking
    const cam = snapshotCamera()
    let pausedHere = false
    try {
      await resetLens(ctrl)
      expect(ctrl.state).toBe("waiting")

      // Before 08:00: turn away from the hallway.
      pausedHere = await turnCamera(TURN_AWAY_DEG, tracking)
      log(`turned camera ${TURN_AWAY_DEG}° away (DeviceTracking paused: ${pausedHere})`)
      expect(ctrl.cardInView).toBe(false)
      expect(ctrl.arrowVisible).toBe(false)
      const chimeBefore = ctrl.chimePlayCount

      // Let the demo clock tick across 08:00 in real time.
      ctrl.debugSetClockSeconds(ctrl.commuteSeconds - 2)
      await waitUntil(() => ctrl.state === "reminding", 5000, "state reminding")
      await frames(2)
      log(`reminder appeared at ${ctrl.demoClockText}; chime ${chimeBefore} → ${ctrl.chimePlayCount}, arrow=${ctrl.arrowVisible}`)
      expect(ctrl.arrowVisible).toBe(true)
      expect(arrowObj.enabled).toBe(true)
      expect(ctrl.chimePlayCount).toBeGreaterThan(chimeBefore)
      expect(ctrl.chimePlayCount >= 1).toBe(true)

      // Face the hallway again (-Z): the arrow goes away.
      await turnCamera(0, tracking)
      await frames(2)
      log(`faced hallway: cardInView=${ctrl.cardInView}, arrow=${ctrl.arrowVisible}`)
      expect(ctrl.cardInView).toBe(true)
      expect(ctrl.arrowVisible).toBe(false)
      expect(arrowObj.enabled).toBe(false)
      expect(ctrl.state).toBe("reminding")
    } finally {
      await restoreCamera(cam)
      if (tracking && !tracking.enabled) tracking.enabled = true
      await resetLens(ctrl)
    }
  }
}
