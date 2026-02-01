import {useChatStore} from "../interface/chat.store";
import {useEffect, useRef} from "react";

export function ChatBody(){
  const {messages} = useChatStore()

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

  return (
    <div className="terminal-body">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className="message">
            {m.type === 'system' ? (
              <div className="message-system">{m.text}</div>
            ) : (
              <>
                <div className="message-line">
                  <span className="message-prompt">&gt;</span>
                  <span className="message-user">{m.user}</span>
                  <span className="message-text">{m.text}</span>
                </div>
                {m.file && (
                  <div className="message-attachment">
                    <a href={m.file.data} download={m.file.name}>[{m.file.name}]</a>
                    {m.file.data.startsWith('data:image') && (
                      <img src={m.file.data} alt={m.file.name}/>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef}/>
      </div>
    </div>
  )
}
