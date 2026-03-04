export function FileView({fileData, name}: {fileData: string, name: string}) {
  return <div >
    <a href={fileData} download={name}>[{name}]</a>
    {fileData.startsWith('data:image') && (
      <img src={fileData} alt={name}/>
    )}
  </div>

}
