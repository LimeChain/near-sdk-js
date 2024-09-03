import { Worker } from "near-workspaces";
import test from "ava";

test.before(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init({ rpcAddr: "http://127.0.0.1:3001" });

  // Prepare sandbox for tests, create accounts, deploy contracts, etx.
  const root = worker.rootAccount;

  // Deploy the test contract.
  const testContract = await root.devDeploy("build/log_panic_api.wasm");

  // Test users
  const ali = await root.createSubAccount("ali");

  // Save state for test runs
  t.context.worker = worker;
  t.context.accounts = { root, testContract, ali };
});

test.after.always(async (t) => {
  await t.context.worker.tearDown().catch((error) => {
    console.log("Failed to tear down the worker:", error);
  });
});

test("Log expected types work", async (t) => {
  const { ali, testContract } = t.context.accounts;

  let r = await ali.callRaw(testContract, "log_expected_input_tests", "");
  t.deepEqual(r.result.receipts_outcome[0].outcome.logs, [
    "abc",
    "水",
    "333",
    '{"0":0,"1":1,"2":255}',
    '{"0":230,"1":176,"2":180}',
    "水",
    "水",
  ]);
});

test("Log invalid utf-8 sequence panic", async (t) => {
  const { ali, testContract } = t.context.accounts;

  let r = await ali.callRaw(testContract, "log_invalid_utf8_sequence_test", "");
  // console.log(JSON.stringify(r, null, 2))
  t.deepEqual(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind
      .FunctionCallError.ExecutionError,
    "String encoding is bad UTF-8 sequence."
  );
});

test("Log invalid utf-16 sequence panic", async (t) => {
  const { ali, testContract } = t.context.accounts;

  let r = await ali.callRaw(
    testContract,
    "log_invalid_utf16_sequence_test",
    ""
  );
  t.deepEqual(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind
      .FunctionCallError.ExecutionError,
    "String encoding is bad UTF-16 sequence."
  );
});

test("panic tests", async (t) => {
  const { ali, testContract } = t.context.accounts;
  let r = await ali.callRaw(testContract, "panic_test", "");
  t.assert(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind.FunctionCallError.ExecutionError.match(
      /^Smart contract panicked:*/
    )
  );

  r = await ali.callRaw(testContract, "panic_ascii_test", "");
  t.assert(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind.FunctionCallError.ExecutionError.match(
      /^Smart contract panicked: abc*/
    )
  );

  r = await ali.callRaw(testContract, "panic_js_number", "");
  t.assert(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind.FunctionCallError.ExecutionError.match(
      /^Smart contract panicked: 356*/
    )
  );

  r = await ali.callRaw(testContract, "panic_js_undefined", "");
  t.assert(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind.FunctionCallError.ExecutionError.match(
      /^Smart contract panicked:*/
    )
  );

  r = await ali.callRaw(testContract, "panic_js_null", "");
  t.assert(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind.FunctionCallError.ExecutionError.match(
      /^Smart contract panicked: null*/
    )
  );

  r = await ali.callRaw(testContract, "panic_utf8_test", "");
  t.assert(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind.FunctionCallError.ExecutionError.match(
      /Smart contract panicked: 水*/
    )
  );

  r = await ali.callRaw(testContract, "panicUtf8_valid_utf8_sequence", "");
  t.deepEqual(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind
      .FunctionCallError.ExecutionError,
    "Smart contract panicked: 水"
  );

  r = await ali.callRaw(testContract, "panicUtf8_invalid_utf8_sequence", "");
  t.deepEqual(
    r.result.receipts_outcome[0].outcome.status.Failure.ActionError.kind
      .FunctionCallError.ExecutionError,
    "String encoding is bad UTF-8 sequence."
  );
});
