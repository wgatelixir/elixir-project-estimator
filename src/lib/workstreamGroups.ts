// Which standard workstreams belong to which Cover page group. Shared by the
// Cover page (its group cards) and the editor's tab bar (the tab icons).

// "deployment_golive" is no longer in the template (V3 moved trainings and go-live into
// each hub tab) but older estimations still have it, so keep listing it when present.
export const FOUNDATION_KEYS = ["business_assessment", "technical_assessment", "data_migration", "deployment_golive"];
export const HUB_KEYS = [
  "sales_implementation",
  "service_implementation",
  "marketing_implementation",
  "cms_implementation",
  "dealhub_implementation",
];
