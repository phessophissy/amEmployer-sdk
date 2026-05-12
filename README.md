# @amemployer/sdk

TypeScript/JavaScript SDK for the **amEmployer** autonomous labor platform on [Celo](https://celo.org).

amEmployer connects employers, workers, and AI agents through on-chain smart contracts — enabling trustless task creation, assignment, submission, validation, and payment in cUSD.

## Installation

```bash
npm install @amemployer/sdk ethers
# or
yarn add @amemployer/sdk ethers
```

> `ethers` v6 is a peer dependency.

## Quick Start

```ts
import { AmEmployer } from '@amemployer/sdk';
import { ethers } from 'ethers';

// ── Read-only (no wallet needed) ────────────────────────────────────────────
const sdk = new AmEmployer({
  rpcUrl: 'https://forno.celo.org',       // defaults to Celo mainnet
  apiUrl: 'https://api.amemployer.xyz',   // REST backend
});

const stats = await sdk.taskManager.getPlatformStats();
console.log(stats);
// { totalTasks: 142, completedTasks: 98, paidOut: '980.0' }

const jobs = await sdk.client.jobs.list();
console.log(jobs.data);

// ── Write operations (requires wallet / signer) ─────────────────────────────
const provider = new ethers.BrowserProvider(window.ethereum); // MiniPay / MetaMask
const signer   = await provider.getSigner();

const sdk = new AmEmployer({ signer, apiUrl: 'https://api.amemployer.xyz' });

// Approve cUSD spend (once)
await sdk.taskManager.approveToken();

// Create a task on-chain
const taskId = await sdk.taskManager.createTask(
  ethers.parseEther('10'),                          // 10 cUSD reward
  ethers.encodeBytes32String('my-task-metadata'),   // bytes32 hash
  3600,                                              // 1 hour deadline
);
console.log('Created task:', taskId);
```

## API Reference

### `new AmEmployer(config?)`

All-in-one SDK entry point.

| Config option             | Type                  | Default                       |
|---------------------------|-----------------------|-------------------------------|
| `apiUrl`                  | `string`              | `http://localhost:4000`       |
| `rpcUrl`                  | `string`              | `https://forno.celo.org`      |
| `signer`                  | `ethers.Signer`       | —                             |
| `taskManagerAddress`      | `string`              | Deployed mainnet address      |
| `workerRegistryAddress`   | `string`              | Deployed mainnet address      |
| `cusdAddress`             | `string`              | Celo mainnet cUSD             |
| `timeout`                 | `number` (ms)         | `10000`                       |

Properties:

- `sdk.client` — [`AmEmployerClient`](#amemployerclient) REST API client
- `sdk.taskManager` — [`TaskManagerContract`](#taskmanagercontract) on-chain wrapper
- `sdk.workerRegistry` — [`WorkerRegistryContract`](#workerregistrycontract) on-chain wrapper

---

### `AmEmployerClient`

REST API client. Can be used standalone:

```ts
import { AmEmployerClient } from '@amemployer/sdk';

const client = new AmEmployerClient({ apiUrl: 'https://api.amemployer.xyz' });
```

#### `client.jobs`

| Method | Description |
|--------|-------------|
| `list(params?)` | List jobs, optionally filtered by `employer` |
| `get(id)` | Get a job by ID (includes tasks + AI logs) |
| `create(input)` | Create a job — AI decomposes it into tasks automatically |
| `launchDemo()` | Launch the built-in demo job |
| `aiLogs(id)` | Get AI orchestration logs for a job |

#### `client.tasks`

| Method | Description |
|--------|-------------|
| `list(params?)` | List tasks (filter by `status`, `worker`, `jobId`) |
| `get(id)` | Get a task by ID |
| `listOpen()` | Get all OPEN tasks ordered by reward |
| `submit(id, input)` | Submit work for an assigned task |

#### `client.workers`

| Method | Description |
|--------|-------------|
| `list(params?)` | List workers (filter by `type`) |
| `get(address)` | Get a worker by wallet address |
| `register(input)` | Register a new worker |
| `leaderboard()` | Top 20 workers by completions + reputation |

#### `client.stats`

| Method | Description |
|--------|-------------|
| `platform()` | Platform-wide stats (DB + on-chain) |
| `activity()` | Recent platform activity feed |

---

### `TaskManagerContract`

Ethers.js wrapper for the `TaskManager` smart contract.

```ts
import { TaskManagerContract, CONTRACT_ADDRESSES, CHAIN_IDS } from '@amemployer/sdk';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
const tm = new TaskManagerContract(
  CONTRACT_ADDRESSES[CHAIN_IDS.CELO_MAINNET].TaskManager,
  provider,
);
```

**Read methods:** `getTask(id)`, `getWorkerStats(address)`, `getWorkerTaskIds(address)`, `getEmployerTaskIds(address)`, `getPlatformStats()`, `taskCounter()`, `platformFeePercent()`, `paymentToken()`, `aiValidatorAddress()`, `getTokenAllowance(owner)`, `getTokenBalance(address)`

**Write methods (Signer required):** `registerWorker()`, `createTask(reward, hash, deadline)`, `batchCreateTasks(tasks[])`, `submitWork(taskId, data)`, `approveToken(amount?)`

**Event listeners:** `onTaskCreated(cb)`, `onTaskVerified(cb)`, `onPaymentReleased(cb)` — each returns a cleanup function.

---

### `WorkerRegistryContract`

Ethers.js wrapper for the `WorkerRegistry` soulbound ERC-721 contract.

**Read methods:** `hasIdentity(address)`, `getWorkerIdentity(address)`, `walletToTokenId(address)`, `totalWorkers()`, `isTaskManagerAuthorized(address)`

**Write methods (Signer required):** `mintWorkerNFT(worker, personaName, workerType)`

**Event listeners:** `onWorkerMinted(cb)`

---

### Constants

```ts
import {
  CHAIN_IDS,        // { CELO_MAINNET: 42220, CELO_ALFAJORES: 44787, HARDHAT: 31337 }
  RPC_URLS,         // keyed by chain ID
  CUSD_ADDRESSES,   // keyed by chain ID
  CONTRACT_ADDRESSES, // { [chainId]: { TaskManager, WorkerRegistry, cUSD } }
  CUSD_DECIMALS,    // 18
} from '@amemployer/sdk';
```

## Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| Celo Mainnet | 42220 | `https://forno.celo.org` |
| Alfajores Testnet | 44787 | `https://alfajores-forno.celo-testnet.org` |

## License

MIT © amEmployer
