import type { DatabaseHandle } from './types';

// Single transaction authority: every write transaction is chained onto the
// previous one, so nothing can start a `BEGIN` while another transaction is
// open (web sql.js throws on nested transactions).
let chain: Promise<unknown> = Promise.resolve();

export async function runExclusive<T>(
  handle: DatabaseHandle,
  task: (handle: DatabaseHandle) => Promise<T>
): Promise<T> {
  let result!: T;
  const run = chain.then(async () => {
    await handle.withTransactionAsync(async () => {
      result = await task(handle);
    });
  });
  chain = run.then(
    () => undefined,
    () => undefined
  );
  await run;
  return result;
}
