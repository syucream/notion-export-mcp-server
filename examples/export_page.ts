import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from 'dotenv';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config();

// Get and validate required environment variables
const tokenV2 = process.env.EXAMPLES_NOTION_TOKEN_V2;
if (!tokenV2) {
  throw new Error('EXAMPLES_NOTION_TOKEN_V2 environment variable is required');
}

const fileToken = process.env.EXAMPLES_NOTION_FILE_TOKEN;
if (!fileToken) {
  throw new Error(
    'EXAMPLES_NOTION_FILE_TOKEN environment variable is required'
  );
}

const pageId = process.env.EXAMPLES_NOTION_PAGE_ID;
if (!pageId) {
  throw new Error('EXAMPLES_NOTION_PAGE_ID environment variable is required');
}

// After validation, we can safely assert these are strings
const env = {
  NOTION_TOKEN_V2: tokenV2,
  NOTION_FILE_TOKEN: fileToken,
  NOTION_PAGE_ID: pageId,
} as const satisfies Record<string, string>;

async function main() {
  // Initialize MCP client
  const client = new Client(
    {
      name: 'notion-export-example-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Create transport to connect to the server
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      '--import',
      resolve(__dirname, '../ts-node-loader.js'),
      resolve(__dirname, '../src/index.ts'),
    ],
    env,
  });

  try {
    // Connect to the server
    await client.connect(transport);
    console.log('Connected to MCP server');

    // List available tools
    const toolsResponse = await client.listTools();
    console.log('Available tools:', toolsResponse.tools);

    // Call notion_export_get_result with a page ID
    const response = (await client.callTool(
      {
        name: 'notion_export_get_result',
        arguments: {
          id: pageId,
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(response.content) &&
      response.content[0]?.type === 'text'
    ) {
      // Save the markdown content to a file
      console.log('Notion export result received. First 100 characters:');
      console.log(response.content[0].text.substring(0, 100) + '...');

      // You can uncomment the following lines to save the content to a file
      // import { writeFileSync } from 'fs';
      // writeFileSync('notion-export.md', response.content[0].text);
      // console.log('Saved complete markdown to notion-export.md');
    } else {
      console.error('Unexpected response format');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await transport.close();
  }
}

main();
