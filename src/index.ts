// ─── Core exports ─────────────────────────────────────────────────────────────
export { AmEmployerClient, AmEmployerApiError } from './client/AmEmployerClient';
export { TaskManagerContract } from './contracts/TaskManagerContract';
export { WorkerRegistryContract } from './contracts/WorkerRegistryContract';

// ─── ABIs ─────────────────────────────────────────────────────────────────────
export { TASK_MANAGER_ABI } from './abis/TaskManager';
export { WORKER_REGISTRY_ABI } from './abis/WorkerRegistry';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
  AmEmployerConfig,
  Job,
  Task,
  Worker,
  Payment,
  PlatformStats,
  OnchainTask,
  OnchainWorkerProfile,
  OnchainWorkerIdentity,
  TaskStatus,
  JobStatus,
  WorkerType,
  PaymentStatus,
  WorkerTypeOnChainValue,
  ListResponse,
  SingleResponse,
  CreateJobInput,
  RegisterWorkerInput,
  SubmitTaskInput,
  StartSimulationInput,
  JobListParams,
  TaskListParams,
  WorkerListParams,
} from './types';
export { WorkerTypeOnChain } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────
export {
  CHAIN_IDS,
  RPC_URLS,
  EXPLORER_URLS,
  CUSD_ADDRESSES,
  CONTRACT_ADDRESSES,
  CUSD_DECIMALS,
  DEFAULT_PLATFORM_FEE_PERCENT,
  VALIDATION_PASS_SCORE,
  DEFAULT_API_URL,
  DEFAULT_RPC_URL,
  DEFAULT_TIMEOUT_MS,
} from './constants';

// ─── AmEmployer — all-in-one convenience class ────────────────────────────────

import { ethers } from 'ethers';
import { AmEmployerClient } from './client/AmEmployerClient';
import { TaskManagerContract } from './contracts/TaskManagerContract';
import { WorkerRegistryContract } from './contracts/WorkerRegistryContract';
import {
  CONTRACT_ADDRESSES,
  CHAIN_IDS,
  RPC_URLS,
  DEFAULT_API_URL,
} from './constants';
import type { AmEmployerConfig } from './types';

/**
 * All-in-one SDK entry point.
 *
 * Provides access to:
 * - `client`  — REST API client
 * - `taskManager` — on-chain TaskManager contract wrapper
 * - `workerRegistry` — on-chain WorkerRegistry contract wrapper
 *
 * @example
 * ```ts
 * import { AmEmployer } from '@amemployer/sdk';
 * import { ethers } from 'ethers';
 *
 * // Read-only (no signer)
 * const sdk = new AmEmployer({ rpcUrl: 'https://forno.celo.org' });
 * const stats = await sdk.taskManager.getPlatformStats();
 * const jobs  = await sdk.client.jobs.list();
 *
 * // Write operations (with signer)
 * const provider = new ethers.BrowserProvider(window.ethereum);
 * const signer   = await provider.getSigner();
 * const sdk = new AmEmployer({ signer });
 * await sdk.taskManager.approveToken();
 * const taskId = await sdk.taskManager.createTask(
 *   ethers.parseEther('10'),
 *   ethers.encodeBytes32String('my-task-hash'),
 *   3600,
 * );
 * ```
 */
export class AmEmployer {
  readonly client: AmEmployerClient;
  readonly taskManager: TaskManagerContract;
  readonly workerRegistry: WorkerRegistryContract;

  constructor(config: AmEmployerConfig = {}) {
    const chainId = config.chainId ?? CHAIN_IDS.CELO_MAINNET;
    const defaults = CONTRACT_ADDRESSES[chainId];

    if (!defaults) {
      throw new Error(`Unsupported amEmployer chain ID: ${chainId}`);
    }

    // REST client
    this.client = new AmEmployerClient({
      apiUrl: config.apiUrl ?? DEFAULT_API_URL,
      timeout: config.timeout,
    });

    // Resolve provider / signer
    const providerOrSigner: ethers.Provider | ethers.Signer = config.signer
      ? config.signer
      : new ethers.JsonRpcProvider(config.rpcUrl ?? RPC_URLS[chainId]);

    // Resolve contract addresses for the selected network.
    const tmAddress = config.taskManagerAddress ?? defaults.TaskManager;
    const wrAddress = config.workerRegistryAddress ?? defaults.WorkerRegistry;

    this.taskManager = new TaskManagerContract(tmAddress, providerOrSigner);
    this.workerRegistry = new WorkerRegistryContract(wrAddress, providerOrSigner);
  }
}
