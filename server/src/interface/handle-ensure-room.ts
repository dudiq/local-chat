import {rooms} from "./rooms.store";
import {LIMITS} from "../core/limits.constants";

export function handleEnsureRoom(roomId: string) {
  if (!rooms.has(roomId)) {
    if (rooms.size >= LIMITS.MAX_ROOMS) {
      throw new Error("Maximum room limit reached");
    }
    rooms.set(roomId, {
      controllers: new Set(),
      users: new Map(),
      controllerUsers: new Map(),
      controllerUuids: new Map(),
    });
  }
  return rooms.get(roomId)!;
}
