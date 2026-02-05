import type {RoomState} from "./rooms.store";
import {LIMITS} from "../core/limits.constants";
import {userSessions} from "./user-sessions.store";

export function handleAddUser(room: RoomState, user: string, controller: ReadableStreamDefaultController, userUuid: string, roomId: string) {
  if (room.controllers.size >= LIMITS.MAX_USERS_PER_ROOM) {
    throw new Error("Room is full");
  }
  room.controllers.add(controller);
  room.controllerUsers.set(controller, user);
  room.controllerUuids.set(controller, userUuid);
  room.users.set(user, (room.users.get(user) ?? 0) + 1);
  // Register session
  userSessions.set(userUuid, {roomId, user});
}
