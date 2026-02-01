import {rooms, type RoomState, userSessions} from './store'

export function getRoomUsers(room: RoomState) {
  return Array.from(room.users.keys())
}

export function handleEnsureRoom(roomId: string) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      controllers: new Set(),
      users: new Map(),
      controllerUsers: new Map(),
      controllerUuids: new Map(),
    });
  }
  return rooms.get(roomId)!;
}

export function handleAddUser(room: RoomState, user: string, controller: ReadableStreamDefaultController, userUuid: string, roomId: string) {
  room.controllers.add(controller);
  room.controllerUsers.set(controller, user);
  room.controllerUuids.set(controller, userUuid);
  room.users.set(user, (room.users.get(user) ?? 0) + 1);
  // Register session
  userSessions.set(userUuid, {roomId, user});
}

export function handleRemoveController(room: RoomState, controller: ReadableStreamDefaultController) {
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
    for (const client of room.controllers) {
      try {
        client.enqueue(usersEventString);
        client.enqueue(systemEventString);
      } catch (e) {
        handleRemoveController(room, client);
        console.error("send-error", e);
      }
    }
  }
}
