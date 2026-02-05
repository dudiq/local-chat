import {useChatStore} from "../../interface/chat.store";

export function CurrentUser() {
  const {room, user} = useChatStore()
  return (<span className="input-prompt">{user}@{room} $</span>)
}
