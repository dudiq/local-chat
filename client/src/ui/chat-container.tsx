import {useEffect, useRef} from 'react';
import {chatStore, useChatStore} from "../interface/chat.store";
import {withStream} from "../interface/with-stream";
import {handleSendTyping} from "../interface/handle-send-typing";
import {handleSendData} from "../interface/handle-send-data";
import {ChatHeader} from "./chat-header";
import {ChatBody} from "./chat-body";
import {Typings} from "./typings";

export function ChatContainer() {
  const chatStoreSnapshot = useChatStore()

  const room = chatStoreSnapshot.room
  const user = chatStoreSnapshot.user
  const input = chatStoreSnapshot.input

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!room || !user) return;
    return withStream({room, user})
  }, [room, user]);

  const handleSend = async () => {
    const file = fileInputRef.current?.files?.[0]
    const input = chatStore.input

    if (fileInputRef.current?.value) {
      fileInputRef.current.value = ''
      chatStore.fileName = ''
    }

    if (!input && !file) return;
    chatStore.input = ''

    await handleSendData({
      text: input, file,
    })
  };

  const fileName = chatStoreSnapshot.fileName

  return (
    <div className="terminal">
      <ChatHeader/>

      <ChatBody/>

      <div className="terminal-input">
        <Typings/>
        <div className="input-line">
          <span className="input-prompt">{user}@{room} $</span>
          <input
            className="input-field"
            value={input}
            onChange={e => {
              chatStore.input = e.target.value
              handleSendTyping();
            }}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="type a message..."
            autoFocus
          />
        </div>
        <div className="input-actions">
          <input
            type="file"
            ref={fileInputRef}
            className="file-input"
            id="file-input"
            onChange={e => {
              if (!e.target.files) return
              chatStore.fileName = e.target.files[0]?.name
            }}
          />
          <button className="btn btn-primary" onClick={handleSend}>send</button>
          <label htmlFor="file-input" className="file-label">
            {fileName
              ?
              <div className="file-name">
                [{fileName}]
                <button className="btn" onClick={(e) => {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                  chatStore.fileName = ''
                  e.preventDefault();
                }}>x</button>
              </div>
              : '[attach]'}
          </label>
        </div>
      </div>
    </div>
  );
}
