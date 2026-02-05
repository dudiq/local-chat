import {toBase64} from "./to-base64";
import {chatStore} from "./chat.store";
import {sendData} from "../infra/send-data";
import {encrypt} from "./crypto";

type FileData = {
  name: string;
  data: string; // base64 string
}

async function getFileData(file?: File) {
  if (!file) return undefined;
  const base64 = await toBase64(file);
  return {name: file.name, data: base64};
}

async function encryptData(text: string, fileData?: FileData) {
  if (!chatStore.password) {
    return {text, fileData};
  }
  const encryptedText = await encrypt(text, chatStore.password);
  if (!fileData) return {text: encryptedText};

  const encryptedFile = {
    name: await encrypt(fileData.name, chatStore.password),
    data: await encrypt(fileData.data, chatStore.password)
  };

  return {text: encryptedText, fileData: encryptedFile};
}

export async function handleSendData({text, file}: {
  text: string,
  file?: File
}) {
  const fileData = await getFileData(file)

  const passData = await encryptData(text, fileData)

  await sendData(chatStore.userUuid, {
    type: 'chat',
    isEncrypted: !!chatStore.password,
    text: passData.text,
    file: passData.fileData
  })
}
