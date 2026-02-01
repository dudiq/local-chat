import {chatStore} from "./chat.store";

export function handleJoin({room, user}: {room:string, user: string}){
  chatStore.room = room;
  chatStore.user = user;
  chatStore.joined = true
}
