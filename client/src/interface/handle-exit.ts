import {chatStore} from "./chat.store";

export function handleExit() {
  chatStore.joined = false
  chatStore.room = ''
  chatStore.user = ''
  chatStore.userUuid = ''
  chatStore.users = []
  chatStore.messages = []
  chatStore.input = ''
  chatStore.typingUsers = {}
  chatStore.typingTimeout = undefined
}
