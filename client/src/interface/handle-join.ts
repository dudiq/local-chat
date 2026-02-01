import {chatStore} from "./chat.store";

export function handleJoin({room, user, password}: {room:string, user: string, password: string}){
  chatStore.room = room;
  chatStore.user = user;
  chatStore.password = password;
  chatStore.joined = true
}
