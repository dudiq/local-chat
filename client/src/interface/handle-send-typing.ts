import {chatStore} from "./chat.store";
import {sendData} from "../infra/send-data";

export async function handleSendTyping() {
  if (chatStore.typingTimeout) return;// prevent spam more than 1 sec

  await sendData(chatStore.userUuid, {
    type: 'typing',
  });

  chatStore.typingTimeout = setTimeout(() => {
    chatStore.typingTimeout = undefined;
  }, 1000);
}
