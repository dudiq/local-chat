import {ChatMessageValueObject} from "../core/chat-message.value-object";
import {chatStore} from "./chat.store";
import {decrypt} from "./crypto";

async function decryptMessage(data: ChatMessageValueObject): Promise<ChatMessageValueObject> {
  if (!data.isEncrypted) return data
  if (!chatStore.password) return {
    ...data,
    text: data.text ? '[encrypted - no password set]' : data.text,
    file: undefined
  };

  try {
    const decrypted = {...data};
    if (data.text) {
      decrypted.text = await decrypt(data.text, chatStore.password);
    }
    if (data.file) {
      decrypted.file = {
        name: await decrypt(data.file.name, chatStore.password),
        data: await decrypt(data.file.data, chatStore.password)
      };
    }
    return decrypted;
  } catch {
    // Decryption failed - message might be unencrypted or wrong password
    return {...data,
      text: data.text ? '[encrypted or wrong password]' : data.text,
      file: undefined
    };
  }
}

// Reconnection configuration
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds
const BACKOFF_MULTIPLIER = 2;

export function withStream({room, user}: { room: string, user: string }) {
  let es: EventSource | null = null;
  let retryDelay = INITIAL_RETRY_DELAY;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;
  let typingCleanupInterval: ReturnType<typeof setInterval> | null = null;
  let isCleanedUp = false;

  function connect() {
    if (isCleanedUp) return;

    chatStore.connectionState = 'connecting';
    es = new EventSource(`/api/sse?room=${room}&user=${encodeURIComponent(user)}`);

    es.onopen = () => {
      chatStore.connectionState = 'connected';
      // Reset retry delay on successful connection
      retryDelay = INITIAL_RETRY_DELAY;
      console.log('[SSE] Connected');
    };

    es.onmessage = async (event) => {
      const data: ChatMessageValueObject = JSON.parse(event.data);

      if (data.type === 'connected' && data.userUuid) {
        // Store userUuid received from server
        chatStore.userUuid = data.userUuid;
      } else if (data.type === 'chat') {
        const decrypted = await decryptMessage(data);
        chatStore.messages.push(decrypted)
        // If user sent a message, they stopped typing
        if (data.user) {
          const next = {...chatStore.typingUsers};
          delete next[data.user as string];
          chatStore.typingUsers = next
        }
      } else if (data.type === 'typing' && data.user && data.user !== user) {
        chatStore.typingUsers = {
          ...chatStore.typingUsers,
          [data.user]: Date.now()
        }
      } else if (data.type === 'system') {
        chatStore.messages.push(data)
      } else if (data.type === 'users' && Array.isArray(data.users)) {
        chatStore.users = data.users
      }
    };

    es.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      chatStore.connectionState = 'disconnected';

      // Close current connection
      if (es) {
        es.close();
        es = null;
      }

      // Schedule reconnection with exponential backoff
      if (!isCleanedUp) {
        console.log(`[SSE] Reconnecting in ${retryDelay / 1000}s...`);
        retryTimeout = setTimeout(() => {
          connect();
        }, retryDelay);

        // Increase delay for next retry (exponential backoff)
        retryDelay = Math.min(retryDelay * BACKOFF_MULTIPLIER, MAX_RETRY_DELAY);
      }
    };
  }

  // Start connection
  connect();

  // Clear old "typing" statuses (after 3 seconds of inactivity)
  typingCleanupInterval = setInterval(() => {
    const now = Date.now();
    const prev = chatStore.typingUsers
    const next = {...chatStore.typingUsers};
    let changed = false;
    for (const u in next) {
      // @ts-ignore
      if (now - next[u] > 3000) {
        delete next[u];
        changed = true;
      }
    }
    chatStore.typingUsers = changed ? next : prev;
  }, 1000);

  // Cleanup function
  return () => {
    isCleanedUp = true;
    chatStore.connectionState = 'disconnected';

    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }

    if (typingCleanupInterval) {
      clearInterval(typingCleanupInterval);
      typingCleanupInterval = null;
    }

    if (es) {
      es.close();
      es = null;
    }
  };
}
