import {toBase64} from "./to-base64";
import {chatStore} from "./chat.store";
import {sendData} from "../infra/send-data";
import {buildMessageAad, encrypt} from "./crypto";

type FileData = {
  name: string;
  data: string; // base64 string
}

async function getFileData(files?: File[]) {
  if (!files || files.length === 0) return undefined;

  // Convert FileList/array to a real array and convert each file to base64 in parallel
  const fileArray = Array.from(files);
  const results = await Promise.all(
    fileArray.map(async (file) => ({name: file.name, data: await toBase64(file)}))
  );

  const names = results.map(r => r.name);
  const data = results.map(r => r.data);

  // Keep the same shape expected elsewhere: both fields are strings.
  // We JSON.stringify arrays so the receiver can parse them back if needed.
  return {
    name: JSON.stringify(names),
    data: JSON.stringify(data)
  } as FileData;
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

export async function handleSendData({text, files}: {
  text: string,
  files?: File[]
}) {
  const fileData = await getFileData(files)

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
