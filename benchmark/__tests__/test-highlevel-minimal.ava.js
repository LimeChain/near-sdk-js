import { Worker } from "near-workspaces";
import test from "ava";
import { generateMinimalGasObject, logTestResults } from "./util.js";
import { addTestResults } from "./results-store.js";

test.before(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Prepare sandbox for tests, create accounts, deploy contracts, etx.
  const root = worker.rootAccount;

  // Deploy the test contract.
  const highlevelContract = await root.devDeploy(
    "build/highlevel-minimal.wasm"
  );
  const highlevelContractRs = await root.devDeploy(
    "res/highlevel_minimal.wasm"
  );

  // Test users
  const ali = await root.createSubAccount("ali");
  const bob = await root.createSubAccount("bob");
  const carl = await root.createSubAccount("carl");

  // Save state for test runs
  t.context.worker = worker;
  t.context.accounts = {
    root,
    highlevelContract,
    highlevelContractRs,
    ali,
    bob,
    carl,
  };
});

test("JS highlevel minimal contract", async (t) => {
  const { bob, highlevelContract } = t.context.accounts;
  let r = await bob.callRaw(highlevelContract, "empty", "");

  t.is(r.result.status.SuccessValue, "");
  logTestResults(r);

  const gasObject = generateMinimalGasObject(r);

  addTestResults("JS_highlevel_minimal_contract", gasObject);
});

test("RS highlevel minimal contract", async (t) => {
  const { bob, highlevelContractRs } = t.context.accounts;
  let r = await bob.callRaw(highlevelContractRs, "empty", "");

  t.is(r.result.status.SuccessValue, "");
  logTestResults(r);

  const gasObject = generateMinimalGasObject(r);

  addTestResults("RS_highlevel_minimal_contract", gasObject);
});
