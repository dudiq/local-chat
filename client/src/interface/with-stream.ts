import {ChatMessageValueObject} from "../core/chat";
import {chatStore} from "./chat.store";

export function withStream({room, user}: {room: string, user: string}){
  const es = new EventSource(`/api/sse?room=${room}&user=${encodeURIComponent(user)}`);

  es.onmessage = (event) => {
    const data: ChatMessageValueObject = JSON.parse(event.data);

    if (data.type === 'connected' && data.userUuid) {
      // Store userUuid received from server
      chatStore.userUuid = data.userUuid;
    } else if (data.type === 'chat') {
      chatStore.messages.push(data)
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
