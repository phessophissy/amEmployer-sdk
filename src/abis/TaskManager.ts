export const TASK_MANAGER_ABI = [
  // ─── Constructor ────────────────────────────────────────────────────────────
  'constructor(address _paymentToken, address _aiValidator)',

  // ─── Admin ──────────────────────────────────────────────────────────────────
  'function setAIValidator(address _validator)',
  'function setPlatformFee(uint256 _feePercent)',
  'function withdrawPlatformFees()',

  // ─── Worker Registration ─────────────────────────────────────────────────────
  'function registerWorker()',
  'function registerWorkerFor(address worker)',

  // ─── Task Lifecycle ──────────────────────────────────────────────────────────
  'function createTask(uint256 reward, bytes32 metadataHash, uint256 deadlineDuration) returns (uint256 taskId)',
  'function batchCreateTasks(uint256[] rewards, bytes32[] metadataHashes, uint256[] deadlineDurations) returns (uint256[] taskIds)',
  'function assignTask(uint256 taskId, address worker)',
  'function submitWork(uint256 taskId, string submissionData)',
  'function verifyTask(uint256 taskId, bool approved)',
  'function slashWorker(address worker, uint256 taskId)',
  'function reclaimExpiredTask(uint256 taskId)',

  // ─── Views ───────────────────────────────────────────────────────────────────
  'function getTask(uint256 taskId) view returns (tuple(uint256 id, address employer, uint256 reward, uint8 status, address assignedWorker, uint256 deadline, bytes32 metadataHash, string submissionData, uint256 createdAt, uint256 completedAt))',
  'function getWorkerStats(address worker) view returns (uint256 reputation, uint256 completedTasks, uint256 failedTasks, uint256 earnings, bool isRegistered)',
  'function getWorkerTaskIds(address worker) view returns (uint256[])',
  'function getEmployerTaskIds(address employer) view returns (uint256[])',
  'function getPlatformStats() view returns (uint256 totalTasks, uint256 completedTasks, uint256 paidOut)',
  'function taskCounter() view returns (uint256)',
  'function totalTasksCompleted() view returns (uint256)',
  'function totalPaidOut() view returns (uint256)',
  'function platformFeePercent() view returns (uint256)',
  'function aiValidatorAddress() view returns (address)',
  'function paymentToken() view returns (address)',
  'function tasks(uint256 taskId) view returns (tuple(uint256 id, address employer, uint256 reward, uint8 status, address assignedWorker, uint256 deadline, bytes32 metadataHash, string submissionData, uint256 createdAt, uint256 completedAt))',
  'function workers(address worker) view returns (tuple(address wallet, uint256 reputation, uint256 completedTasks, uint256 failedTasks, uint256 earnings, bool isRegistered, uint256 registeredAt))',

  // ─── Events ──────────────────────────────────────────────────────────────────
  'event TaskCreated(uint256 indexed taskId, address indexed employer, uint256 reward, bytes32 metadataHash, uint256 deadline)',
  'event TaskAssigned(uint256 indexed taskId, address indexed worker)',
  'event WorkSubmitted(uint256 indexed taskId, address indexed worker)',
  'event TaskVerified(uint256 indexed taskId, address indexed worker, bool approved)',
  'event PaymentReleased(uint256 indexed taskId, address indexed worker, uint256 amount)',
  'event WorkerSlashed(address indexed worker, uint256 indexed taskId)',
  'event WorkerRegistered(address indexed worker)',
  'event ValidatorUpdated(address indexed newValidator)',
  'event TaskExpiredReclaimed(uint256 indexed taskId, address indexed employer, uint256 amount)',
] as const;
