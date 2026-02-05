import {toBase64} from "./to-base64";
import {chatStore} from "./chat.store";
import {sendData} from "../infra/send-data";
import {buildMessageAad, encrypt} from "./crypto";

type FileData = {
  name: string;
  data: string; // base64 string
}

async function getFileData(file?: File) {
  if (!file) return undefined;
  const base64 = await toBase64(file);
  return {name: file.name, data: base64};
}

async function encryptData({
                             text,
                             fileData,
                             room,
                             user,
                             type,
                           }: {
  text: string
  fileData?: FileData
  room: string
  user: string
  type: string
}) {
  if (!chatStore.password) {
    return {text, fileData};
  }
  const encryptedText = await encrypt(text, chatStore.password, buildMessageAad({room, user, type, part: 'text'}));
  if (!fileData) return {text: encryptedText};

  const encryptedFile = {
    name: await encrypt(fileData.name, chatStore.password, buildMessageAad({room, user, type, part: 'file-name'})),
    data: await encrypt(fileData.data, chatStore.password, buildMessageAad({room, user, type, part: 'file-data'}))
  };

  return {text: encryptedText, fileData: encryptedFile};
}

export async function handleSendData({text, file}: {
  text: string,
  file?: File
}) {
  const fileData = await getFileData(file)

  const passData = await encryptData({
    text,
    fileData,
    room: chatStore.room,
    user: chatStore.user,
    type: 'chat',
  })

  await sendData(chatStore.userUuid, {
    type: 'chat',
    isEncrypted: !!chatStore.password,
    text: passData.text,
    file: passData.fileData
  })
}
