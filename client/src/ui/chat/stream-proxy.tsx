import {useChatStore} from "../../interface/chat.store";
import {useEffect} from "react";
import {withStream} from "../../interface/with-stream";

export function StreamProxy(){
  const {room, user} = useChatStore()

  useEffect(() => {
    if (!room || !user) return;
    return withStream({room, user})
  }, [room, user]);

  return <></>
}
