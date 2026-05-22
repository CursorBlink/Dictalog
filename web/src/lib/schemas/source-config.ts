import { z } from "zod"

export const s3ConfigSchema = z.object({
  bucket: z.string().min(1, "Bucket name is required"),
  region: z.string().min(1, "Region is required"),
  accessKeyId: z.string().min(1, "Access key ID is required"),
  secretAccessKey: z.string().min(1, "Secret access key is required"),
  prefix: z.string().optional(),
})

export const sourceConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["S3"]),
  config: s3ConfigSchema,
})

export const updateSourceConfigSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["S3"]),
  config: s3ConfigSchema.extend({
    secretAccessKey: z.string(),
  }),
})

export type S3Config = z.infer<typeof s3ConfigSchema>
export type SourceConfigInput = z.infer<typeof sourceConfigSchema>
export type UpdateSourceConfigInput = z.infer<typeof updateSourceConfigSchema>
