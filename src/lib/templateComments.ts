// Template descriptions (a line's `comment`) that were reworded after
// estimations were already saved. Saved estimations keep their own copy of
// each line, so a new template text only reaches them through this refresh,
// run when an estimation is opened (see normalizeEstimationState). A line is
// only updated while it still carries exactly the previous template text, so
// anything else is left alone.

import { STANDARD_WORKSTREAM_TEMPLATES } from "./templates";
import type { EstimationState, LocalizedString } from "./types";

const CURRENT_COMMENTS = new Map(
  STANDARD_WORKSTREAM_TEMPLATES.flatMap((ws) => ws.items.map((item) => [item.id, item.comment ?? null] as const))
);

/** Previous template texts, by line id. Data Migration: reworded 2026-11-02. */
const PREVIOUS_COMMENTS: Record<string, LocalizedString> = {
  "data_migration-1-best-practices-customer-input": { en: "Show our best practices and tips to the client", nl: "Onze best practices en tips aan de klant laten zien" },
  "data_migration-2-data-mapping-i": { en: "Provide Data Mapping and discuss field mappings based on Exports", nl: "Datamapping aanleveren en veldmappings bespreken op basis van exports" },
  "data_migration-3-migration-checkin-i": { en: "Check on exports and clean ups the client did already, define next steps", nl: "Exports en opschoonacties van de klant controleren, vervolgstappen bepalen" },
  "data_migration-4-migration-checkin-ii": { en: "Check on exports and clean ups the client did already, define next steps", nl: "Exports en opschoonacties van de klant controleren, vervolgstappen bepalen" },
  "data_migration-5-test-load-alignment-validation": { en: "Check on imports the client did, clarify issues", nl: "Imports van de klant controleren, issues uitzoeken" },
  "data_migration-6-prod-load-alignment-validation": { en: "Check on imports the client did, clarify issues", nl: "Imports van de klant controleren, issues uitzoeken" },
  "data_migration-7-best-practices-customer-input": { en: "Prepare Miro and Deck for Best Practices", nl: "Miro en deck voor de best practices voorbereiden" },
  "data_migration-8-running-support": { en: "Answer questions, give feedback to approach, advise on the run", nl: "Vragen beantwoorden, feedback geven op de aanpak, adviseren tijdens de uitvoering" },
  "data_migration-9-data-check-i": { en: "Check Data and Issues for the client, export analysis (dependent on amount of objects, files)", nl: "Data en issues voor de klant controleren, exportanalyse (afhankelijk van het aantal objecten en bestanden)" },
  "data_migration-10-data-check-ii": { en: "Check Data and Issues for the client, export analysis (dependent on amount of objects, files)", nl: "Data en issues voor de klant controleren, exportanalyse (afhankelijk van het aantal objecten en bestanden)" },
  "data_migration-11-data-transformation-formatting": { en: "Order, transform, clean & format customer data IF we own this part", nl: "Klantdata ordenen, transformeren, opschonen & opmaken, ALS wij dit deel uitvoeren" },
  "data_migration-12-data-load-in-test": { en: "Effort to Load Testdata into Sandbox IF we own this part", nl: "Inspanning om testdata in de sandbox te laden, ALS wij dit deel uitvoeren" },
  "data_migration-13-data-load-in-prod": { en: "Effort to load the data into production IF we own this part", nl: "Inspanning om de data in productie te laden, ALS wij dit deel uitvoeren" },
  "data_migration-14-amount-of-data-sources": { en: "Extremely high amount of objects, data and files", nl: "Extreem veel objecten, data en bestanden" },
  "data_migration-15-file-migration": { en: "Migration of Files attached to Mail or overall Files", nl: "Migratie van bestanden bij e-mails of bestanden in het algemeen" },
  "data_migration-16-api-fetching-of-data": { en: "Technical fetching of data needed / Export not easily possible", nl: "Data moet technisch opgehaald worden / export niet eenvoudig mogelijk" },
};

export function refreshTemplateComments(state: EstimationState): EstimationState {
  return {
    ...state,
    standardWorkstreams: state.standardWorkstreams.map((ws) => ({
      ...ws,
      items: ws.items.map((item) => {
        const previous = PREVIOUS_COMMENTS[item.id];
        const current = CURRENT_COMMENTS.get(item.id);
        if (!previous || !current || item.comment?.en !== previous.en) return item;
        return { ...item, comment: current };
      }),
    })),
  };
}
