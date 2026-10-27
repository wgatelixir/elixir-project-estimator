import { createDefaultEstimationState } from "../src/lib/templates";
import { computeEstimationTotals } from "../src/lib/calculations";

const state = createDefaultEstimationState();
// New estimations start with every workstream unchecked; include them all here so
// this check covers the full template.
for (const ws of state.standardWorkstreams) ws.enabled = true;
const totals = computeEstimationTotals(state);

console.log("Per workstream:");
for (const w of totals.workstreams) {
  console.log(`  ${w.label}: ${w.hours}h x ${w.hourlyRate} = ${w.price}`);
}
console.log("Third party:", totals.thirdParty);
console.log("ElixirSync:", totals.elixirSync);
console.log("billableHours", totals.billableHours);
console.log("billablePrice", totals.billablePrice);
console.log("pmHours", totals.pmHours, "pmPrice", totals.pmPrice);
console.log("totalEffortHours", totals.totalEffortHours);
console.log("totalEffortPrice", totals.totalEffortPrice);
console.log("subscriptionsPrice", totals.subscriptionsPrice);
console.log("grandTotalPrice", totals.grandTotalPrice);
