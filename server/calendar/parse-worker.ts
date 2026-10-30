import { parentPort, workerData } from 'node:worker_threads';
import { parseIcs, type ParseOptions } from './parse.ts';
try {
  const { text, options } = workerData as { text: string; options: ParseOptions };
  const result = parseIcs(text, options);
  if (Buffer.byteLength(JSON.stringify(result)) > 2 * 1024 * 1024) throw new Error('result_too_large');
  parentPort?.postMessage({ ok: true, result });
} catch {
  parentPort?.postMessage({ ok: false });
}
