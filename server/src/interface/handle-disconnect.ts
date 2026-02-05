import {rooms, RoomState} from "./rooms.store";
import {getRoomUsers} from "./get-room-users";
import {userSessions} from "./user-sessions.store";

function handleRemoveController(room: RoomState, controller: ReadableStreamDefaultController) {
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
}

export function handleDisconnect(roomId: string, controller: ReadableStreamDefaultController) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (!room.controllerUsers.has(controller)) return;

  const removedInfo = handleRemoveController(room, controller);

  if (room.controllers.size === 0) {
    rooms.delete(roomId);
    return;
  }

  if (removedInfo.removed && removedInfo.user) {
    const usersEvent = JSON.stringify({type: "users", users: getRoomUsers(room)});
    const systemEvent = JSON.stringify({type: "system", text: `${removedInfo.user} disconnected`});
    const usersEventString = `data: ${usersEvent}\n\n`;
    const systemEventString = `data: ${systemEvent}\n\n`;

    // Collect failed controllers to clean up after iteration
    const failedControllers: ReadableStreamDefaultController[] = [];

    for (const client of room.controllers) {
      try {
        client.enqueue(usersEventString);
        client.enqueue(systemEventString);
      } catch (e) {
        failedControllers.push(client);
        console.error("send-error", e);
      }
    }

    // Clean up failed controllers after iteration to avoid modifying Set during iteration
    for (const failedClient of failedControllers) {
      handleDisconnect(roomId, failedClient);
    }
  }
}
