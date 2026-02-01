export type RoomState = {
  controllers: Set<ReadableStreamDefaultController>;
  users: Map<string, number>;
  controllerUsers: Map<ReadableStreamDefaultController, string>;
  controllerUuids: Map<ReadableStreamDefaultController, string>; // controller -> userUuid
};

// RoomID -> RoomState
export const rooms = new Map<string, RoomState>();

// UserUuid -> { roomId, user }
type UserSession = {
  roomId: string;
  user: string;
};

export const userSessions = new Map<string, UserSession>();
