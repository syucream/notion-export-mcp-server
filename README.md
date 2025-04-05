# notion-export-mcp-server

[![npm version](https://badge.fury.io/js/notion-export-mcp-server.svg)](https://badge.fury.io/js/notion-export-mcp-server)

A [MCP(Model Context Protocol)](https://www.anthropic.com/news/model-context-protocol) server that accesses to [Notion](https://www.notion.so/) unofficial API to export pages.

This server provides MCP-compatible access to Notion's **unofficial** API, allowing AI assistants to interact with your Notion exported page data through a standardized interface.

<a href="https://glama.ai/mcp/servers/7tn35lri9w"><img width="380" height="200" src="https://glama.ai/mcp/servers/7tn35lri9w/badge" alt="Holaspirit Server MCP server" /></a>

## Features

Available tools:

- `notion_export_get_result` - Get notion export result markdown text

## Quick Start

### Installation

#### Manual Installation

```bash
npm install notion-export-mcp-server
```

### Configuration

- `NOTION_TOKEN_V2`: Your Notion token
- `NOTION_FILE_TOKEN`: Your Notion file token

### Usage

#### Start the MCP server

Directly:
```bash
npx notion-export-mcp-server
```

Or, run the installed module with node.

#### Edit MCP configuration json for your client:

```json
...
    "lightdash": {
      "command": "npx",
      "args": [
        "-y",
        "notion-export-mcp-server"
      ],
      "env": {
        "NOTION_TOKEN_V2": "<your token>",
        "NOTION_FILE_TOKEN": "<your token>"
      }
    },
...
```

## Development

### Available Scripts

- `npm run dev` - Start the server in development mode with hot reloading
- `npm run build` - Build the project for production
- `npm run start` - Start the production server
- `npm run lint` - Run linting checks (ESLint and Prettier)
- `npm run fix` - Automatically fix linting issues
- `npm run examples` - Run the example scripts

### Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests and linting: `npm run lint`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request
