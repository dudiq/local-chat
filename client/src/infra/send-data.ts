export async function sendData(userUuid: string, data: {
  type: 'chat'
  text: string,
  file?: { name: string, data: string }
} | { type: 'typing' }) {

  await fetch('/api/send', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({userUuid, ...data}),
  });
}
