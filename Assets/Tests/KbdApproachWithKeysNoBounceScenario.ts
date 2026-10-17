import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {runApproachWithKeysNoBounce} from "./KbdDoorChecks"

@component
export class KbdApproachWithKeysNoBounceScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await runApproachWithKeysNoBounce()
  }
}
