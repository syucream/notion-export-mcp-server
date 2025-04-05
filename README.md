# notion-export-mcp-server

[![npm version](https://badge.fury.io/js/notion-export-mcp-server.svg)](https://badge.fury.io/js/notion-export-mcp-server)

A [MCP(Model Context Protocol)](https://www.anthropic.com/news/model-context-protocol) server that accesses to [Notion](https://www.notion.so/) unofficial API to export pages.

This server provides MCP-compatible access to Notion's **unofficial** API, allowing AI assistants to interact with your Notion exported page data through a standardized interface.

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

## Secrets?

### How to get

To export anything from Notion, one needs to authenticate oneself with some Cookies (like a browser would). These cookies are called `token_v2` and `file_token`. They are set on all requests of a logged in user when using the Notion web-app.

1. Go to notion.so.
2. Log in with your account.
3. Open the developer tools of your browser, open Application > Storage > Cookies (Chrome); Storage tab (Firefox).
4. Copy the value of the Cookies called `token_v2` and `file_token` and paste them somewhere safe.
   - ⚠️ If you don't find file_token, you need to have at least had exported a file manually once.
5. Those cookies have a 1 year validity, so you don't need to do this often.

### Note on Stability

This tool completely relies on the export/download feature of the official but internal Notion.so API. The advantage is, that we do not generate any markup ourselves, just download and extract some ZIPs. While the download feature seems to be pretty stable, keep in mind that it still is an internal API, **so it may break anytime.**

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
