type Props = {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
}

export function InputField({value, onChange, onSend}: Props) {
  return (
    <input
      className="input-field"
      value={value}
      onChange={e => {
        onChange(e.target.value)
      }}
      onKeyDown={e => e.key === 'Enter' && onSend()}
      placeholder="type a message..."
      autoFocus
    />
  )
}
