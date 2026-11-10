import "./helpers/string-colors.js";
import {
  getMessageFromModel,
  getMessageFromModelFailSafe,
} from "./actions/get-message-model.js";
import { toolUseMain } from "./patterns/01-tool-use/tool-use.js";
import { planningMain } from "./patterns/02-planning/planning.js";
import { reflectionMain } from "./patterns/03-reflection/reflection.js";
import { reActSimpleMain } from "./patterns/04-reAct/reAct-loop.js";
import { reActWeatherMain } from "./patterns/04-reAct/reAct-tarea.js";
import { promptChainingMain } from "./patterns/05-prompt-chaining/prompt-chaining.js";

console.clear();

// await getMessageFromModel();
// await getMessageFromModelFailSafe();
// await toolUseMain();
// await planningMain();
// await reflectionMain();
// await reActSimpleMain();
// await reActWeatherMain();
await promptChainingMain();
