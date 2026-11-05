import "./helpers/string-colors.js";
import { toolUseMain } from "./patterns/01-tool-use/tool-use.js";
// import {
//   getMessageFromModel,
//   getMessageFromModelFailSafe,
// } from "./actions/get-message-model.js";

console.clear();

// await getMessageFromModel();
// await getMessageFromModelFailSafe();

await toolUseMain();
