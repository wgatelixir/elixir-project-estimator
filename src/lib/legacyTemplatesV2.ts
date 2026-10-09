// Bilingual text for V2-template content that the V3 templates (templates.ts) no
// longer contain: line items V3 dropped or renamed, and the HubSpot Deployment &
// Go-Live workstream V3 folded into the hub tabs. Estimations saved before
// bilingual support still carry these as plain English strings, and
// migrateLegacyLocale.ts needs the original Dutch to restore them. Read-only
// lookup data - never used to seed new estimations.

import type { LocalizedString } from "./types";

export const LEGACY_V2_ITEM_TEXT: Record<string, { topic: LocalizedString; comment: LocalizedString | null }> = {
  "business_assessment-6-solution-design-workshop": { topic: { en: "Solution design workshop", nl: "Solution design-workshop" }, comment: { en: "Only for uni-dimensional projects", nl: "Alleen voor uni-dimensionale projecten" } },
  "business_assessment-7-assessment-presentation": { topic: { en: "Assessment presentation", nl: "Assessment-presentatie" }, comment: { en: "Only for multi dimensional projects", nl: "Alleen voor multidimensionale projecten" } },
  "business_assessment-8-create-solution-design-user-stories": { topic: { en: "Create solution design & user stories", nl: "Solution design & user stories opstellen" }, comment: { en: "Only for uni-dimensional projects", nl: "Alleen voor uni-dimensionale projecten" } },
  "business_assessment-9-prepare-assessment-presentation": { topic: { en: "Prepare assessment presentation", nl: "Assessment-presentatie voorbereiden" }, comment: { en: "Only for multi dimensional projects", nl: "Alleen voor multidimensionale projecten" } },
  "technical_assessment-5-functional-requirements": { topic: { en: "Functional Requirements", nl: "Functionele requirements" }, comment: null },
  "technical_assessment-6-integration-flow-definition": { topic: { en: "Integration Flow Definition", nl: "Integratieflow definiëren" }, comment: null },
  "technical_assessment-7-mapping-file": { topic: { en: "Mapping File", nl: "Mappingbestand" }, comment: null },
  "technical_assessment-8-functional-requirements-document": { topic: { en: "Functional Requirements Document", nl: "Functioneel requirements-document" }, comment: null },
  "data_migration-1-kick-off-hs-best-practices-customer-inpu": { topic: { en: "Kick-off - HS Best Practices & Customer Input", nl: "Kick-off - HubSpot best practices & klantinput" }, comment: null },
  "data_migration-3-data-mapping-ii": { topic: { en: "Data Mapping II", nl: "Datamapping II" }, comment: null },
  "data_migration-4-alignment-before-loading-in-test": { topic: { en: "Alignment before loading in Test", nl: "Afstemming vóór laden in Test" }, comment: null },
  "data_migration-5-data-validation-in-test": { topic: { en: "Data Validation in Test", nl: "Datavalidatie in Test" }, comment: null },
  "data_migration-6-alignment-before-loading-in-production": { topic: { en: "Alignment before loading in Production", nl: "Afstemming vóór laden in Productie" }, comment: null },
  "data_migration-7-data-validation-in-prod": { topic: { en: "Data Validation in Prod", nl: "Datavalidatie in Productie" }, comment: null },
  "data_migration-8-data-transformation": { topic: { en: "Data Transformation", nl: "Datatransformatie" }, comment: null },
  "data_migration-9-data-loading-in-test": { topic: { en: "Data Loading in Test", nl: "Data laden in Test" }, comment: null },
  "data_migration-10-data-loading-in-prod": { topic: { en: "Data Loading in Prod", nl: "Data laden in Productie" }, comment: null },
  "sales_implementation-2-company-contact-lead-activity-mgmt": { topic: { en: "Company & Contact, lead & activity Mgmt", nl: "Bedrijven & contacten, lead- en activiteitenbeheer" }, comment: null },
  "sales_implementation-3-deal-pipeline-management": { topic: { en: "Deal & Pipeline management", nl: "Deal- en pipelinebeheer" }, comment: null },
  "sales_implementation-4-quote-management": { topic: { en: "Quote management", nl: "Offertebeheer" }, comment: null },
  "sales_implementation-5-sales-reporting-authorizations": { topic: { en: "Sales Reporting & Authorizations", nl: "Sales-rapportage & autorisaties" }, comment: null },
  "sales_implementation-6-setup-checkin-session-i": { topic: { en: "Setup Checkin Session I", nl: "Setup check-in sessie I" }, comment: null },
  "sales_implementation-7-setup-checkin-session-ii": { topic: { en: "Setup Checkin Session II", nl: "Setup check-in sessie II" }, comment: null },
  "sales_implementation-8-final-checkin-session-before-go-live": { topic: { en: "Final Checkin Session (before Go-Live)", nl: "Laatste check-in sessie (vóór Go-Live)" }, comment: null },
  "sales_implementation-9-sales-marketing-alignment": { topic: { en: "Sales & marketing alignment", nl: "Sales- en marketingafstemming" }, comment: null },
  "sales_implementation-10-companies": { topic: { en: "Companies", nl: "Bedrijven" }, comment: null },
  "sales_implementation-11-contacts": { topic: { en: "Contacts", nl: "Contacten" }, comment: null },
  "sales_implementation-12-lead-management": { topic: { en: "Lead management", nl: "Leadbeheer" }, comment: null },
  "sales_implementation-13-deals": { topic: { en: "Deals", nl: "Deals" }, comment: null },
  "sales_implementation-14-quoting": { topic: { en: "Quoting", nl: "Offertes" }, comment: null },
  "sales_implementation-15-dashboards-reports": { topic: { en: "Dashboards & reports", nl: "Dashboards & rapportages" }, comment: null },
  "sales_implementation-16-users-teams-permission-sets": { topic: { en: "Users, Teams & Permission sets", nl: "Gebruikers, teams & permissiesets" }, comment: null },
  "service_implementation-1-service-kick-off-workshop": { topic: { en: "Service kick-off Workshop", nl: "Service kick-off workshop" }, comment: null },
  "service_implementation-2-company-contact-management": { topic: { en: "Company & contact management", nl: "Bedrijven- & contactenbeheer" }, comment: null },
  "service_implementation-3-ticket-management": { topic: { en: "Ticket management", nl: "Ticketbeheer" }, comment: null },
  "service_implementation-4-knowledge-base-feedback-surveys": { topic: { en: "Knowledge base & feedback surveys", nl: "Kennisbank & feedback-enquêtes" }, comment: null },
  "service_implementation-5-service-reporting-authorizations": { topic: { en: "Service reporting & Authorizations", nl: "Service-rapportage & autorisaties" }, comment: null },
  "service_implementation-6-setup-checkin-session-i": { topic: { en: "Setup Checkin Session I", nl: "Setup check-in sessie I" }, comment: null },
  "service_implementation-7-setup-checkin-session-ii": { topic: { en: "Setup Checkin Session II", nl: "Setup check-in sessie II" }, comment: null },
  "service_implementation-8-final-wrap-up-before-training": { topic: { en: "Final wrap-up (before training)", nl: "Laatste afronding (vóór training)" }, comment: null },
  "service_implementation-9-companies": { topic: { en: "Companies", nl: "Bedrijven" }, comment: null },
  "service_implementation-10-contacts": { topic: { en: "Contacts", nl: "Contacten" }, comment: null },
  "service_implementation-11-tickets": { topic: { en: "Tickets", nl: "Tickets" }, comment: null },
  "service_implementation-12-customer-portal": { topic: { en: "Customer portal", nl: "Klantportaal" }, comment: null },
  "service_implementation-13-knowledge-base": { topic: { en: "Knowledge base", nl: "Kennisbank" }, comment: null },
  "service_implementation-14-surveys": { topic: { en: "Surveys", nl: "Enquêtes" }, comment: null },
  "service_implementation-15-dashboards-reports": { topic: { en: "Dashboards & reports", nl: "Dashboards & rapportages" }, comment: null },
  "service_implementation-16-users-teams-permission-sets": { topic: { en: "Users, Teams & Permission sets", nl: "Gebruikers, teams & permissiesets" }, comment: null },
  "marketing_implementation-1-marketing-kick-off-tech-questionnaire": { topic: { en: "Marketing Kick-off (Tech Questionnaire)", nl: "Marketing kick-off (technische vragenlijst)" }, comment: null },
  "marketing_implementation-2-gdpr-marketing-contacts": { topic: { en: "GDPR & marketing contacts", nl: "AVG & marketingcontacten" }, comment: null },
  "marketing_implementation-3-campaign-definition-technical-set-up": { topic: { en: "Campaign Definition, Technical set-up", nl: "Campagnedefinitie, technische set-up" }, comment: null },
  "marketing_implementation-4-buyer-personas-buyers-journey": { topic: { en: "Buyer Personas & Buyers Journey", nl: "Buyer persona's & buyer journey" }, comment: null },
  "marketing_implementation-5-lead-qualification-scoring-campaign-flow": { topic: { en: "Lead qualification / scoring & Campaign Flow", nl: "Leadkwalificatie / scoring & campagneflow" }, comment: null },
  "marketing_implementation-6-assets-training-i": { topic: { en: "Assets Training I", nl: "Training materialen I" }, comment: null },
  "marketing_implementation-7-assets-training-ii": { topic: { en: "Assets Training II", nl: "Training materialen II" }, comment: null },
  "marketing_implementation-8-campaign-go-live": { topic: { en: "Campaign go-live", nl: "Campagne go-live" }, comment: null },
  "marketing_implementation-9-marketing-reporting-analytics": { topic: { en: "Marketing reporting & analytics", nl: "Marketingrapportage & analyse" }, comment: null },
  "marketing_implementation-10-setup-checkin-session-i": { topic: { en: "Setup Checkin Session I", nl: "Setup check-in sessie I" }, comment: null },
  "marketing_implementation-11-setup-checkin-session-ii": { topic: { en: "Setup Checkin Session II", nl: "Setup check-in sessie II" }, comment: null },
  "marketing_implementation-12-campaign-follow-up": { topic: { en: "Campaign Follow-up ", nl: "Campagne follow-up" }, comment: null },
  "marketing_implementation-13-general-set-up-tracking-link-domains-sub": { topic: { en: "General set-up: Tracking link, Domains, Subdomains, Compliance, Plug&Play Integrations", nl: "Algemene set-up: tracking link, domeinen, subdomeinen, compliance, plug&play-integraties" }, comment: null },
  "marketing_implementation-14-gdpr-set-up-consent-subscription-types-c": { topic: { en: "GDPR set-up: Consent, subscription types, cookie banner, DOI, marketing contacts", nl: "AVG-set-up: toestemming, abonnementstypen, cookiebanner, DOI, marketingcontacten" }, comment: null },
  "marketing_implementation-15-lead-qualification-scoring": { topic: { en: "Lead Qualification / Scoring", nl: "Leadkwalificatie / scoring" }, comment: null },
  "marketing_implementation-16-campaign-assets-ads-social-landing-pages": { topic: { en: "Campaign assets: Ads, Social, Landing pages, Forms, Mails, Workflows", nl: "Campagnemateriaal: advertenties, social, landingspagina's, formulieren, mails, workflows" }, comment: null },
  "marketing_implementation-17-dashboards-reports": { topic: { en: "Dashboards & reports", nl: "Dashboards & rapportages" }, comment: null },
  "marketing_implementation-18-users-teams-permission-sets": { topic: { en: "Users, Teams & Permission sets", nl: "Gebruikers, teams & permissiesets" }, comment: null },
  "deployment_golive-1-sales-key-user-training": { topic: { en: "Sales key user training", nl: "Sales key-user training" }, comment: null },
  "deployment_golive-2-service-key-user-training": { topic: { en: "Service key user training", nl: "Service key-user training" }, comment: null },
  "deployment_golive-3-marketing-key-user-training": { topic: { en: "Marketing key user training", nl: "Marketing key-user training" }, comment: null },
  "deployment_golive-4-super-admin-training": { topic: { en: "Super Admin training", nl: "Super Admin-training" }, comment: null },
  "deployment_golive-5-sales-end-user-training-6-8-users-sessio": { topic: { en: "Sales end user training (6-8 users / session)", nl: "Sales eindgebruikerstraining (6-8 gebruikers / sessie)" }, comment: null },
  "deployment_golive-6-service-end-user-training-6-8-users-sess": { topic: { en: "Service end user training (6-8 users / session)", nl: "Service eindgebruikerstraining (6-8 gebruikers / sessie)" }, comment: null },
  "deployment_golive-7-marketing-end-user-training-6-8-users-se": { topic: { en: "Marketing end user training (6-8 users / session)", nl: "Marketing eindgebruikerstraining (6-8 gebruikers / sessie)" }, comment: null },
  "deployment_golive-8-hypercare-support": { topic: { en: "Hypercare Support", nl: "Hypercare-ondersteuning" }, comment: null },
  "deployment_golive-9-deployment-sales-prod": { topic: { en: "Deployment Sales Prod", nl: "Deployment Sales Productie" }, comment: null },
  "deployment_golive-10-deployment-service-prod": { topic: { en: "Deployment Service Prod", nl: "Deployment Service Productie" }, comment: null },
  "deployment_golive-11-deployment-marketing-prod": { topic: { en: "Deployment Marketing Prod", nl: "Deployment Marketing Productie" }, comment: null },
  "deployment_golive-12-setup-hypercare": { topic: { en: "Setup Hypercare", nl: "Setup hypercare" }, comment: null },
};

export const LEGACY_V2_WORKSTREAM_TEXT: Record<
  string,
  {
    label: LocalizedString;
    sessionComplexity: Record<string, LocalizedString | null>;
    setupComplexity: Record<string, LocalizedString | null>;
  }
> = {
  "deployment_golive": {
    label: { en: "HubSpot Deployment & Go-Live", nl: "HubSpot Deployment & Go-Live" },
    sessionComplexity: { "Low": { en: "1 Session, one consultant, no preperation time", nl: "1 sessie, één consultant, geen voorbereidingstijd" }, "Standard": { en: "1 Session, one consultant, normal preperation time", nl: "1 sessie, één consultant, normale voorbereidingstijd" }, "Medium": { en: "1 Session, one consultant, medium preperation time", nl: "1 sessie, één consultant, gemiddelde voorbereidingstijd" }, "High": { en: "1 Session, one consultant, high preperation time", nl: "1 sessie, één consultant, hoge voorbereidingstijd" } },
    setupComplexity: { "Low": null, "Standard": null, "Medium": null, "High": null },
  },
};
