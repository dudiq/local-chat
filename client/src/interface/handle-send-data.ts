import {toBase64} from "./to-base64";
import {chatStore} from "./chat.store";
import {sendData} from "../infra/send-data";
import {encrypt} from "./crypto";

export async function handleSendData({text, file}: {
  text: string,
  file?: File
}) {
  let fileData = undefined;
  if (file) {
    const base64 = await toBase64(file);
    fileData = {name: file.name, data: base64};
  }

  // Encrypt text and file data if password is set
  let encryptedText = text;
  let encryptedFile = fileData;

  if (chatStore.password) {
    if (text) {
      encryptedText = await encrypt(text, chatStore.password);
    }
    if (fileData) {
      encryptedFile = {
        name: await encrypt(fileData.name, chatStore.password),
        data: await encrypt(fileData.data, chatStore.password)
      };
    }
  }

  await sendData(chatStore.userUuid, {
    type: 'chat',
    text: encryptedText,
    file: encryptedFile
  })
}
