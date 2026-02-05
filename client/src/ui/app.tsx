import {useChatStore} from "../interface/chat.store";
import {JoinForm} from "./join-form";
import {handleJoin} from "../interface/handle-join";
import {ChatContainer} from "./chat/chat-container";

export function App() {
  const {joined} = useChatStore()

  if (!joined) {
    return <JoinForm onJoin={handleJoin}/>;
  }

  return (
    <ChatContainer/>
  )
}
