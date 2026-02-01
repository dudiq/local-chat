# Local Chat

Simple real-time chat application built with React and Bun. Users can join rooms and exchange messages instantly using Server-Sent Events (SSE).

![two screens](example.png "Two screens")

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
