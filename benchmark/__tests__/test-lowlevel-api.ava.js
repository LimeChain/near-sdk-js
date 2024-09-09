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
  const lowlevelContract = await root.devDeploy("build/lowlevel-api.wasm");
  const lowlevelContractRs = await root.devDeploy("res/lowlevel_api.wasm");

  // Test users
  const ali = await root.createSubAccount("ali");
  const bob = await root.createSubAccount("bob");
  const carl = await root.createSubAccount("carl");

  // Save state for test runs
  t.context.worker = worker;
  t.context.accounts = {
    root,
    lowlevelContract,
    lowlevelContractRs,
    ali,
    bob,
    carl,
  };
});

test("JS lowlevel API contract", async (t) => {
  const { bob, lowlevelContract } = t.context.accounts;
  let r = await bob.callRaw(lowlevelContract, "lowlevel_storage_write", "");

  t.is(r.result.status.SuccessValue, "");
  logTestResults(r);

  const gasObject = generateMinimalGasObject(r);

  addTestResults("JS_lowlevel_API_contract", gasObject);
});

test("RS lowlevel API contract", async (t) => {
  const { bob, lowlevelContractRs } = t.context.accounts;
  let r = await bob.callRaw(lowlevelContractRs, "lowlevel_storage_write", "");

  t.is(r.result.status.SuccessValue, "");
  logTestResults(r);

  const gasObject = generateMinimalGasObject(r);

  addTestResults("RS_lowlevel_API_contract", gasObject);
});

test("JS lowlevel API contract, call many", async (t) => {
  const { bob, lowlevelContract } = t.context.accounts;
  let r = await bob.callRaw(
    lowlevelContract,
    "lowlevel_storage_write_many",
    ""
  );

  t.is(r.result.status.SuccessValue, "");
  logTestResults(r);
});
