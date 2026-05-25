// ─── Enums ────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'PAID';

export type JobStatus =
  | 'PENDING'
  | 'DECOMPOSING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED';

export type WorkerType = 'HUMAN' | 'SCRIPTED' | 'AI_AGENT';

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

/** On-chain worker type enum index (matches Solidity enum order) */
export const WorkerTypeOnChain = {
  HUMAN: 0,
  SCRIPTED: 1,
  AI_AGENT: 2,
} as const;
export type WorkerTypeOnChainValue = (typeof WorkerTypeOnChain)[keyof typeof WorkerTypeOnChain];

// ─── REST API Response Shapes ─────────────────────────────────────────────────

export interface Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  employerAddress: string;
  totalBudget: string;
  taskCount: number;
  completedCount: number;
  failedCount: number;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  jobId: string;
  onchainTaskId?: number;
  title: string;
  description: string;
  reward: string;
  status: TaskStatus;
  assignedWorker?: string;
  deadline?: string;
  metadataHash?: string;
  submission?: string;
  validationScore?: number;
  validationNotes?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
  job?: Job;
}

export interface Worker {
  id: string;
  walletAddress: string;
  reputation: number;
  completedTasks: number;
  failedTasks: number;
  totalEarnings: string;
  isActive: boolean;
  workerType: WorkerType;
  personaName?: string;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  taskId: string;
  workerId: string;
  amount: string;
  txHash?: string;
  status: PaymentStatus;
  createdAt: string;
  task?: Pick<Task, 'title'>;
  worker?: Pick<Worker, 'walletAddress' | 'personaName'>;
}

// ─── Platform Stats ────────────────────────────────────────────────────────────

export interface PlatformStats {
  jobs: { total: number; active: number };
  tasks: {
    total: number;
    open: number;
    assigned: number;
    submitted: number;
    verified: number;
    paid: number;
  };
  workers: { total: number; active: number };
  payments: { total: string };
  onchain: { totalTasks: number; completedTasks: number; paidOut: string };
}

// ─── On-chain Structs ─────────────────────────────────────────────────────────

export interface OnchainTask {
  id: bigint;
  employer: string;
  reward: bigint;
  status: number;
  assignedWorker: string;
  deadline: bigint;
  metadataHash: string;
  submissionData: string;
  createdAt: bigint;
  completedAt: bigint;
}

export interface OnchainWorkerProfile {
  wallet: string;
  reputation: bigint;
  completedTasks: bigint;
  failedTasks: bigint;
  earnings: bigint;
  isRegistered: boolean;
  registeredAt: bigint;
}

export interface OnchainWorkerIdentity {
  tokenId: bigint;
  wallet: string;
  personaName: string;
  workerType: number;
  level: bigint;
  mintedAt: bigint;
  active: boolean;
}

// ─── SDK Config ───────────────────────────────────────────────────────────────

export interface AmEmployerConfig {
  /** REST API base URL. Defaults to http://localhost:4000 */
  apiUrl?: string;
  /** Supported Celo chain ID used to resolve default RPC and contract addresses */
  chainId?: 42220 | 44787;
  /** Ethers.js provider or RPC URL for on-chain reads */
  rpcUrl?: string;
  /** Ethers.js signer for write operations */
  signer?: import('ethers').Signer;
  /** TaskManager contract address (overrides default for network) */
  taskManagerAddress?: string;
  /** WorkerRegistry contract address (overrides default for network) */
  workerRegistryAddress?: string;
  /** cUSD token address (overrides default for network) */
  cusdAddress?: string;
  /** Timeout for REST API requests in ms. Default: 10000 */
  timeout?: number;
}

// ─── API List Responses ───────────────────────────────────────────────────────

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface CreateJobInput {
  title: string;
  description: string;
  totalBudget: number;
  employerAddress: string;
}

export interface RegisterWorkerInput {
  walletAddress: string;
  workerType?: WorkerType;
  personaName?: string;
}

export interface SubmitTaskInput {
  submission: string;
  workerAddress: string;
}

export interface StartSimulationInput {
  walletCount: number;
  name: string;
}

// ─── Query Parameter Types ──────────────────────────────────────────────────

export interface JobListParams {
  employer?: string;
}

export interface TaskListParams {
  status?: TaskStatus;
  worker?: string;
  jobId?: string;
  limit?: number;
  offset?: number;
}

export interface WorkerListParams {
  type?: WorkerType;
  limit?: number;
  offset?: number;
}
