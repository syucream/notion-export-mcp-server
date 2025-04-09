import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from 'dotenv';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'node:url';
import path, { dirname, resolve } from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

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
      response.content.length > 0 &&
      response.content[0]?.type === 'text'
    ) {
      // Save the markdown content to a file
      console.log('Notion export result received. First 100 characters:');
      console.log(response.content[0].text.substring(0, 100) + '...');

      // Save to file if WRITE_TO_FILE environment variable is set to true
      if (process.env.WRITE_TO_FILE === 'true') {
        const baseDir = process.env.OUTPUT_BASE_PATH || '.';

        // If the directory does not exist, create it
        if (!existsSync(baseDir)) {
          await mkdir(baseDir, { recursive: true });
          console.log(`Created directory: ${baseDir}`);
        }

        // Save all text content
        for (let i = 0; i < response.content.length; i++) {
          const content = response.content[i];
          if (content.type === 'text') {
            const fileName = `notion_export_${pageId}_${i}.md`;
            const outputPath = path.join(baseDir, fileName);
            await writeFile(outputPath, content.text, 'utf-8');
            console.log(`Exported to ${outputPath}`);
          }
        }
      }
    } else if (
      Array.isArray(response.content) &&
      response.content.length === 0
    ) {
      console.log(
        'Notion export result received with empty content. This is normal in some cases.'
      );
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
