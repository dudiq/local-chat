import {useChatStore} from "../interface/chat.store";
import {useEffect, useRef} from "react";
import type {ChatMessageValueObject} from "../core/chat-message.value-object";

function Message({message, isOwn}: { message: ChatMessageValueObject, isOwn: boolean }) {
  if (message.type === 'system') {
    return <div className="message-system">{message.text}</div>
  }
  return (
    <>
      <div className="message-line">
        <span className="message-prompt">&gt;</span>
        {!isOwn && <span className="message-user">{message.user}</span>}
        <span className="message-text">{message.text}</span>
      </div>
      {message.file && (
        <div className="message-attachment">
          <a href={message.file.data} download={message.file.name}>[{message.file.name}]</a>
          {message.file.data.startsWith('data:image') && (
            <img src={message.file.data} alt={message.file.name}/>
          )}
        </div>
      )}
    </>
  )
}

export function ChatBody() {
  const {messages, user} = useChatStore()

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

  return (
    <div className="terminal-body">
      <div className="messages">
        {messages.map((m, i) => {
          const isOwnMessage = m.user === user;
          return (
            <div key={i} className={`message ${isOwnMessage ? 'message-own' : ''}`}>
              <Message message={m} isOwn={isOwnMessage}/>
            </div>
          );
        })}
        <div ref={messagesEndRef}/>
      </div>
    </div>
  )
}
