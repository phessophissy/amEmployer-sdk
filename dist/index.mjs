import { ethers } from 'ethers';

// src/constants/index.ts
var CHAIN_IDS = {
  CELO_MAINNET: 42220,
  CELO_ALFAJORES: 44787,
  HARDHAT: 31337
};
var RPC_URLS = {
  [CHAIN_IDS.CELO_MAINNET]: "https://forno.celo.org",
  [CHAIN_IDS.CELO_ALFAJORES]: "https://alfajores-forno.celo-testnet.org"
};
var EXPLORER_URLS = {
  [CHAIN_IDS.CELO_MAINNET]: "https://celoscan.io",
  [CHAIN_IDS.CELO_ALFAJORES]: "https://alfajores.celoscan.io"
};
var CUSD_ADDRESSES = {
  [CHAIN_IDS.CELO_MAINNET]: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  [CHAIN_IDS.CELO_ALFAJORES]: "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
};
var CONTRACT_ADDRESSES = {
  [CHAIN_IDS.CELO_MAINNET]: {
    TaskManager: "0xA532809154b1f8A18c09aaf5E59B0e8de6049E0b",
    WorkerRegistry: "0x7b08eb88a15911BcF00b22011def1E02d7F7640b",
    cUSD: CUSD_ADDRESSES[CHAIN_IDS.CELO_MAINNET]
  },
  [CHAIN_IDS.CELO_ALFAJORES]: {
    TaskManager: "0xA532809154b1f8A18c09aaf5E59B0e8de6049E0b",
    WorkerRegistry: "0x7b08eb88a15911BcF00b22011def1E02d7F7640b",
    cUSD: CUSD_ADDRESSES[CHAIN_IDS.CELO_ALFAJORES]
  }
};
var CUSD_DECIMALS = 18;
var DEFAULT_PLATFORM_FEE_PERCENT = 5;
var VALIDATION_PASS_SCORE = 60;
var DEFAULT_API_URL = "http://localhost:4000";
var DEFAULT_RPC_URL = RPC_URLS[CHAIN_IDS.CELO_MAINNET];
var DEFAULT_TIMEOUT_MS = 1e4;

