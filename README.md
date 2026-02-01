# Local Chat

Simple real-time chat for your local network. Share text, links, and images between your devices instantly — phone to laptop, tablet to desktop, or any device with a browser.

![two screens](example.png "Two screens")

## Why?

Ever needed to quickly send a link from your phone to your computer? Or share a screenshot between devices without uploading to cloud services? Local Chat solves this by providing a lightweight, self-hosted chat that works entirely within your local network.

**Use cases:**
- Share links, code snippets, or notes between your devices
- Transfer images without cloud uploads or cables
- Quick copy-paste across different operating systems
- No accounts, no internet required — just your local network

## Features

- Real-time messaging via SSE
- Multiple chat rooms
- Typing indicators
- File sharing (images)
- Light/dark theme
- Auto-generated usernames based on device

## Tech Stack

- **Frontend**: React, TypeScript, Valtio
- **Backend**: Bun
- **Protocol**: SSE (Server-Sent Events)
- **Package manager**: PNPM

## Installation

### Using Docker (Recommended)

```bash
docker-compose up -d
```

App will be available at `http://localhost:3000`

### Manual Setup

1. Install dependencies:

```bash
# Client
cd client && pnpm i

# Server (requires Bun)
cd server && pnpm i
```

2. Build frontend:

```bash
cd client && pnpm build
```

3. Run server:

```bash
cd server && pnpm start
```

App will be available at `http://localhost:3000`

## License

MIT
