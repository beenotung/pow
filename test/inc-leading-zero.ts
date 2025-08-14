import { hash_string } from '../src'

async function main() {
  for (let i = 0; i <= 64; i++) {
    let pattern = '0'.repeat(i)
    let total_time_used = 0
    let iter = 0
    let start = performance.now()
    for (;;) {
      iter++
      let message = `${iter}:hello`
      let start = performance.now()
      let hash = await hash_string(message)
      let end = performance.now()
      let time_used = (end - start) / 1000
      total_time_used += time_used
      let hps = iter / total_time_used
      process.stderr.write(
        `\r` +
          [
            `i: ${i}`,
            `iter: ${iter.toLocaleString()}`,
            `time used: ${total_time_used.toFixed(2)}s`,
            `hps: ${hps.toFixed(2)}`,
          ].join(' | ') +
          ' | ',
      )
      if (hash.startsWith(pattern)) {
        break
      }
    }
    let end = performance.now()
    let time_used = (end - start) / 1000
    process.stderr.write(`time used: ${time_used.toFixed(2)}s \n`)
  }
}
main().catch(e => console.error(e))
