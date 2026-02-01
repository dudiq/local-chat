export function sessionStorage<T>(key: string){
  const set = (value: T) => {
    const payload = JSON.stringify({data: value})
    window.sessionStorage.setItem(key, payload)
  }

  const get = (): T | undefined => {
    try {
      const payload = window.sessionStorage.getItem(key)
      if (!payload) return
      return JSON.parse(payload).data
    } catch (e) {
      return undefined
    }
  }

  return {
    set, get
  }
}
