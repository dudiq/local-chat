import {rooms} from "../interface/rooms.store";

import {handleDisconnect} from "../interface/handle-disconnect";
import {userSessions} from "../interface/user-sessions.store";
import {LIMITS} from "../core/limits.constants";

export async function routeSend(req: Request) {
  // Check payload size limit
  const contentLength = parseInt(req.headers.get('content-length') || '0');
  if (contentLength > LIMITS.MAX_PAYLOAD_SIZE) {
    return new Response("Payload too large", {status: 413});
  }

  try {
    const body = await req.json();
    const {userUuid, text, file, type, isEncrypted} = body; // file = { name, data: base64 }

    // Lookup session by userUuid
    const session = userSessions.get(userUuid);
    if (!session) {
      return new Response("Invalid session", {status: 401});
    }

    const {roomId, user} = session;
    console.log('send', roomId, user);

    if (rooms.has(roomId)) {
      const messageType = type ?? 'chat';
      const message = JSON.stringify({type: messageType, user, text, file,
        timestamp: Date.now(),
        isEncrypted,
      });
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
