import {
  AmEmployer,
  AmEmployerClient,
  TaskManagerContract,
  WorkerRegistryContract,
  CHAIN_IDS,
  CONTRACT_ADDRESSES,
  CUSD_ADDRESSES,
  CUSD_DECIMALS,
} from "@phessophissy/amemployer-sdk";

console.log("amEmployer SDK Growth Bot running...");

// ── Constants smoke check ──────────────────────────────────────────────────
if (CHAIN_IDS.CELO_MAINNET !== 42220) {
  console.error("Smoke check failed: CHAIN_IDS.CELO_MAINNET is incorrect.");
  process.exit(1);
}
console.log("✓ CHAIN_IDS.CELO_MAINNET:", CHAIN_IDS.CELO_MAINNET);

if (CUSD_DECIMALS !== 18) {
  console.error("Smoke check failed: CUSD_DECIMALS is incorrect.");
  process.exit(1);
}
console.log("✓ CUSD_DECIMALS:", CUSD_DECIMALS);

if (!CONTRACT_ADDRESSES[42220]?.TaskManager) {
  console.error("Smoke check failed: CONTRACT_ADDRESSES missing TaskManager.");
  process.exit(1);
}
console.log("✓ TaskManager address:", CONTRACT_ADDRESSES[42220].TaskManager);

if (!CUSD_ADDRESSES[42220]) {
  console.error("Smoke check failed: CUSD_ADDRESSES missing mainnet entry.");
  process.exit(1);
}
console.log("✓ cUSD address:", CUSD_ADDRESSES[42220]);

// ── Client smoke check ────────────────────────────────────────────────────
if (typeof AmEmployerClient !== "function") {
  console.error("Smoke check failed: AmEmployerClient is not a constructor.");
  process.exit(1);
}
const client = new AmEmployerClient({ apiUrl: "http://localhost:4000" });
if (typeof client.jobs?.list !== "function") {
  console.error("Smoke check failed: client.jobs.list is not a function.");
  process.exit(1);
}
console.log("✓ AmEmployerClient instantiated successfully.");

// ── AmEmployer (all-in-one) smoke check ───────────────────────────────────
if (typeof AmEmployer !== "function") {
  console.error("Smoke check failed: AmEmployer is not a constructor.");
  process.exit(1);
}
const sdk = new AmEmployer({ rpcUrl: "https://forno.celo.org" });
if (!sdk.client || !sdk.taskManager || !sdk.workerRegistry) {
  console.error("Smoke check failed: AmEmployer missing sub-clients.");
  process.exit(1);
}
console.log("✓ AmEmployer instantiated successfully.");
console.log("✓ taskManager address:", sdk.taskManager.address);
console.log("✓ workerRegistry address:", sdk.workerRegistry.address);

// ── Contract class smoke check ────────────────────────────────────────────
if (typeof TaskManagerContract !== "function") {
  console.error("Smoke check failed: TaskManagerContract is not a constructor.");
  process.exit(1);
}
if (typeof WorkerRegistryContract !== "function") {
  console.error("Smoke check failed: WorkerRegistryContract is not a constructor.");
  process.exit(1);
}
console.log("✓ TaskManagerContract available.");
console.log("✓ WorkerRegistryContract available.");

console.log("\n✅ All smoke checks passed for @phessophissy/amemployer-sdk.");
