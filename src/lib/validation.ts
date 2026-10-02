import { z } from "zod";

const localizedStringSchema = z.object({
  en: z.string(),
  nl: z.string(),
});

const complexityTableEntrySchema = z.object({
  hours: z.number(),
  comment: localizedStringSchema.nullable().optional(),
});

const complexityTableSchema = z.record(z.string(), complexityTableEntrySchema);

const standardLineItemSchema = z.object({
  id: z.string(),
  activity: z.enum(["Session", "Setup", "Desk work"]),
  topic: localizedStringSchema,
  standardEffort: z.number(),
  complexityTable: z.enum(["session", "setup"]),
  complexity: z.string(),
  comment: localizedStringSchema.nullable().optional(),
  enabled: z.boolean(),
});

const standardWorkstreamSchema = z.object({
  key: z.string(),
  label: localizedStringSchema,
  enabled: z.boolean(),
  hourlyRate: z.number().nonnegative(),
  items: z.array(standardLineItemSchema),
  sessionComplexity: complexityTableSchema,
  setupComplexity: complexityTableSchema,
});

const thirdPartyLineItemSchema = z.object({
  id: z.string(),
  activity: z.enum(["Session", "Setup"]),
  topic: localizedStringSchema,
  from: z.string().nullable().optional(),
  to: z.string().nullable().optional(),
  complexity: z.string(),
  enabled: z.boolean(),
});

const thirdPartyIntegrationSchema = z.object({
  enabled: z.boolean(),
  hourlyRate: z.number().nonnegative(),
  items: z.array(thirdPartyLineItemSchema),
  sessionComplexity: complexityTableSchema,
  setupComplexity: complexityTableSchema,
  subscriptionQty: z.number().nonnegative(),
  subscriptionUnitPrice: z.number().nonnegative(),
});

const elixirSyncLineItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  optimistic: z.number(),
  pessimistic: z.number(),
  realistic: z.number(),
});

const elixirSyncStreamSchema = z.object({
  id: z.string(),
  label: z.string(),
  included: z.boolean(),
  items: z.array(elixirSyncLineItemSchema),
});

const elixirSyncIntegrationSchema = z.object({
  enabled: z.boolean(),
  hourlyRate: z.number().nonnegative(),
  streams: z.array(elixirSyncStreamSchema),
  subscriptionQty: z.number().nonnegative(),
  subscriptionUnitPrice: z.number().nonnegative(),
});

const hubspotLicenseApplicabilitySchema = z.object({
  newEmeaCustomerSinceOct2026: z.boolean().nullable(),
  existingHubSpotCustomer: z.boolean().nullable(),
  beneluxOrNordicsPilot: z.boolean().nullable(),
  newPortalUnderExistingMultiPortal: z.boolean().nullable(),
});

const hubspotLicenseSchema = z.object({
  enabled: z.boolean(),
  applicability: hubspotLicenseApplicabilitySchema,
  edition: z.enum(["starter", "professional", "enterprise"]),
  gtmSeats: z.number().nonnegative(),
  opsSeats: z.number().nonnegative(),
  viewOnlySeats: z.number().nonnegative(),
  expectedRecords: z.number().nonnegative(),
  expectedEmailsPerMonth: z.number().nonnegative(),
  expectedCreditsPerMonth: z.number().nonnegative(),
  notes: z.string(),
});

export const estimationStateSchema = z.object({
  locale: z.enum(["en", "nl"]),
  standardWorkstreams: z.array(standardWorkstreamSchema),
  thirdPartyIntegration: thirdPartyIntegrationSchema,
  elixirSyncIntegration: elixirSyncIntegrationSchema,
  pmRate: z.number().nonnegative(),
  pmPercent: z.number().min(0).max(1),
  hubspotLicense: hubspotLicenseSchema,
});

export const estimationMetaSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required"),
  projectName: z.string().trim().optional().nullable(),
  ownerName: z.string().trim().optional().nullable(),
  status: z.enum(["DRAFT", "FINAL"]).optional(),
});

export const createEstimationSchema = estimationMetaSchema;

export const updateEstimationSchema = estimationMetaSchema.partial().extend({
  data: estimationStateSchema.optional(),
});
