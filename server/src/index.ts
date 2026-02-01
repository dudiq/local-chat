import {serve} from "bun";

type RoomState = {
  controllers: Set<ReadableStreamDefaultController>;
  users: Map<string, number>;
  controllerUsers: Map<ReadableStreamDefaultController, string>;
  controllerUuids: Map<ReadableStreamDefaultController, string>; // controller -> userUuid
};

// RoomID -> RoomState
const rooms = new Map<string, RoomState>();

// UserUuid -> { roomId, user }
type UserSession = {
  roomId: string;
  user: string;
};
const userSessions = new Map<string, UserSession>();

const generateUuid = () => crypto.randomUUID();


const ensureRoom = (roomId: string) => {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      controllers: new Set(),
      users: new Map(),
      controllerUsers: new Map(),
      controllerUuids: new Map(),
    });
  }
  return rooms.get(roomId)!;
};

const listUsers = (room: RoomState) => Array.from(room.users.keys());

const addUser = (room: RoomState, user: string, controller: ReadableStreamDefaultController, userUuid: string, roomId: string) => {
  room.controllers.add(controller);
  room.controllerUsers.set(controller, user);
  room.controllerUuids.set(controller, userUuid);
  room.users.set(user, (room.users.get(user) ?? 0) + 1);
  // Register session
  userSessions.set(userUuid, { roomId, user });
};

const removeController = (room: RoomState, controller: ReadableStreamDefaultController) => {
  const user = room.controllerUsers.get(controller);
  const userUuid = room.controllerUuids.get(controller);
  room.controllers.delete(controller);
  room.controllerUsers.delete(controller);
  room.controllerUuids.delete(controller);
  // Clean up session
  if (userUuid) {
    userSessions.delete(userUuid);
  }
  if (!user) return {user: null, removed: false};

  const current = (room.users.get(user) ?? 0) - 1;
  if (current <= 0) {
    room.users.delete(user);
    return {user, removed: true};
  }
  room.users.set(user, current);
  return {user, removed: false};
};

const handleDisconnect = (roomId: string, controller: ReadableStreamDefaultController) => {
  const room = rooms.get(roomId);
  if (!room) return;
  if (!room.controllerUsers.has(controller)) return;

  const removedInfo = removeController(room, controller);

  if (room.controllers.size === 0) {
    rooms.delete(roomId);
    return;
  }

  if (removedInfo.removed && removedInfo.user) {
    const usersEvent = JSON.stringify({type: "users", users: listUsers(room)});
    const systemEvent = JSON.stringify({type: "system", text: `${removedInfo.user} disconnected`});
    const usersEventString = `data: ${usersEvent}\n\n`;
    const systemEventString = `data: ${systemEvent}\n\n`;
    for (const client of room.controllers) {
      try {
        client.enqueue(usersEventString);
        client.enqueue(systemEventString);
      } catch (e) {
        removeController(room, client);
        console.error("send-error", e);
      }
    }
  }
};

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
            const room = ensureRoom(roomId);
            addUser(room, user, controller, userUuid, roomId);

            // Send userUuid to the connecting client first
            const connectEvent = JSON.stringify({type: "connected", userUuid});
            controller.enqueue(`data: ${connectEvent}\n\n`);

            const usersEvent = JSON.stringify({type: "users", users: listUsers(room)});
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
                removeController(room, client);
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
