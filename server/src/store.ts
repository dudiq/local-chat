export type RoomState = {
  controllers: Set<ReadableStreamDefaultController>;
  users: Map<string, number>;
  controllerUsers: Map<ReadableStreamDefaultController, string>;
  controllerUuids: Map<ReadableStreamDefaultController, string>; // controller -> userUuid
};

// Memory protection limits
export const LIMITS = {
  MAX_ROOMS: 1000,
  MAX_USERS_PER_ROOM: 100,
  MAX_PAYLOAD_SIZE: 50 * 1024 * 1024, // 50MB
} as const;

// RoomID -> RoomState
export const rooms = new Map<string, RoomState>();

// UserUuid -> { roomId, user }
type UserSession = {
  roomId: string;
  user: string;
};

export const userSessions = new Map<string, UserSession>();

