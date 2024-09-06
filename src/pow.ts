import { hash_string } from './hash'

export function to_string(x: any): string {
  if (typeof x === 'string') {
    return x
  }
  let s = JSON.stringify(x)
  if (s !== '{}') {
    return s
  }
  return x.toString()
}

const full_difficulty_hex = '1' + '0'.repeat(64)
const max_difficulty_hex = 'f'.repeat(64)
const max_difficulty_num = Math.pow(16, 64)

/**
 * @param difficulty: real number, range from 0 (easiest) to 1 (hardest)
 * @return hex string of 64 chars
 * the hash of pow should be larger than or equal to the result hex
 * */
export function difficulty_to_hex(difficulty: number): string {
  if (difficulty < 0 || difficulty > 1) {
    console.error('difficulty out of range:', {
      difficulty,
    })
    throw new Error('out of range')
  }
  let hex = (max_difficulty_num * difficulty).toString(16)
  hex = hex.split('.')[0]
  if (hex == full_difficulty_hex) {
    return max_difficulty_hex
  }
  if (hex.length !== 64) {
    hex = '0'.repeat(64 - hex.length) + hex
  }
  return hex
}

export function difficulty_from_hex(difficulty_hex: string): number {
  if (difficulty_hex.length !== 64) {
    console.error('invalid difficulty_hex:', { difficulty_hex })
    throw new Error('invalid difficulty_hex')
  }
  let difficulty = parseInt(difficulty_hex, 16) / max_difficulty_num
  if (difficulty < 0 || difficulty > 1) {
    console.error('difficulty_hex out of range:', {
      difficulty_hex,
      difficulty,
    })
    throw new Error('out of range')
  }
  return difficulty
}

/**
 * @param args.message: the message to be used to do pow
 * @param args.difficulty_hex: result hash should be larger than or equal to difficulty_hex
 * @param args.max_duration: timeout duration in ms, will terminate early if timeout
 * @return hash: hex string of 64 chars in lower case
 * @return nonce: the nonce used in the pow
 * @return elapsed: the ms passed during gen_pow()
 * */
export async function gen_pow(args: {
  message: string
  difficulty_hex: string
  max_duration: number
}): Promise<
  | {
      success: true
      nonce: number
      hash: string
      elapsed: number
    }
  | {
      success: false
      reason: 'timeout'
      nonce: number
      elapsed: number
    }
> {
  let { message, difficulty_hex, max_duration } = args
  if (difficulty_hex.length !== 64) {
    console.error('invalid difficulty_hex:', { difficulty_hex })
    throw new Error('invalid difficulty_hex')
  }
  let nonce = 0
  let start = Date.now()
  if (difficulty_hex === 'f'.repeat(difficulty_hex.length)) {
    let elapsed = Date.now() - start
    return { success: false, reason: 'timeout', nonce, elapsed }
  }
  for (;;) {
    let elapsed = Date.now() - start
    if (elapsed > max_duration) {
      return { success: false, reason: 'timeout', nonce, elapsed }
    }
    let hash = await hash_string(`${nonce}:${message}`)
    if (hash >= difficulty_hex) {
      return { success: true, hash, nonce, elapsed }
    }
    nonce++
  }
}

/**
 * @param args.nonce: the nonce used in the pow
 * @param args.difficulty_hex: result hash should be larger than or equal to difficulty_hex
 * @param args.message: the message to be used to do pow
 * @return boolean if it pass the pow difficulty requirement
 * */
export async function verify_pow(args: {
  nonce: number
  difficulty_hex: string
  message: string
}): Promise<boolean> {
  if (args.difficulty_hex.length !== 64) {
    throw new Error('invalid hex length')
  }
  let hash = await hash_string(`${args.nonce}:${args.message}`)
  return hash >= args.difficulty_hex
}
