import { difficulty_to_hex, gen_pow } from '../src'

async function main() {
  let max_duration = 6 * 1000
  /**
   * this is the difficulty for node.js server
   * for desktop, hps is halved
   * for mobile, hps is further halved
   * */
  let difficulty = 0.999996
  let step = 0.0000001
  for (;;) {
    let message = `${performance.now()}:demo@example.net`
    let difficulty_hex = difficulty_to_hex(difficulty)
    let result = await gen_pow({
      message,
      difficulty_hex,
      max_duration,
    })
    console.log({
      message,
      difficulty,
      difficulty_hex,
      ...result,
      hps: (result.nonce / result.elapsed) * 1000,
    })
    if (result.success) {
      difficulty += step
      if (difficulty > 1) difficulty = 1
    } else {
      difficulty -= step
      if (difficulty < 0) difficulty = 0.001
    }
  }
}
main().catch(e => console.error(e))
