import { z } from 'zod';

export const GetExportResultRequestSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-z]+$/, {
      message: 'Notion page id must only contain 0-9a-z',
    })
    .describe('Notion page id'),
});
