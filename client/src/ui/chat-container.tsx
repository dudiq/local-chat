import {useCallback, useEffect, useRef} from 'react';
import {chatStore, useChatStore} from "../interface/chat.store";
import {withStream} from "../interface/with-stream";
import {handleSendTyping} from "../interface/handle-send-typing";
import {handleSendData} from "../interface/handle-send-data";
import {ChatHeader} from "./chat-header";
import {ChatBody} from "./chat-body";
import {Typings} from "./typings";
import {getFilesFromClipboard} from "../interface/get-files-from-clipboard";

export function ChatContainer() {
  const chatStoreSnapshot = useChatStore()

  const room = chatStoreSnapshot.room
  const user = chatStoreSnapshot.user
  const input = chatStoreSnapshot.input

  const fileRef = useRef<File | undefined>(undefined)

  const handleFileChange = useCallback((files: File[]) => {
    const file = files[0];
    fileRef.current = file;
    chatStore.fileName = file?.name
  }, [])

  useEffect(() => {
    if (!room || !user) return;
    return withStream({room, user})
  }, [room, user]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const files = getFilesFromClipboard(e.clipboardData)
      if (files.length === 0) return
      handleFileChange(files)
    }
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);


  const handleSend = useCallback(async () => {
    const file = fileRef.current
    const input = chatStore.input

    if (!input && !file) return;

    fileRef.current = undefined
    chatStore.fileName = ''
    chatStore.input = ''

    await handleSendData({
      text: input, file,
    })
  }, []);

  const fileName = chatStoreSnapshot.fileName || ''

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
            className="file-input"
            id="file-input"
            onChange={e => {
              if (!e.target.files) return
              const files = e.target.files
              if (!files) return;
              handleFileChange([...files])
              e.target.value = ''
            }}
          />
          <button className="btn btn-primary" onClick={handleSend}>send</button>
          <label htmlFor="file-input" className="file-label">
            {fileName
              ?
              <div className="file-name">
                [{fileName}]
                <button className="btn" onClick={(e) => {
                  e.preventDefault();
                  fileRef.current = undefined
                  chatStore.fileName = ''
                }}>x</button>
              </div>
              : '[attach]'}
          </label>
        </div>
      </div>
    </div>
  );
}
