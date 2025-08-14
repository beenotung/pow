import { hash_string } from '../src/hash'

async function main() {
  // hps: ~40000
  // 4 zeros -> ~1s
  // 5 zeros -> ~24s
  let pattern = '0'.repeat(4)

  let i = 0
  let all_time_used = 0
  for (;;) {
    let iter = 0
    let time_used = 0
    for (;;) {
      iter++
      let message = `${iter}:hello`
      let start = performance.now()
      let hash = await hash_string(message)
      let end = performance.now()
      time_used += (end - start) / 1000
      if (hash.startsWith(pattern)) {
        break
      }
    }
    i++
    all_time_used += time_used
    process.stderr.write(
      `\r` +
        [
          `i: ${i.toLocaleString()}`,
          `iter: ${iter.toLocaleString()}`,
          `time used: ${time_used.toFixed(2)}s`,
          `hps: ${(iter / time_used).toFixed(2)}`,
          `average time: ${(all_time_used / i).toFixed(2)}s`,
        ].join(' | ') +
        '\n',
    )
  }
}
main().catch(e => console.error(e))
