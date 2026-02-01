import {toBase64} from "./to-base64";
import {chatStore} from "./chat.store";
import {sendData} from "../infra/send-data";

export async function handleSendData({text, file}: {
  text: string,
  file?: File
}) {
  let fileData = undefined;
  if (file) {
    const base64 = await toBase64(file);
    fileData = {name: file.name, data: base64};
  }

  await sendData(chatStore.userUuid, {
    type: 'chat',
    text,
    file: fileData
  })
}
