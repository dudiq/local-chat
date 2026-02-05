import {useChatStore} from "../../interface/chat.store";

export function TypingsIndicator() {
  const {typingUsers} = useChatStore()

  const typingList = Object.keys(typingUsers)
  if (typingList.length === 0) return <></>

  return (
    <div className="typing-indicator">
      {typingList.join(', ')} typing...
    </div>
  )
}
