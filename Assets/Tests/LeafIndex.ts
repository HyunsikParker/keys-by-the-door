import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {KbdReminderNaturalTickScenario} from "./KbdReminderNaturalTickScenario"
import {KbdReminderFastClockScenario} from "./KbdReminderFastClockScenario"
import {KbdPinchHaveKeysScenario} from "./KbdPinchHaveKeysScenario"
import {KbdPinchHaveKeysIKScenario} from "./KbdPinchHaveKeysIKScenario"
import {KbdApproachBounceScenario} from "./KbdApproachBounceScenario"
import {KbdApproachWithKeysNoBounceScenario} from "./KbdApproachWithKeysNoBounceScenario"
import {KbdWalkOutNoKeysScenario} from "./KbdWalkOutNoKeysScenario"
import {KbdWalkOutWithKeysScenario} from "./KbdWalkOutWithKeysScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "kbd-1a-reminder-natural-tick", typename: KbdReminderNaturalTickScenario.getTypeName()},
    {id: "kbd-1b-reminder-fast-clock", typename: KbdReminderFastClockScenario.getTypeName()},
    {id: "kbd-2-pinch-have-keys", typename: KbdPinchHaveKeysScenario.getTypeName()},
    {id: "kbd-2ik-pinch-have-keys-ik", typename: KbdPinchHaveKeysIKScenario.getTypeName()},
    {id: "kbd-3-approach-bounce", typename: KbdApproachBounceScenario.getTypeName()},
    {id: "kbd-3c-approach-with-keys-no-bounce", typename: KbdApproachWithKeysNoBounceScenario.getTypeName()},
    {id: "kbd-4a-walk-out-no-keys", typename: KbdWalkOutNoKeysScenario.getTypeName()},
    {id: "kbd-4b-walk-out-with-keys", typename: KbdWalkOutWithKeysScenario.getTypeName()},
  ]
}
