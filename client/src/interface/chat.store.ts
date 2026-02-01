import {proxy, useSnapshot} from 'valtio'
import {ChatMessageValueObject} from "../core/chat";

export const chatStore = proxy<{
  typingTimeout?: number
  fileName?: string
  typingUsers: Record<string, number>,
  joined: boolean,
  room: string;
  user: string,
  userUuid: string,
  users: string[],
  input: string,
  messages: ChatMessageValueObject[],
  password: string // E2E encryption password
}>({
  typingTimeout: undefined,
  fileName: undefined,
  joined: false,
  typingUsers: {},
  room: '',
  user: '',
  userUuid: '',
  users: [],
  input: '',
  messages: [],
  password: '',
})

export function useChatStore() {
  return useSnapshot(chatStore)
}