// src/client/AmEmployerClient.ts
var AmEmployerApiError = class extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "AmEmployerApiError";
  }
};
var AmEmployerClient = class {
  constructor(config = {}) {
    // ─── Jobs ─────────────────────────────────────────────────────────────────
    this.jobs = {
      /**
       * List all jobs. Optionally filter by employer address.
       */
      list: (params) => {
        const qs = params?.employer ? `?employer=${encodeURIComponent(params.employer)}` : "";
        return this.get(`/api/jobs${qs}`);
      },
      /**
       * Get a single job by its ID, including tasks and AI logs.
       */
      get: (id) => this.get(`/api/jobs/${encodeURIComponent(id)}`),
      /**
       * Create a new job. The backend will decompose it into tasks via AI.
       */
      create: (input) => this.post("/api/jobs", input),
      /**
       * Launch the built-in demo job (no body required).
       */
      launchDemo: () => this.post("/api/jobs/demo/launch", {}),
      /**
       * Retrieve AI orchestration logs for a job.
       */
      aiLogs: (id) => this.get(`/api/jobs/${encodeURIComponent(id)}/ai-logs`)
    };
    // ─── Tasks ────────────────────────────────────────────────────────────────
    this.tasks = {
      /**
       * List tasks with optional filters.
       */
      list: (params) => {
        const qs = params ? "?" + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== void 0).map(([k, v]) => [k, String(v)])
          )
        ).toString() : "";
        return this.get(`/api/tasks${qs}`);
      },
      /**
       * Get a single task by ID.
       */
      get: (id) => this.get(`/api/tasks/${encodeURIComponent(id)}`),
      /**
       * Get all OPEN tasks, ordered by reward descending.
       */
      listOpen: () => this.get("/api/tasks/open"),
      /**
       * Submit work for a task.
       */
      submit: (id, input) => this.post(`/api/tasks/${encodeURIComponent(id)}/submit`, input)
    };
    // ─── Workers ──────────────────────────────────────────────────────────────
    this.workers = {
      /**
       * List workers, optionally filtered by type.
       */
      list: (params) => {
        const qs = params ? "?" + new URLSearchParams(
          Object.fromEntries(
            Object.entries(params).filter(([, v]) => v !== void 0).map(([k, v]) => [k, String(v)])
          )
        ).toString() : "";
        return this.get(`/api/workers${qs}`);
      },
      /**
       * Get a worker by wallet address.
       */
      get: (address) => this.get(`/api/workers/${encodeURIComponent(address)}`),
      /**
       * Register a new worker.
       */
      register: (input) => this.post("/api/workers/register", input),
      /**
       * Get the top 20 workers by completed tasks and reputation.
       */
      leaderboard: () => this.get("/api/workers/leaderboard")
    };
    // ─── Stats ────────────────────────────────────────────────────────────────
    this.stats = {
      /**
       * Get platform-wide stats (DB + on-chain).
       */
      platform: () => this.get("/api/stats"),
      /**
       * Get recent platform activity feed.
       */
      activity: () => this.get("/api/stats/activity")
    };
    // ─── Simulation ───────────────────────────────────────────────────────────
    this.simulation = {
      /**
       * List all simulations.
       */
      list: () => this.get("/api/simulation"),
      /**
       * Get a simulation by ID.
       */
      get: (id) => this.get(`/api/simulation/${encodeURIComponent(id)}`),
      /**
       * Start a new simulation with N virtual workers.
       */
      start: (input) => this.post("/api/simulation/start", input),
      /**
       * Get Bull queue statistics.
       */
      queueStats: () => this.get("/api/simulation/queues/stats")
    };
    this.baseUrl = (config.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, "");
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }
  // ─── Internal fetch ───────────────────────────────────────────────────────
  async request(method, path, body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    const url = `${this.baseUrl}${path}`;
    const init = {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: controller.signal,
      ...body !== void 0 ? { body: JSON.stringify(body) } : {}
    };
    try {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new AmEmployerApiError(
          res.status,
          data?.error ?? `HTTP ${res.status}`,
          data
        );
      }
      return data;
    } finally {
      clearTimeout(timer);
    }
  }
  get(path) {
    return this.request("GET", path);
  }
  post(path, body) {
    return this.request("POST", path, body);
  }
};

