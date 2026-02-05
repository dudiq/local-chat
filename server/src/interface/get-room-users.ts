import {type RoomState} from './rooms.store'

export function getRoomUsers(room: RoomState) {
  return Array.from(room.users.keys())
}

