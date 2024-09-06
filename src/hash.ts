export async function hash_string(message: string): Promise<string> {
  let data = new TextEncoder().encode(message)
  let digest = await crypto.subtle.digest('SHA-256', data)
  data = new Uint8Array(digest)
  let hex = ''
  for (let i = 0; i < 32; i++) {
    let byte = data[i]
    let str = byte.toString(16)
    if (byte < 16) {
      hex += '0' + str
    } else {
      hex += str
    }
  }
  return hex
}