// src/abis/TaskManager.ts
var TASK_MANAGER_ABI = [
  // ─── Constructor ────────────────────────────────────────────────────────────
  "constructor(address _paymentToken, address _aiValidator)",
  // ─── Admin ──────────────────────────────────────────────────────────────────
  "function setAIValidator(address _validator)",
  "function setPlatformFee(uint256 _feePercent)",
  "function withdrawPlatformFees()",
  // ─── Worker Registration ─────────────────────────────────────────────────────
  "function registerWorker()",
  "function registerWorkerFor(address worker)",
  // ─── Task Lifecycle ──────────────────────────────────────────────────────────
  "function createTask(uint256 reward, bytes32 metadataHash, uint256 deadlineDuration) returns (uint256 taskId)",
  "function batchCreateTasks(uint256[] rewards, bytes32[] metadataHashes, uint256[] deadlineDurations) returns (uint256[] taskIds)",
  "function assignTask(uint256 taskId, address worker)",
  "function submitWork(uint256 taskId, string submissionData)",
  "function verifyTask(uint256 taskId, bool approved)",
  "function slashWorker(address worker, uint256 taskId)",
  "function reclaimExpiredTask(uint256 taskId)",
  // ─── Views ───────────────────────────────────────────────────────────────────
  "function getTask(uint256 taskId) view returns (tuple(uint256 id, address employer, uint256 reward, uint8 status, address assignedWorker, uint256 deadline, bytes32 metadataHash, string submissionData, uint256 createdAt, uint256 completedAt))",
  "function getWorkerStats(address worker) view returns (uint256 reputation, uint256 completedTasks, uint256 failedTasks, uint256 earnings, bool isRegistered)",
  "function getWorkerTaskIds(address worker) view returns (uint256[])",
  "function getEmployerTaskIds(address employer) view returns (uint256[])",
  "function getPlatformStats() view returns (uint256 totalTasks, uint256 completedTasks, uint256 paidOut)",
  "function taskCounter() view returns (uint256)",
  "function totalTasksCompleted() view returns (uint256)",
  "function totalPaidOut() view returns (uint256)",
  "function platformFeePercent() view returns (uint256)",
  "function aiValidatorAddress() view returns (address)",
  "function paymentToken() view returns (address)",
  "function tasks(uint256 taskId) view returns (tuple(uint256 id, address employer, uint256 reward, uint8 status, address assignedWorker, uint256 deadline, bytes32 metadataHash, string submissionData, uint256 createdAt, uint256 completedAt))",
  "function workers(address worker) view returns (tuple(address wallet, uint256 reputation, uint256 completedTasks, uint256 failedTasks, uint256 earnings, bool isRegistered, uint256 registeredAt))",
  // ─── Events ──────────────────────────────────────────────────────────────────
  "event TaskCreated(uint256 indexed taskId, address indexed employer, uint256 reward, bytes32 metadataHash, uint256 deadline)",
  "event TaskAssigned(uint256 indexed taskId, address indexed worker)",
  "event WorkSubmitted(uint256 indexed taskId, address indexed worker)",
  "event TaskVerified(uint256 indexed taskId, address indexed worker, bool approved)",
  "event PaymentReleased(uint256 indexed taskId, address indexed worker, uint256 amount)",
  "event WorkerSlashed(address indexed worker, uint256 indexed taskId)",
  "event WorkerRegistered(address indexed worker)",
  "event ValidatorUpdated(address indexed newValidator)",
  "event TaskExpiredReclaimed(uint256 indexed taskId, address indexed employer, uint256 amount)"
];

