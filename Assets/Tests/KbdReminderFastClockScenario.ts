import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {runReminderFastClock} from "./KbdReminderChecks"

@component
export class KbdReminderFastClockScenario extends Scenario {
  async run(): Promise<void> {
    await sleep(1500)
    await runReminderFastClock()
  }
}
