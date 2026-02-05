type Props = {
  onFile: (files: File[]) => void;
}
export function FileInput({onFile}: Props){
  return (
    <input
      type="file"
      className="file-input"
      onChange={e => {
        if (!e.target.files) return
        const files = e.target.files
        if (!files) return;
        onFile([...files])
        e.target.value = ''
      }}
    />
  )
}