// src/contracts/TaskManagerContract.ts
var ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)"
];
var TaskManagerContract = class {
  constructor(address, providerOrSigner) {
    this.providerOrSigner = providerOrSigner;
    this.contract = new ethers.Contract(address, TASK_MANAGER_ABI, providerOrSigner);
  }
  get address() {
    return this.contract.target;
  }
  // ─── Read Methods ─────────────────────────────────────────────────────────
  /**
   * Get a task's full on-chain data by ID.
   */
  async getTask(taskId) {
    const t = await this.contract.getTask(taskId);
    return {
      id: BigInt(t.id),
      employer: t.employer,
      reward: BigInt(t.reward),
      status: Number(t.status),
      assignedWorker: t.assignedWorker,
      deadline: BigInt(t.deadline),
      metadataHash: t.metadataHash,
      submissionData: t.submissionData,
      createdAt: BigInt(t.createdAt),
      completedAt: BigInt(t.completedAt)
    };
  }
  /**
   * Get a worker's on-chain stats.
   */
  async getWorkerStats(walletAddress) {
    const [reputation, completedTasks, failedTasks, earnings, isRegistered] = await this.contract.getWorkerStats(walletAddress);
    return {
      reputation: Number(reputation),
      completedTasks: Number(completedTasks),
      failedTasks: Number(failedTasks),
      earnings: ethers.formatEther(earnings),
      isRegistered
    };
  }
  /**
   * Get all task IDs for a worker address.
   */
  async getWorkerTaskIds(walletAddress) {
    const ids = await this.contract.getWorkerTaskIds(walletAddress);
    return ids.map(Number);
  }
  /**
   * Get all task IDs for an employer address.
   */
  async getEmployerTaskIds(employerAddress) {
    const ids = await this.contract.getEmployerTaskIds(employerAddress);
    return ids.map(Number);
  }
  /**
   * Get platform-wide statistics.
   */
  async getPlatformStats() {
    const [totalTasks, completedTasks, paidOut] = await this.contract.getPlatformStats();
    return {
      totalTasks: Number(totalTasks),
      completedTasks: Number(completedTasks),
      paidOut: ethers.formatEther(paidOut)
    };
  }
  async taskCounter() {
    return Number(await this.contract.taskCounter());
  }
  async platformFeePercent() {
    return Number(await this.contract.platformFeePercent());
  }
  async paymentToken() {
    return this.contract.paymentToken();
  }
  async aiValidatorAddress() {
    return this.contract.aiValidatorAddress();
  }
  // ─── Write Methods (require Signer) ──────────────────────────────────────
  assertSigner() {
    if (!("signTransaction" in this.providerOrSigner)) {
      throw new Error(
        "TaskManagerContract: a Signer is required for write operations. Pass an ethers.Signer instead of a Provider."
      );
    }
    return this.providerOrSigner;
  }
  /**
   * Register the calling wallet as a worker.
   */
  async registerWorker() {
    this.assertSigner();
    const tx = await this.contract.registerWorker();
    return tx.wait();
  }
  /**
   * Create a single task. Caller must have pre-approved cUSD spend.
   * @param rewardWei - Reward in token base units (wei)
   * @param metadataHash - bytes32 hash of off-chain task metadata
   * @param deadlineDuration - Seconds until deadline from now
   * @returns On-chain task ID
   */
  async createTask(rewardWei, metadataHash, deadlineDuration) {
    this.assertSigner();
    const tx = await this.contract.createTask(rewardWei, metadataHash, deadlineDuration);
    const receipt = await tx.wait();
    const iface = new ethers.Interface(Array.from(TASK_MANAGER_ABI));
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "TaskCreated") {
          return Number(parsed.args.taskId);
        }
      } catch {
      }
    }
    throw new Error("TaskCreated event not found in receipt");
  }
  /**
   * Create multiple tasks in one transaction.
   * @returns Array of on-chain task IDs
   */
  async batchCreateTasks(tasks) {
    this.assertSigner();
    const rewards = tasks.map((t) => t.rewardWei);
    const hashes = tasks.map((t) => t.metadataHash);
    const deadlines = tasks.map((t) => BigInt(t.deadlineDuration));
    const tx = await this.contract.batchCreateTasks(rewards, hashes, deadlines);
    const receipt = await tx.wait();
    const iface = new ethers.Interface(Array.from(TASK_MANAGER_ABI));
    const ids = [];
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "TaskCreated") {
          ids.push(Number(parsed.args.taskId));
        }
      } catch {
      }
    }
    return ids;
  }
  /**
   * Submit work for an assigned task.
   */
  async submitWork(taskId, submissionData) {
    this.assertSigner();
    const tx = await this.contract.submitWork(taskId, submissionData);
    return tx.wait();
  }
  // ─── Token helpers ────────────────────────────────────────────────────────
  /**
   * Approve the TaskManager to spend `amount` of the payment token on behalf
   * of the signer. Use `ethers.MaxUint256` for unlimited approval.
   */
  async approveToken(amount = ethers.MaxUint256) {
    const signer = this.assertSigner();
    const tokenAddress = await this.paymentToken();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await tokenContract.approve(this.address, amount);
    return tx.wait();
  }
  /**
   * Get the caller's current payment token allowance for this contract.
   */
  async getTokenAllowance(ownerAddress) {
    const tokenAddress = await this.paymentToken();
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.providerOrSigner
    );
    return tokenContract.allowance(ownerAddress, this.address);
  }
  /**
   * Get the payment token balance of an address in formatted ether units.
   */
  async getTokenBalance(walletAddress) {
    const tokenAddress = await this.paymentToken();
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.providerOrSigner
    );
    const balance = await tokenContract.balanceOf(walletAddress);
    return ethers.formatEther(balance);
  }
  // ─── Event Helpers ────────────────────────────────────────────────────────
  /**
   * Listen for TaskCreated events. Returns a cleanup function.
   */
  onTaskCreated(callback) {
    const handler = (taskId, employer, reward) => {
      callback(Number(taskId), employer, reward);
    };
    this.contract.on("TaskCreated", handler);
    return () => void this.contract.off("TaskCreated", handler);
  }
  /**
   * Listen for TaskVerified events. Returns a cleanup function.
   */
  onTaskVerified(callback) {
    const handler = (taskId, worker, approved) => {
      callback(Number(taskId), worker, approved);
    };
    this.contract.on("TaskVerified", handler);
    return () => void this.contract.off("TaskVerified", handler);
  }
  /**
   * Listen for PaymentReleased events. Returns a cleanup function.
   */
  onPaymentReleased(callback) {
    const handler = (taskId, worker, amount) => {
      callback(Number(taskId), worker, amount);
    };
    this.contract.on("PaymentReleased", handler);
    return () => void this.contract.off("PaymentReleased", handler);
  }
};

