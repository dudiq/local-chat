// Periodic cleanup of stale sessions and empty rooms (runs every 5 minutes)
import {rooms} from "./rooms.store";
import {userSessions} from "./user-sessions.store";

const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupStaleSessions() {
  let cleanedSessions = 0;
  let cleanedRooms = 0;

  // Clean up orphaned sessions (sessions pointing to non-existent rooms)
  for (const [uuid, session] of userSessions) {
    const room = rooms.get(session.roomId);
    if (!room) {
      userSessions.delete(uuid);
      cleanedSessions++;
    }
  }

  // Clean up empty rooms (rooms with no controllers)
  for (const [roomId, room] of rooms) {
    if (room.controllers.size === 0) {
      rooms.delete(roomId);
      cleanedRooms++;
    }
  }

  if (cleanedSessions > 0 || cleanedRooms > 0) {
    console.log(`[Cleanup] Removed ${cleanedSessions} stale sessions and ${cleanedRooms} empty rooms`);
  }
}

export function cleanupRooms() {
  setInterval(cleanupStaleSessions, CLEANUP_INTERVAL);
}
