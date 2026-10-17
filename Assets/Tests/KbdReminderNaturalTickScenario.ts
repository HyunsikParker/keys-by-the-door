import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {runReminderNaturalTick} from "./KbdReminderChecks"

@component
export class KbdReminderNaturalTickScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await runReminderNaturalTick()
  }
}