// src/abis/WorkerRegistry.ts
var WORKER_REGISTRY_ABI = [
  // ─── Constructor ────────────────────────────────────────────────────────────
  "constructor()",
  // ─── Admin ──────────────────────────────────────────────────────────────────
  "function setTaskManagerAuthorization(address taskManager, bool authorized)",
  // ─── Minting ────────────────────────────────────────────────────────────────
  "function mintWorkerNFT(address worker, string personaName, uint8 workerType) returns (uint256 tokenId)",
  "function updateWorkerLevel(address worker, uint256 reputation)",
  "function deactivateWorker(address worker)",
  // ─── Views ───────────────────────────────────────────────────────────────────
  "function getWorkerIdentity(address worker) view returns (tuple(uint256 tokenId, address wallet, string personaName, uint8 workerType, uint256 level, uint256 mintedAt, bool active))",
  "function hasIdentity(address worker) view returns (bool)",
  "function totalWorkers() view returns (uint256)",
  "function walletToTokenId(address wallet) view returns (uint256)",
  "function identities(uint256 tokenId) view returns (tuple(uint256 tokenId, address wallet, string personaName, uint8 workerType, uint256 level, uint256 mintedAt, bool active))",
  "function authorizedTaskManagers(address) view returns (bool)",
  // ─── ERC721 ──────────────────────────────────────────────────────────────────
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  // ─── Events ──────────────────────────────────────────────────────────────────
  "event WorkerMinted(address indexed wallet, uint256 indexed tokenId, string personaName)",
  "event WorkerDeactivated(address indexed wallet, uint256 indexed tokenId)",
  "event TaskManagerAuthorized(address indexed taskManager, bool authorized)"
];

// src/types/index.ts
var WorkerTypeOnChain = {
  HUMAN: 0,
  SCRIPTED: 1,
  AI_AGENT: 2
};

