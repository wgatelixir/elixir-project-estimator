import { z } from "zod";

const complexityTableEntrySchema = z.object({
  hours: z.number(),
  comment: z.string().nullable().optional(),
});

const complexityTableSchema = z.record(z.string(), complexityTableEntrySchema);

const standardLineItemSchema = z.object({
  id: z.string(),
  activity: z.enum(["Session", "Setup", "Desk work"]),
  topic: z.string(),
  standardEffort: z.number(),
  complexityTable: z.enum(["session", "setup"]),
  complexity: z.string(),
  comment: z.string().nullable().optional(),
  enabled: z.boolean(),
});

const standardWorkstreamSchema = z.object({
  key: z.string(),
  label: z.string(),
  enabled: z.boolean(),
  hourlyRate: z.number().nonnegative(),
  items: z.array(standardLineItemSchema),
  sessionComplexity: complexityTableSchema,
  setupComplexity: complexityTableSchema,
});

const thirdPartyLineItemSchema = z.object({
  id: z.string(),
  activity: z.enum(["Session", "Setup"]),
  topic: z.string(),
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

export const estimationStateSchema = z.object({
  standardWorkstreams: z.array(standardWorkstreamSchema),
  thirdPartyIntegration: thirdPartyIntegrationSchema,
  elixirSyncIntegration: elixirSyncIntegrationSchema,
  pmRate: z.number().nonnegative(),
  pmPercent: z.number().min(0).max(1),
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
