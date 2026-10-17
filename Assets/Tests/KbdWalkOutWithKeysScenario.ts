import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {runWalkOutWithKeys} from "./KbdDoorChecks"

@component
export class KbdWalkOutWithKeysScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await runWalkOutWithKeys()
  }
}
