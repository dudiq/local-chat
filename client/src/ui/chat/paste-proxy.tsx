import {useEffect} from "react";
import {getFilesFromClipboard} from "../../interface/get-files-from-clipboard";

type Props = {
  onFile: (files: File[]) => void;
}

export function PasteProxy({onFile}: Props) {
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const files = getFilesFromClipboard(e.clipboardData)
      if (files.length === 0) return
      onFile(files)
    }
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  return <></>
}
