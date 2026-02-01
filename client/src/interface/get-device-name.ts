/**
 * Generates a default username based on device/OS from user agent
 */
export function generateDeviceName(): string {
  const ua = navigator?.userAgent?.toLowerCase() ?? ''
  
  const device = 
    ua.includes('iphone') ? 'iPhone' :
    ua.includes('ipad') ? 'iPad' :
    ua.includes('android') ? 'Android' :
    ua.includes('windows') ? 'Windows' :
    ua.includes('mac') ? 'Mac' :
    ua.includes('linux') ? 'Linux' : 'Device'
  
  const id = Math.floor(1000 + Math.random() * 9000)
  
  return `${device}-${id}`
}
