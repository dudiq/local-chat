// UserUuid -> { roomId, user }
type UserSession = {
  roomId: string;
  user: string;
};
export const userSessions = new Map<string, UserSession>();