// src/contracts/WorkerRegistryContract.ts
var WorkerRegistryContract = class {
  constructor(address, providerOrSigner) {
    this.providerOrSigner = providerOrSigner;
    this.contract = new ethers.Contract(address, WORKER_REGISTRY_ABI, providerOrSigner);
  }
  get address() {
    return this.contract.target;
  }
  // ─── Read Methods ─────────────────────────────────────────────────────────
  /**
   * Returns true if the address has a minted worker identity NFT.
   */
  async hasIdentity(walletAddress) {
    return this.contract.hasIdentity(walletAddress);
  }
  /**
   * Get the full worker identity for an address.
   */
  async getWorkerIdentity(walletAddress) {
    const id = await this.contract.getWorkerIdentity(walletAddress);
    return {
      tokenId: BigInt(id.tokenId),
      wallet: id.wallet,
      personaName: id.personaName,
      workerType: Number(id.workerType),
      level: BigInt(id.level),
      mintedAt: BigInt(id.mintedAt),
      active: id.active
    };
  }
  /**
   * Get the NFT token ID for a wallet address (0 if none).
   */
  async walletToTokenId(walletAddress) {
    return BigInt(await this.contract.walletToTokenId(walletAddress));
  }
  /**
   * Get the total number of registered workers.
   */
  async totalWorkers() {
    return Number(await this.contract.totalWorkers());
  }
  /**
   * Check whether a task manager address is authorized.
   */
  async isTaskManagerAuthorized(taskManagerAddress) {
    return this.contract.authorizedTaskManagers(taskManagerAddress);
  }
  // ─── Write Methods (require Signer) ──────────────────────────────────────
  assertSigner() {
    if (!("signTransaction" in this.providerOrSigner)) {
      throw new Error(
        "WorkerRegistryContract: a Signer is required for write operations. Pass an ethers.Signer instead of a Provider."
      );
    }
    return this.providerOrSigner;
  }
  /**
   * Mint a soulbound worker identity NFT.
   * Caller must be an authorized task manager or the contract owner.
   */
  async mintWorkerNFT(workerAddress, personaName, workerType = WorkerTypeOnChain.HUMAN) {
    this.assertSigner();
    const tx = await this.contract.mintWorkerNFT(workerAddress, personaName, workerType);
    const receipt = await tx.wait();
    const iface = new ethers.Interface(Array.from(WORKER_REGISTRY_ABI));
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "WorkerMinted") {
          return { tokenId: BigInt(parsed.args.tokenId), receipt };
        }
      } catch {
      }
    }
    const tokenId = await this.walletToTokenId(workerAddress);
    return { tokenId, receipt };
  }
  // ─── Event Helpers ────────────────────────────────────────────────────────
  /**
   * Listen for WorkerMinted events. Returns a cleanup function.
   */
  onWorkerMinted(callback) {
    const handler = (wallet, tokenId, personaName) => {
      callback(wallet, BigInt(tokenId), personaName);
    };
    this.contract.on("WorkerMinted", handler);
    return () => void this.contract.off("WorkerMinted", handler);
  }
};
var AmEmployer = class {
  constructor(config = {}) {
    const chainId = config.chainId ?? CHAIN_IDS.CELO_MAINNET;
    const defaults = CONTRACT_ADDRESSES[chainId];
    if (!defaults) {
      throw new Error(`Unsupported amEmployer chain ID: ${chainId}`);
    }
    this.client = new AmEmployerClient({
      apiUrl: config.apiUrl ?? DEFAULT_API_URL,
      timeout: config.timeout
    });
    const providerOrSigner = config.signer ? config.signer : new ethers.JsonRpcProvider(config.rpcUrl ?? RPC_URLS[chainId]);
    const tmAddress = config.taskManagerAddress ?? defaults.TaskManager;
    const wrAddress = config.workerRegistryAddress ?? defaults.WorkerRegistry;
    this.taskManager = new TaskManagerContract(tmAddress, providerOrSigner);
    this.workerRegistry = new WorkerRegistryContract(wrAddress, providerOrSigner);
  }
};

export { AmEmployer, AmEmployerApiError, AmEmployerClient, CHAIN_IDS, CONTRACT_ADDRESSES, CUSD_ADDRESSES, CUSD_DECIMALS, DEFAULT_API_URL, DEFAULT_PLATFORM_FEE_PERCENT, DEFAULT_RPC_URL, DEFAULT_TIMEOUT_MS, EXPLORER_URLS, RPC_URLS, TASK_MANAGER_ABI, TaskManagerContract, VALIDATION_PASS_SCORE, WORKER_REGISTRY_ABI, WorkerRegistryContract, WorkerTypeOnChain };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map