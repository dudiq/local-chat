import {FileInput} from "./file-input";
import {useChatStore} from "../../interface/chat.store";

type Props = {
  onFile: (files: File[]) => void;
}

export function FileSelect({onFile}: Props) {
  const chatStoreSnapshot = useChatStore()

  const fileName = chatStoreSnapshot.fileName || ''

  return (
    <label className="file-label">
      <FileInput
        onFile={onFile}
      />
      {fileName
        ?
        <div className="file-name">
          [{fileName}]
          <button className="btn" onClick={(e) => {
            e.preventDefault();
            onFile([])
          }}>x</button>
        </div>
        : '[attach]'}
    </label>
  )
}
