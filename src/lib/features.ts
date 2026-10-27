// Switches for parts of the app that are built but deliberately hidden for now.
// Turning one back on needs no data migration: saved estimations keep their data.

export const FEATURES = {
  /** HubSpot license calculator (Cover page toggle + its own tab). Hidden for now, by request. */
  hubspotLicense: false,
} as const;
