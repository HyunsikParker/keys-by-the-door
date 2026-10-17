// Criterion 2 — pinching the big button marks the car keys as taken.
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractableByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {createIKInteractor} from "Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar"
import {KeysByTheDoorController} from "../Scripts/KeysByTheDoorController"
import {
  getCardObject, getCardUI, getController, log, resetLens, restoreCamera,
  showReminderFast, snapshotCamera, waitUntil,
} from "./KbdTestUtils"

function assertTaken(ctrl: KeysByTheDoorController): void {
  expect(ctrl.keysTaken).toBe(true)
  expect(ctrl.state).toBe("keysTaken")
  expect(ctrl.reminderVisible).toBe(true)
  expect(getCardObject().enabled).toBe(true)
  const ui = getCardUI()
  log(`card UI after pinch: mode=${ui.currentMode} title="${ui.currentTitle}"`)
  expect(ui.currentMode).toBe("taken")
  expect(ui.currentTitle).toBe("Keys taken")
}

/** 2: real SIK trigger on HaveKeysButton via DefaultLeafInteractor. */
export async function runPinchHaveKeys(): Promise<void> {
  const ctrl = getController()
  const cam = snapshotCamera()
  try {
    await resetLens(ctrl)
    expect(findInteractableByName("HaveKeysButton", undefined, true) === undefined).toBe(true)
    await showReminderFast(ctrl)
    expect(ctrl.keysTaken).toBe(false)
    expect(getCardUI().currentMode).toBe("reminding")

    const button = findInteractableByName("HaveKeysButton", undefined, true)
    if (!button) throw new Error("Interactable HaveKeysButton not found/enabled after reminder appeared")
    expect(button.getSceneObject().getParent().name).toBe("Content")
    expect(button.getSceneObject().getParent().getParent().name).toBe("KeysReminderCard")

    const interactor = new DefaultLeafInteractor()
    await interactor.trigger(button)
    await waitUntil(() => ctrl.keysTaken, 2000, "keysTaken after pinch")
    await sleep(200)
    assertTaken(ctrl)
  } finally {
    await restoreCamera(cam)
    await resetLens(ctrl)
  }
}

/** 2-IK (extra): same pinch driven by the IK avatar from the start position — reachability signal. */
export async function runPinchHaveKeysIK(): Promise<void> {
  const ctrl = getController()
  const cam = snapshotCamera()
  try {
    await resetLens(ctrl)
    await showReminderFast(ctrl)
    const button = findInteractableByName("HaveKeysButton", undefined, true)
    if (!button) throw new Error("Interactable HaveKeysButton not found/enabled after reminder appeared")
    const ik = createIKInteractor()
    await ik.trigger(button)
    await waitUntil(() => ctrl.keysTaken, 3000, "keysTaken after IK pinch")
    await sleep(200)
    assertTaken(ctrl)
  } finally {
    await restoreCamera(cam)
    await resetLens(ctrl)
  }
}
