import { z } from 'zod';

const itemCode = z.enum(['hair', 'zipper', 'buttons', 'glove_gap']);

export const itemResultSchema = z.object({
  itemCode,
  score: z.number().min(0).max(1),
  threshold: z.number().min(0).max(1),
  result: z.enum(['OK', 'NG', 'UNKNOWN']),
  reasonCode: z.string().optional()
});

export const saveResultSchema = z.object({
  deviceCode: z.string().min(1),
  overallResult: z.enum(['OK', 'NG', 'ERROR']),
  retryCount: z.number().int().min(0).max(10).default(0),
  itemResults: z.array(itemResultSchema).length(4)
});

export type SaveResultRequest = z.infer<typeof saveResultSchema>;
