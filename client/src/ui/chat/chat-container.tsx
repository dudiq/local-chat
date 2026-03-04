import {useCallback, useRef} from 'react';
import {chatStore, useChatStore} from "../../interface/chat.store";
import {handleSendTyping} from "../../interface/handle-send-typing";
import {handleSendData} from "../../interface/handle-send-data";
import {ChatHeader} from "./chat-header";
import {ChatBody} from "./chat-body";
import {TypingsIndicator} from "./typings-indicator";
import {FileSelect} from "../input-actions/file-select";
import {PasteProxy} from "./paste-proxy";
import {InputField} from "./input-field";
import {StreamProxy} from "./stream-proxy";
import {CurrentUser} from "./current-user";

export function ChatContainer() {
  const {input} = useChatStore()

  const fileRef = useRef<File[] | undefined>(undefined)

  const handleFilesSelect = useCallback((files: File[]) => {
    fileRef.current = files;
    const name = files.length > 1 ? `${files[0]?.name} + ${files.length - 1} more` : files[0]?.name
    chatStore.fileName = name || ''
  }, [])


  const handleSend = useCallback(async () => {
    const files = fileRef.current
    const input = chatStore.input

    if (!input && !files) return;
    if (files?.length === 0) return;

    fileRef.current = undefined
    chatStore.fileName = ''
    chatStore.input = ''

    await handleSendData({
      text: input, files,
    })
  }, []);

  return (
    <>
      <div className="terminal">
        <ChatHeader/>

        <ChatBody/>

        <div className="terminal-input">
          <TypingsIndicator/>
          <div className="input-line">
            <CurrentUser/>
            <InputField
              value={input}
              onChange={value => {
                chatStore.input = value
                handleSendTyping();
              }}
              onSend={handleSend}
            />
          </div>
          <div className="input-actions">
            <button className="btn btn-primary" onClick={handleSend}>send</button>
            <FileSelect
              onSelect={handleFilesSelect}
            />
          </div>
        </div>
      </div>

      <PasteProxy
        onFile={handleFilesSelect}
      />
      <StreamProxy/>
    </>
  );
}
