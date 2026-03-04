import {FileInput} from "./file-input";
import {useChatStore} from "../../interface/chat.store";

type Props = {
  onSelect: (files: File[]) => void;
}

export function FileSelect({onSelect}: Props) {
  const chatStoreSnapshot = useChatStore()

  const fileName = chatStoreSnapshot.fileName || ''

  return (
    <label className="file-label">
      <FileInput
        onSelect={onSelect}
      />
      {fileName
        ?
        <div className="file-name">
          [{fileName}]
          <button className="btn" onClick={(e) => {
            e.preventDefault();
            onSelect([])
          }}>x</button>
        </div>
        : '[attach]'}
    </label>
  )
}
