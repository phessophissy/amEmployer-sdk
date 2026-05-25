import * as ethers from 'ethers';
import { ethers as ethers$1 } from 'ethers';

type TaskStatus = 'OPEN' | 'ASSIGNED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'PAID';
type JobStatus = 'PENDING' | 'DECOMPOSING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
type WorkerType = 'HUMAN' | 'SCRIPTED' | 'AI_AGENT';
type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';
/** On-chain worker type enum index (matches Solidity enum order) */
declare const WorkerTypeOnChain: {
    readonly HUMAN: 0;
    readonly SCRIPTED: 1;
    readonly AI_AGENT: 2;
};
type WorkerTypeOnChainValue = (typeof WorkerTypeOnChain)[keyof typeof WorkerTypeOnChain];
interface Job {
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
interface Task {
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
interface Worker {
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
interface Payment {
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
interface PlatformStats {
    jobs: {
        total: number;
        active: number;
    };
    tasks: {
        total: number;
        open: number;
        assigned: number;
        submitted: number;
        verified: number;
        paid: number;
    };
    workers: {
        total: number;
        active: number;
    };
    payments: {
        total: string;
    };
    onchain: {
        totalTasks: number;
        completedTasks: number;
        paidOut: string;
    };
}
interface OnchainTask {
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
interface OnchainWorkerProfile {
    wallet: string;
    reputation: bigint;
    completedTasks: bigint;
    failedTasks: bigint;
    earnings: bigint;
    isRegistered: boolean;
    registeredAt: bigint;
}
interface OnchainWorkerIdentity {
    tokenId: bigint;
    wallet: string;
    personaName: string;
    workerType: number;
    level: bigint;
    mintedAt: bigint;
    active: boolean;
}
interface AmEmployerConfig {
    /** REST API base URL. Defaults to http://localhost:4000 */
    apiUrl?: string;
    /** Supported Celo chain ID used to resolve default RPC and contract addresses */
    chainId?: 42220 | 44787;
    /** Ethers.js provider or RPC URL for on-chain reads */
    rpcUrl?: string;
    /** Ethers.js signer for write operations */
    signer?: ethers.Signer;
    /** TaskManager contract address (overrides default for network) */
    taskManagerAddress?: string;
    /** WorkerRegistry contract address (overrides default for network) */
    workerRegistryAddress?: string;
    /** cUSD token address (overrides default for network) */
    cusdAddress?: string;
    /** Timeout for REST API requests in ms. Default: 10000 */
    timeout?: number;
}
interface ListResponse<T> {
    success: boolean;
    data: T[];
    total?: number;
}
interface SingleResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
interface CreateJobInput {
    title: string;
    description: string;
    totalBudget: number;
    employerAddress: string;
}
interface RegisterWorkerInput {
    walletAddress: string;
    workerType?: WorkerType;
    personaName?: string;
}
interface SubmitTaskInput {
    submission: string;
    workerAddress: string;
}
interface StartSimulationInput {
    walletCount: number;
    name: string;
}

declare class AmEmployerApiError extends Error {
    readonly status: number;
    readonly data?: unknown | undefined;
    constructor(status: number, message: string, data?: unknown | undefined);
}
/**
 * REST API client for the amEmployer backend.
 *
 * @example
 * ```ts
 * const client = new AmEmployerClient({ apiUrl: 'https://api.amemployer.xyz' });
 * const jobs = await client.jobs.list();
 * ```
 */
declare class AmEmployerClient {
    private readonly baseUrl;
    private readonly timeout;
    constructor(config?: {
        apiUrl?: string;
        timeout?: number;
    });
    private request;
    private get;
    private post;
    readonly jobs: {
        /**
         * List all jobs. Optionally filter by employer address.
         */
        list: (params?: {
            employer?: string;
        }) => Promise<ListResponse<Job>>;
        /**
         * Get a single job by its ID, including tasks and AI logs.
         */
        get: (id: string) => Promise<SingleResponse<Job>>;
        /**
         * Create a new job. The backend will decompose it into tasks via AI.
         */
        create: (input: CreateJobInput) => Promise<SingleResponse<Job>>;
        /**
         * Launch the built-in demo job (no body required).
         */
        launchDemo: () => Promise<SingleResponse<Job>>;
        /**
         * Retrieve AI orchestration logs for a job.
         */
        aiLogs: (id: string) => Promise<SingleResponse<unknown[]>>;
    };
    readonly tasks: {
        /**
         * List tasks with optional filters.
         */
        list: (params?: {
            status?: string;
            worker?: string;
            jobId?: string;
            limit?: number;
            offset?: number;
        }) => Promise<ListResponse<Task>>;
        /**
         * Get a single task by ID.
         */
        get: (id: string) => Promise<SingleResponse<Task>>;
        /**
         * Get all OPEN tasks, ordered by reward descending.
         */
        listOpen: () => Promise<ListResponse<Task>>;
        /**
         * Submit work for a task.
         */
        submit: (id: string, input: SubmitTaskInput) => Promise<SingleResponse<Task>>;
    };
    readonly workers: {
        /**
         * List workers, optionally filtered by type.
         */
        list: (params?: {
            type?: string;
            limit?: number;
            offset?: number;
        }) => Promise<ListResponse<Worker>>;
        /**
         * Get a worker by wallet address.
         */
        get: (address: string) => Promise<SingleResponse<Worker>>;
        /**
         * Register a new worker.
         */
        register: (input: RegisterWorkerInput) => Promise<SingleResponse<Worker>>;
        /**
         * Get the top 20 workers by completed tasks and reputation.
         */
        leaderboard: () => Promise<ListResponse<Worker>>;
    };
    readonly stats: {
        /**
         * Get platform-wide stats (DB + on-chain).
         */
        platform: () => Promise<SingleResponse<PlatformStats>>;
        /**
         * Get recent platform activity feed.
         */
        activity: () => Promise<SingleResponse<unknown[]>>;
    };
    readonly simulation: {
        /**
         * List all simulations.
         */
        list: () => Promise<ListResponse<unknown>>;
        /**
         * Get a simulation by ID.
         */
        get: (id: string) => Promise<SingleResponse<unknown>>;
        /**
         * Start a new simulation with N virtual workers.
         */
        start: (input: StartSimulationInput) => Promise<SingleResponse<unknown>>;
        /**
         * Get Bull queue statistics.
         */
        queueStats: () => Promise<SingleResponse<unknown>>;
    };
}

/**
 * Typed wrapper around the TaskManager smart contract.
 * Read operations require only a provider; write operations require a signer.
 *
 * @example
 * ```ts
 * import { TaskManagerContract } from '@amemployer/sdk';
 * import { ethers } from 'ethers';
 *
 * const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
 * const tm = new TaskManagerContract('0xA532...', provider);
 * const stats = await tm.getPlatformStats();
 * ```
 */
declare class TaskManagerContract {
    private readonly contract;
    private readonly providerOrSigner;
    constructor(address: string, providerOrSigner: ethers$1.Provider | ethers$1.Signer);
    get address(): string;
    /**
     * Get a task's full on-chain data by ID.
     */
    getTask(taskId: bigint | number): Promise<OnchainTask>;
    /**
     * Get a worker's on-chain stats.
     */
    getWorkerStats(walletAddress: string): Promise<{
        reputation: number;
        completedTasks: number;
        failedTasks: number;
        earnings: string;
        isRegistered: boolean;
    }>;
    /**
     * Get all task IDs for a worker address.
     */
    getWorkerTaskIds(walletAddress: string): Promise<number[]>;
    /**
     * Get all task IDs for an employer address.
     */
    getEmployerTaskIds(employerAddress: string): Promise<number[]>;
    /**
     * Get platform-wide statistics.
     */
    getPlatformStats(): Promise<{
        totalTasks: number;
        completedTasks: number;
        paidOut: string;
    }>;
    taskCounter(): Promise<number>;
    platformFeePercent(): Promise<number>;
    paymentToken(): Promise<string>;
    aiValidatorAddress(): Promise<string>;
    private assertSigner;
    /**
     * Register the calling wallet as a worker.
     */
    registerWorker(): Promise<ethers$1.TransactionReceipt>;
    /**
     * Create a single task. Caller must have pre-approved cUSD spend.
     * @param rewardWei - Reward in token base units (wei)
     * @param metadataHash - bytes32 hash of off-chain task metadata
     * @param deadlineDuration - Seconds until deadline from now
     * @returns On-chain task ID
     */
    createTask(rewardWei: bigint, metadataHash: string, deadlineDuration: number): Promise<number>;
    /**
     * Create multiple tasks in one transaction.
     * @returns Array of on-chain task IDs
     */
    batchCreateTasks(tasks: Array<{
        rewardWei: bigint;
        metadataHash: string;
        deadlineDuration: number;
    }>): Promise<number[]>;
    /**
     * Submit work for an assigned task.
     */
    submitWork(taskId: bigint | number, submissionData: string): Promise<ethers$1.TransactionReceipt>;
    /**
     * Approve the TaskManager to spend `amount` of the payment token on behalf
     * of the signer. Use `ethers.MaxUint256` for unlimited approval.
     */
    approveToken(amount?: bigint): Promise<ethers$1.TransactionReceipt>;
    /**
     * Get the caller's current payment token allowance for this contract.
     */
    getTokenAllowance(ownerAddress: string): Promise<bigint>;
    /**
     * Get the payment token balance of an address in formatted ether units.
     */
    getTokenBalance(walletAddress: string): Promise<string>;
    /**
     * Listen for TaskCreated events. Returns a cleanup function.
     */
    onTaskCreated(callback: (taskId: number, employer: string, reward: bigint) => void): () => void;
    /**
     * Listen for TaskVerified events. Returns a cleanup function.
     */
    onTaskVerified(callback: (taskId: number, worker: string, approved: boolean) => void): () => void;
    /**
     * Listen for PaymentReleased events. Returns a cleanup function.
     */
    onPaymentReleased(callback: (taskId: number, worker: string, amount: bigint) => void): () => void;
}

/**
 * Typed wrapper around the WorkerRegistry smart contract (soulbound ERC-721).
 *
 * @example
 * ```ts
 * import { WorkerRegistryContract } from '@amemployer/sdk';
 * import { ethers } from 'ethers';
 *
 * const provider = new ethers.JsonRpcProvider('https://forno.celo.org');
 * const wr = new WorkerRegistryContract('0x7b08...', provider);
 * const hasId = await wr.hasIdentity('0xWorkerAddress');
 * ```
 */
declare class WorkerRegistryContract {
    private readonly contract;
    private readonly providerOrSigner;
    constructor(address: string, providerOrSigner: ethers$1.Provider | ethers$1.Signer);
    get address(): string;
    /**
     * Returns true if the address has a minted worker identity NFT.
     */
    hasIdentity(walletAddress: string): Promise<boolean>;
    /**
     * Get the full worker identity for an address.
     */
    getWorkerIdentity(walletAddress: string): Promise<OnchainWorkerIdentity>;
    /**
     * Get the NFT token ID for a wallet address (0 if none).
     */
    walletToTokenId(walletAddress: string): Promise<bigint>;
    /**
     * Get the total number of registered workers.
     */
    totalWorkers(): Promise<number>;
    /**
     * Check whether a task manager address is authorized.
     */
    isTaskManagerAuthorized(taskManagerAddress: string): Promise<boolean>;
    private assertSigner;
    /**
     * Mint a soulbound worker identity NFT.
     * Caller must be an authorized task manager or the contract owner.
     */
    mintWorkerNFT(workerAddress: string, personaName: string, workerType?: WorkerTypeOnChainValue): Promise<{
        tokenId: bigint;
        receipt: ethers$1.TransactionReceipt;
    }>;
    /**
     * Listen for WorkerMinted events. Returns a cleanup function.
     */
    onWorkerMinted(callback: (wallet: string, tokenId: bigint, personaName: string) => void): () => void;
}

declare const TASK_MANAGER_ABI: readonly ["constructor(address _paymentToken, address _aiValidator)", "function setAIValidator(address _validator)", "function setPlatformFee(uint256 _feePercent)", "function withdrawPlatformFees()", "function registerWorker()", "function registerWorkerFor(address worker)", "function createTask(uint256 reward, bytes32 metadataHash, uint256 deadlineDuration) returns (uint256 taskId)", "function batchCreateTasks(uint256[] rewards, bytes32[] metadataHashes, uint256[] deadlineDurations) returns (uint256[] taskIds)", "function assignTask(uint256 taskId, address worker)", "function submitWork(uint256 taskId, string submissionData)", "function verifyTask(uint256 taskId, bool approved)", "function slashWorker(address worker, uint256 taskId)", "function reclaimExpiredTask(uint256 taskId)", "function getTask(uint256 taskId) view returns (tuple(uint256 id, address employer, uint256 reward, uint8 status, address assignedWorker, uint256 deadline, bytes32 metadataHash, string submissionData, uint256 createdAt, uint256 completedAt))", "function getWorkerStats(address worker) view returns (uint256 reputation, uint256 completedTasks, uint256 failedTasks, uint256 earnings, bool isRegistered)", "function getWorkerTaskIds(address worker) view returns (uint256[])", "function getEmployerTaskIds(address employer) view returns (uint256[])", "function getPlatformStats() view returns (uint256 totalTasks, uint256 completedTasks, uint256 paidOut)", "function taskCounter() view returns (uint256)", "function totalTasksCompleted() view returns (uint256)", "function totalPaidOut() view returns (uint256)", "function platformFeePercent() view returns (uint256)", "function aiValidatorAddress() view returns (address)", "function paymentToken() view returns (address)", "function tasks(uint256 taskId) view returns (tuple(uint256 id, address employer, uint256 reward, uint8 status, address assignedWorker, uint256 deadline, bytes32 metadataHash, string submissionData, uint256 createdAt, uint256 completedAt))", "function workers(address worker) view returns (tuple(address wallet, uint256 reputation, uint256 completedTasks, uint256 failedTasks, uint256 earnings, bool isRegistered, uint256 registeredAt))", "event TaskCreated(uint256 indexed taskId, address indexed employer, uint256 reward, bytes32 metadataHash, uint256 deadline)", "event TaskAssigned(uint256 indexed taskId, address indexed worker)", "event WorkSubmitted(uint256 indexed taskId, address indexed worker)", "event TaskVerified(uint256 indexed taskId, address indexed worker, bool approved)", "event PaymentReleased(uint256 indexed taskId, address indexed worker, uint256 amount)", "event WorkerSlashed(address indexed worker, uint256 indexed taskId)", "event WorkerRegistered(address indexed worker)", "event ValidatorUpdated(address indexed newValidator)", "event TaskExpiredReclaimed(uint256 indexed taskId, address indexed employer, uint256 amount)"];

declare const WORKER_REGISTRY_ABI: readonly ["constructor()", "function setTaskManagerAuthorization(address taskManager, bool authorized)", "function mintWorkerNFT(address worker, string personaName, uint8 workerType) returns (uint256 tokenId)", "function updateWorkerLevel(address worker, uint256 reputation)", "function deactivateWorker(address worker)", "function getWorkerIdentity(address worker) view returns (tuple(uint256 tokenId, address wallet, string personaName, uint8 workerType, uint256 level, uint256 mintedAt, bool active))", "function hasIdentity(address worker) view returns (bool)", "function totalWorkers() view returns (uint256)", "function walletToTokenId(address wallet) view returns (uint256)", "function identities(uint256 tokenId) view returns (tuple(uint256 tokenId, address wallet, string personaName, uint8 workerType, uint256 level, uint256 mintedAt, bool active))", "function authorizedTaskManagers(address) view returns (bool)", "function name() view returns (string)", "function symbol() view returns (string)", "function ownerOf(uint256 tokenId) view returns (address)", "function balanceOf(address owner) view returns (uint256)", "event WorkerMinted(address indexed wallet, uint256 indexed tokenId, string personaName)", "event WorkerDeactivated(address indexed wallet, uint256 indexed tokenId)", "event TaskManagerAuthorized(address indexed taskManager, bool authorized)"];

declare const CHAIN_IDS: {
    readonly CELO_MAINNET: 42220;
    readonly CELO_ALFAJORES: 44787;
    readonly HARDHAT: 31337;
};
declare const RPC_URLS: {
    readonly 42220: "https://forno.celo.org";
    readonly 44787: "https://alfajores-forno.celo-testnet.org";
};
declare const EXPLORER_URLS: {
    readonly 42220: "https://celoscan.io";
    readonly 44787: "https://alfajores.celoscan.io";
};
declare const CUSD_ADDRESSES: {
    readonly 42220: "0x765DE816845861e75A25fCA122bb6898B8B1282a";
    readonly 44787: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
};
declare const CONTRACT_ADDRESSES: {
    readonly 42220: {
        readonly TaskManager: "0xA532809154b1f8A18c09aaf5E59B0e8de6049E0b";
        readonly WorkerRegistry: "0x7b08eb88a15911BcF00b22011def1E02d7F7640b";
        readonly cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a";
    };
    readonly 44787: {
        readonly TaskManager: "0xA532809154b1f8A18c09aaf5E59B0e8de6049E0b";
        readonly WorkerRegistry: "0x7b08eb88a15911BcF00b22011def1E02d7F7640b";
        readonly cUSD: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";
    };
};
/** cUSD token decimals */
declare const CUSD_DECIMALS = 18;
/** Default platform fee percent */
declare const DEFAULT_PLATFORM_FEE_PERCENT = 5;
/** AI validation pass threshold */
declare const VALIDATION_PASS_SCORE = 60;
/** Default API base URL */
declare const DEFAULT_API_URL = "http://localhost:4000";
/** Default RPC (Celo mainnet) */
declare const DEFAULT_RPC_URL: "https://forno.celo.org";
/** Default request timeout in ms */
declare const DEFAULT_TIMEOUT_MS = 10000;

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
declare class AmEmployer {
    readonly client: AmEmployerClient;
    readonly taskManager: TaskManagerContract;
    readonly workerRegistry: WorkerRegistryContract;
    constructor(config?: AmEmployerConfig);
}

export { AmEmployer, AmEmployerApiError, AmEmployerClient, type AmEmployerConfig, CHAIN_IDS, CONTRACT_ADDRESSES, CUSD_ADDRESSES, CUSD_DECIMALS, type CreateJobInput, DEFAULT_API_URL, DEFAULT_PLATFORM_FEE_PERCENT, DEFAULT_RPC_URL, DEFAULT_TIMEOUT_MS, EXPLORER_URLS, type Job, type JobStatus, type ListResponse, type OnchainTask, type OnchainWorkerIdentity, type OnchainWorkerProfile, type Payment, type PaymentStatus, type PlatformStats, RPC_URLS, type RegisterWorkerInput, type SingleResponse, type StartSimulationInput, type SubmitTaskInput, TASK_MANAGER_ABI, type Task, TaskManagerContract, type TaskStatus, VALIDATION_PASS_SCORE, WORKER_REGISTRY_ABI, type Worker, WorkerRegistryContract, type WorkerType, WorkerTypeOnChain, type WorkerTypeOnChainValue };
