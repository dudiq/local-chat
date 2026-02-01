import {ChatMessageValueObject} from "../core/chat";
import {chatStore} from "./chat.store";
import {decrypt} from "./crypto";

async function decryptMessage(data: ChatMessageValueObject): Promise<ChatMessageValueObject> {
  if (!chatStore.password) return data;

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
    return {...data, text: data.text ? '[encrypted or wrong password]' : data.text};
  }
}

export function withStream({room, user}: { room: string, user: string }) {
  const es = new EventSource(`/api/sse?room=${room}&user=${encodeURIComponent(user)}`);

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

  // Clear old "typing" statuses (after 3 seconds of inactivity)
  const interval = setInterval(() => {
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

  return () => {
    es.close();
    clearInterval(interval);
  };
}
