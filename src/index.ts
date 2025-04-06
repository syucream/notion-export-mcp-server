#!/usr/bin/env node

import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { GetExportResultRequestSchema } from './schemas.js';
import { NotionExporter, defaultConfig } from './exporter.js';

const tokenV2 = process.env.NOTION_TOKEN_V2;
if (!tokenV2) {
  throw new Error('NOTION_TOKEN_V2 environment variable is required');
}

const fileToken = process.env.NOTION_FILE_TOKEN;
if (!fileToken) {
  throw new Error('NOTION_FILE_TOKEN environment variable is required');
}

const server = new Server(
  {
    name: 'notion-export-mcp-server',
    version: '0.0.1',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'notion_export_get_result',
        description: 'Get notion export result',
        inputSchema: zodToJsonSchema(GetExportResultRequestSchema),
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params) {
      throw new Error('Params are required');
    }

    switch (request.params.name) {
      case 'notion_export_get_result': {
        const args = GetExportResultRequestSchema.parse(
          request.params.arguments
        );

        const exporter = new NotionExporter(tokenV2, fileToken, {
          ...defaultConfig,
          recursive: args.recursive,
        });

        const mdTexts = await exporter.getAllMdString(args.id);

        return {
          content: mdTexts.map((r) => ({ type: 'text', text: r })),
        };
      }
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    console.error('Error handling request:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(errorMessage);
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Notion Export MCP Server running on stdio');
}

runServer().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
