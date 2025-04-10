import { z } from 'zod';

export const GetExportResultRequestSchema = z.object({
  id: z
    .string()
    .regex(/^[0-9a-z]+$/, {
      message: 'Notion page id must only contain 0-9a-z',
    })
    .length(32)
    .describe('Notion page id'),
  recursive: z
    .boolean()
    .describe('Export children subpages recursively')
    .default(false),
});
