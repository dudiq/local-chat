type Props = {
  onSelect: (files: File[]) => void;
}
export function FileInput({onSelect}: Props){
  return (
    <input
      type="file"
      className="file-input"
      multiple
      onChange={e => {
        if (!e.target.files) return
        const files = e.target.files
        if (!files) return;
        onSelect([...files])
        e.target.value = ''
      }}
    />
  )
}
