import {proxy, useSnapshot} from 'valtio'
import {ChatMessageValueObject} from "../core/chat-message.value-object";
import {ConnectionStateValueObject} from "../core/connection-state.value-object";

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
  connectionState: ConnectionStateValueObject
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
  connectionState: 'disconnected',
})

export function useChatStore() {
  return useSnapshot(chatStore)
}
