import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {runPinchHaveKeys} from "./KbdPinchChecks"

@component
export class KbdPinchHaveKeysScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await runPinchHaveKeys()
  }
}
