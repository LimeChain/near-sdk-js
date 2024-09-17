import { Worker } from "near-workspaces";
import test from "ava";
import { generateGasObject, logTestResults } from "./util.js";
import { addTestResults } from "./results-store.js";

test.before(async (t) => {
  // Init the worker and start a Sandbox server
  const worker = await Worker.init();

  // Prepare sandbox for tests, create accounts, deploy contracts, etc.
  const root = worker.rootAccount;

  // Deploy the test contract.
  const expensiveContract = await root.devDeploy("build/expensive-calc.wasm");
  const expensiveContractRs = await root.devDeploy("res/expensive_calc.wasm");

  // Test users
  const ali = await root.createSubAccount("ali");
  const bob = await root.createSubAccount("bob");
  const carl = await root.createSubAccount("carl");

  // Save state for test runs
  t.context.worker = worker;
  t.context.accounts = {
    root,
    expensiveContract,
    expensiveContractRs,
    ali,
    bob,
    carl,
  };
});

test("JS expensive contract, iterate 100 times", async (t) => {
  const { bob, expensiveContract } = t.context.accounts;
  let r = await bob.callRaw(expensiveContract, "expensive", { n: 100 });

  t.is(r.result.status.SuccessValue, "LTUw");

  logTestResults(r);

  const gasObject = generateGasObject(r, true);

  addTestResults("JS_expensive_contract_100_times", gasObject);
});

test("RS expensive contract. iterate 100 times", async (t) => {
  const { bob, expensiveContractRs } = t.context.accounts;
  let r = await bob.callRaw(expensiveContractRs, "expensive", { n: 100 });

  t.is(r.result.status.SuccessValue, "LTUw");

  logTestResults(r);

  const gasObject = generateGasObject(r, true);

  addTestResults("RS_expensive_contract_100_times", gasObject);
});

test("JS expensive contract, iterate 10000 times", async (t) => {
  const { bob, expensiveContract } = t.context.accounts;
  let r = await bob.callRaw(
    expensiveContract,
    "expensive",
    { n: 10000 },
    { gas: BigInt(300 * 10 ** 12) }
  );

  t.is(r.result.status.SuccessValue, "LTUwMDA=");

  logTestResults(r);

  const gasObject = generateGasObject(r, true);

  addTestResults("JS_expensive_contract_10000_times", gasObject);
});

test("RS expensive contract. iterate 10000 times", async (t) => {
  const { bob, expensiveContractRs } = t.context.accounts;
  let r = await bob.callRaw(expensiveContractRs, "expensive", { n: 10000 });

  t.is(r.result.status.SuccessValue, "LTUwMDA=");

  logTestResults(r);

  const gasObject = generateGasObject(r, true);

  addTestResults("RS_expensive_contract_10000_times", gasObject);
});

test("JS expensive contract, iterate 20000 times", async (t) => {
  const { bob, expensiveContract } = t.context.accounts;
  let r = await bob.callRaw(
    expensiveContract,
    "expensive",
    { n: 20000 },
    { gas: BigInt(300 * 10 ** 12) }
  );

  t.is(r.result.status.SuccessValue, "LTEwMDAw");

  logTestResults(r);

  const gasObject = generateGasObject(r, true);

  addTestResults("JS_expensive_contract_20000_times", gasObject);
});

test("RS expensive contract. iterate 20000 times", async (t) => {
  const { bob, expensiveContractRs } = t.context.accounts;
  let r = await bob.callRaw(expensiveContractRs, "expensive", { n: 20000 });

  t.is(r.result.status.SuccessValue, "LTEwMDAw");

  logTestResults(r);

  const gasObject = generateGasObject(r, true);

  addTestResults("RS_expensive_contract_20000_times", gasObject);
});
