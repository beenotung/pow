import {
  decimals_to_hex,
  gen_pow,
  hex_multiply,
  hex_to_decimals,
  verify_pow,
} from '../src/pow';
import { format_time_duration } from '@beenotung/tslib/format';
import { SECOND } from '@beenotung/tslib/time';
import { inspect } from 'util';

let log = console.log.bind(console);
console.log = function(...args: any[]) {
  log(...args);
  if (typeof window !== 'undefined') {
    let p = document.createElement('p');
    p.innerText = args
      .map(arg => (typeof arg === 'string' ? arg : inspect(arg)))
      .join(' ');
    document.body.prepend(p);
  }
};

/**
 * this is the difficulty for node.js server
 * for desktop, hps is halved
 * for mobile, hps is further halved
 * */
let difficulty_hex =
  'ffffe47fc9b3f066140a24334f1481c87d74a35d1c907439a7daceafc9666675';
if (typeof window !== 'undefined') {
  difficulty_hex =
    'fffee47fc9b3f066140a24334f1481c87d74a35d1c907439a7daceafc9666675';
}
let target_duration = 5 * SECOND;

function difficulty_needed(args: {
  certainty: number;
  hps: number;
  duration: number;
}): {
  difficulty: number;
} {
  let { hps, certainty, duration } = args;
  let difficulty: number =
    1 - Math.exp(Math.log(1 - certainty) / ((hps * duration) / SECOND));
  return { difficulty };
}

let records: Array<[number, string]> = [];
let max_record = 12;

function average_difficulty(record: [number, string]) {
  records.push(record);
  if (records.length > max_record - 1) {
    records = records
      .sort(
        ([a], [b]) =>
          Math.abs(a - target_duration) - Math.abs(b - target_duration),
      )
      .slice(0, max_record - 1);
  }
  let decimals = new Array(64).fill(0);
  let acc_elapsed = 0;
  for (let [elapsed, hash] of records) {
    acc_elapsed += elapsed;
    let xs = hex_to_decimals(hash);
    for (let i = 0; i < 64; i++) {
      decimals[i] += xs[i];
    }
  }
  for (let i = 0; i < 64; i++) {
    decimals[i] /= records.length;
  }
  let average_elapsed = acc_elapsed / records.length;
  let average_difficulty_hex = decimals_to_hex(decimals);
  return {
    average_elapsed,
    average_difficulty_hex,
  };
}

let acc_elapsed = 0;

function update_acc_elapsed(elapsed: number, alpha = 0.5) {
  if (acc_elapsed === 0) {
    acc_elapsed = elapsed;
  } else {
    acc_elapsed = acc_elapsed * alpha + elapsed * (1 - alpha);
  }
}

let step = 0.000001;

function loop() {
  let message = new Date().toString();
  console.log('target:', difficulty_hex);
  setTimeout(() => {
    let res = gen_pow({
      message,
      difficulty_hex,
      max_duration: target_duration * 2,
    });
    if (!res.success) {
      update_acc_elapsed(target_duration * 2, 0.1);
      let acc_elapsed_rate = acc_elapsed / target_duration;
      console.log('timeout', 'acc_elapsed_rate:', acc_elapsed_rate);
      difficulty_hex = hex_multiply(difficulty_hex, 1 - step);
      step *= 0.99;
    } else {
      let { nonce, elapsed } = res;
      if (!verify_pow({ nonce, difficultyHex: difficulty_hex, message })) {
        throw new Error('invalid pow');
      }
      update_acc_elapsed(elapsed);
      let acc_elapsed_rate = acc_elapsed / target_duration;
      let hps = (nonce + 1) / (elapsed / SECOND + 1);
      console.log(
        'elapsed:',
        elapsed < 1000 ? elapsed + 'ms' : format_time_duration(elapsed),
        'nonce:',
        nonce,
        'hps:',
        hps,
        'acc_elapsed_rate:',
        acc_elapsed_rate,
      );
      if (Math.abs(elapsed - target_duration) < target_duration) {
        let { average_difficulty_hex, average_elapsed } = average_difficulty([
          elapsed,
          difficulty_hex,
        ]);
        if (typeof window === 'undefined') {
          console.log({
            records,
            average_elapsed,
            average_difficulty_hex,
          });
        } else {
          console.log({
            average_elapsed,
            average_difficulty_hex,
          });
        }
        difficulty_hex = average_difficulty_hex;
      } else if (elapsed === target_duration) {
        // right timing
      } else if (elapsed > target_duration) {
        // too slow
        difficulty_hex = hex_multiply(difficulty_hex, 1 - step);
      } else {
        // to fast
        if (nonce === 0) {
          difficulty_hex = hex_multiply(difficulty_hex, 1.1);
        } else {
          difficulty_hex = hex_multiply(difficulty_hex, 1 + step);
        }
      }
    }
    setTimeout(loop);
  });
}

loop();
