import {rooms} from "../interface/rooms.store";
import {getRoomUsers} from "../interface/get-room-users";
import {handleDisconnect} from "../interface/handle-disconnect";
import {LIMITS} from "../core/limits.constants";
import {handleAddUser} from "../interface/handle-add-user";
import {handleEnsureRoom} from "../interface/handle-ensure-room";

const generateUuid = () => crypto.randomUUID();

export async function routeSse(req: Request) {
  const url = new URL(req.url);
  const roomId = url.searchParams.get("room");
  const user = url.searchParams.get("user");
  if (!roomId) return new Response("No room specified", {status: 400});
  if (!user) return new Response("No user specified", {status: 400});

  // Check limits before creating connection
  try {
    const existingRoom = rooms.get(roomId);
    if (!existingRoom && rooms.size >= LIMITS.MAX_ROOMS) {
      return new Response("Maximum room limit reached", {status: 503});
    }
    if (existingRoom && existingRoom.controllers.size >= LIMITS.MAX_USERS_PER_ROOM) {
      return new Response("Room is full", {status: 503});
    }
  } catch (e) {
    return new Response("Service unavailable", {status: 503});
  }

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
            handleDisconnect(roomId, client);
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
