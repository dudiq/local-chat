import {serve} from "bun";
import {
  handleEnsureRoom,
  handleAddUser,
  handleDisconnect,
  handleRemoveController, getRoomUsers
} from './controller'

import {rooms, userSessions} from './store'

const generateUuid = () => crypto.randomUUID();

const server = serve({
  port: 3000,
  idleTimeout: 0,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. SSE Endpoint: Connect to room
    if (url.pathname === "/api/sse") {
      const roomId = url.searchParams.get("room");
      const user = url.searchParams.get("user");
      if (!roomId) return new Response("No room specified", {status: 400});
      if (!user) return new Response("No user specified", {status: 400});

      const userUuid = generateUuid();
      let streamController: ReadableStreamDefaultController | null = null;
      let keepAliveInterval: ReturnType<typeof setInterval> | null = null;
      let cleanedUp = false;

      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        keepAliveInterval = null;
        if (streamController) handleDisconnect(roomId, streamController);
      };

      req.signal.addEventListener("abort", cleanup, {once: true});

      return new Response(
        new ReadableStream({
          start(controller) {
            streamController = controller;
            const room = handleEnsureRoom(roomId);
            handleAddUser(room, user, controller, userUuid, roomId);

            // Send userUuid to the connecting client first
            const connectEvent = JSON.stringify({type: "connected", userUuid});
            controller.enqueue(`data: ${connectEvent}\n\n`);

            const usersEvent = JSON.stringify({type: "users", users: getRoomUsers(room)});
            const systemEvent = JSON.stringify({type: "system", text: `${user} connected`});
            const usersEventString = `data: ${usersEvent}\n\n`;
            const systemEventString = `data: ${systemEvent}\n\n`;
            for (const client of room.controllers) {
              try {
                client.enqueue(usersEventString);
                if (client !== controller) {
                  client.enqueue(systemEventString);
                }
              } catch (e) {
                handleRemoveController(room, client);
                console.error("send-error", e);
              }
            }

            keepAliveInterval = setInterval(() => {
              if (!streamController) return;
              try {
                streamController.enqueue(": ping\n\n");
              } catch (e) {
                cleanup();
                console.error("send-error", e);
              }
            }, 20000);
          },
          cancel() {
            cleanup();
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        }
      );
    }

    // 2. POST Endpoint
    if (url.pathname === "/api/send" && req.method === "POST") {
      try {
        const body = await req.json();
        const {userUuid, text, file, type} = body; // file = { name, data: base64 }

        // Lookup session by userUuid
        const session = userSessions.get(userUuid);
        if (!session) {
          return new Response("Invalid session", {status: 401});
        }

        const {roomId, user} = session;
        console.log('send', roomId, user);

        if (rooms.has(roomId)) {
          const messageType = type ?? 'chat';
          const message = JSON.stringify({type: messageType, user, text, file});
          const eventString = `data: ${message}\n\n`;

          for (const controller of rooms.get(roomId)!.controllers) {
            try {
              controller.enqueue(eventString);
            } catch (e) {
              handleDisconnect(roomId, controller);
              console.error('send-error', e);
            }
          }
        }
        return new Response("Sent", {status: 200});
      } catch (e) {
        return new Response("Error", {status: 500});
      }
    }

    // 3. static
    const buildPath = "./public";
    let filePath = url.pathname;
    if (filePath === "/") filePath = "/index.html";

    const file = Bun.file(`${buildPath}${filePath}`);
    if (await file.exists()) {
      return new Response(file);
    }

    // Fallback SPA
    return new Response(Bun.file(`${buildPath}/index.html`));
  },
});

console.log(`Server running on http://localhost:${server.port}`);
