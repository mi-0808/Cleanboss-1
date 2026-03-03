import { z } from 'zod';

export const issueCodeSchema = z.enum([
  'HAIR_EXPOSED',
  'NECK_EXPOSED',
  'GLOVE_GAP_EXPOSED',
  'OTHER'
]);

export const issueSchema = z.object({
  code: issueCodeSchema,
  message: z.string().min(1),
  suggestion: z.string().min(1)
});

export const visionCheckResultSchema = z.object({
  overall: z.enum(['ok', 'ng']),
  summary: z.string().min(1),
  issues: z.array(issueSchema),
  confidence: z.number().min(0).max(1)
});

export type VisionCheckResult = z.infer<typeof visionCheckResultSchema>;

export const visionResponseJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['overall', 'summary', 'issues', 'confidence'],
  properties: {
    overall: { type: 'string', enum: ['ok', 'ng'] },
    summary: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['code', 'message', 'suggestion'],
        properties: {
          code: { type: 'string', enum: ['HAIR_EXPOSED', 'NECK_EXPOSED', 'GLOVE_GAP_EXPOSED', 'OTHER'] },
          message: { type: 'string' },
          suggestion: { type: 'string' }
        }
      }
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 }
  }
} as const;
