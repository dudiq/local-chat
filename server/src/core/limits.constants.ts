// Memory protection limits
export const LIMITS = {
  MAX_ROOMS: 1000,
  MAX_USERS_PER_ROOM: 100,
  MAX_PAYLOAD_SIZE: 50 * 1024 * 1024, // 50MB
} as const;
