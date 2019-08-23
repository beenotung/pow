import { enc, SHA256 } from 'crypto-js';

function to_string(x: any): string {
  if (typeof x === 'string') {
    return x;
  }
  const s = JSON.stringify(x);
  if (s !== '{}') {
    return s;
  }
  return x.toString();
}

/**
 * @return hex string of 64 chars
 * */
function hash_with_nonce(args: { message: any; nonce: number }): string {
  const s: string = to_string(args.message) + args.nonce;
  return SHA256(s).toString(enc.Hex);
}

/**
 * @param difficulty: real number, range from 0 (easiest) to 1 (hardest)
 * @return hex string of 64 chars
 * the has of pow should be larger than or equal to the result hex
 * */
export function difficulty_to_hex(difficulty: number): string {
  let hex = (Math.pow(16, 64) * difficulty).toString(16);
  hex = hex.split('.')[0];
  if (hex === '1' + '0'.repeat(64)) {
    return 'f'.repeat(64);
  }
  if (hex.length > 64 || hex.startsWith('-')) {
    console.error('hex out of range:', {
      difficulty,
      hex,
      len: hex.length,
    });
    throw new Error('out of range');
  }
  if (hex.length !== 64) {
    hex = '0'.repeat(64 - hex.length) + hex;
  }
  return hex;
}

function is_hash_meet_difficulty(
  hash: string,
  difficulty_hex: string,
): boolean {
  if (difficulty_hex.length !== 64 || hash.length !== 64) {
    throw new Error('invalid hex length');
  }
  for (let i = 0; i < 64; i++) {
    const difficulty_char = difficulty_hex[i];
    const hash_char = hash[i];
    if (difficulty_char === hash_char) {
      continue;
    }
    return difficulty_char < hash_char;
  }
  return true;
}

const hex_to_decimal: { [hex: string]: number } = {};
const decimal_to_hex: { [decimal: number]: string } = {};
for (let i = 0; i < 10; i++) {
  hex_to_decimal[i] = i;
  decimal_to_hex[i] = i.toString();
}
for (let i = 0; i < 6; i++) {
  const h = String.fromCharCode(65 + 32 + i);
  const d = 10 + i;
  hex_to_decimal[h] = d;
  decimal_to_hex[d] = h;
}

export function ensure_hex_length(hex: string, length: number): string {
  if (hex.length < length) {
    hex = '0'.repeat(length - hex.length) + hex;
  }
  return hex;
}

export function hex_to_decimals(hex: string): number[] {
  const xs = new Array(hex.length);
  for (let i = 0; i < hex.length; i++) {
    xs[i] = hex_to_decimal[hex[i]];
  }
  return xs;
}

export function decimals_to_hex(decimals: number[]): string {
  // clean up decimal
  for (let i = 0; i < decimals.length; i++) {
    const x = decimals[i];
    const d = Math.floor(x);
    if (x !== d) {
      if (i + 1 < decimals.length) {
        decimals[i + 1] += (x * 16) % 16;
      }
      decimals[i] = d;
    }
  }
  // clean up overflow
  for (let i = decimals.length - 1; i >= 0; i--) {
    let x = decimals[i];
    if (x >= 16) {
      const new_x = x % 16;
      decimals[i - 1] += (x - new_x) / 16;
      x = new_x;
    }
    decimals[i] = x;
  }
  if (typeof decimals[-1] === 'number') {
    return 'f'.repeat(decimals.length);
  }
  let hex = '';
  for (let i = 0; i < decimals.length; i++) {
    hex += decimal_to_hex[decimals[i]];
  }
  return hex;
}

/**
 * @param hex string of 64 chars
 * @param amount to be added, must be positive
 * @return hex string of 64 chars
 *
 * if overflow, will be rounded as 'f' x 64
 * */
export function hex_add(hex: string, amount: number): string {
  const decimals = hex_to_decimals(hex);
  for (let factor = 1; factor <= decimals.length; factor++) {
    decimals[decimals.length - factor] += amount % 16;
    amount = amount >> 4;
  }
  return decimals_to_hex(decimals);
}

/**
 * @param hex string of 64 chars
 * @param times factor to be multiplied, must be positive
 * @return hex string of 64 chars
 *
 * if overflow, will be rounded as 'f' x 64
 * */
export function hex_multiply(hex: string, times: number): string {
  const decimals = hex_to_decimals(hex);
  // do multiply
  for (let i = 0; i < decimals.length; i++) {
    decimals[i] *= times;
  }
  return decimals_to_hex(decimals);
}

/**
 * @param args.message: the message to be used to do pow
 * @param args.difficulty: real number, range from 0 (easiest) to 1 (hardest)
 * @return {pow} hex string of 64 chars
 * @return {nonce} the nonce used in the pow
 * */
export function gen_pow(args: {
  message: any;
  difficulty_hex: string;
  max_duration: number;
}):
  | {
      success: true;
      nonce: number;
      elapsed: number;
    }
  | {
      success: false;
      reason: 'timeout';
    } {
  const { message, difficulty_hex, max_duration } = args;
  if (difficulty_hex === 'f'.repeat(difficulty_hex.length)) {
    return { success: false, reason: 'timeout' };
  }
  let nonce = 0;
  const start = Date.now();
  for (;;) {
    const elapsed = Date.now() - start;
    if (elapsed > max_duration) {
      return { success: false, reason: 'timeout' };
    }
    const hash = hash_with_nonce({ message, nonce });
    if (is_hash_meet_difficulty(hash, difficulty_hex)) {
      return { success: true, nonce, elapsed };
    }
    nonce++;
  }
}

export function verify_pow(args: {
  nonce: number;
  difficultyHex: string;
  message: any;
}): boolean {
  const hash = hash_with_nonce({
    message: args.message,
    nonce: args.nonce,
  });
  const difficultyHex = args.difficultyHex;
  return is_hash_meet_difficulty(hash, difficultyHex);
}
