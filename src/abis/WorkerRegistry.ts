export const WORKER_REGISTRY_ABI = [
  // ─── Constructor ────────────────────────────────────────────────────────────
  'constructor()',

  // ─── Admin ──────────────────────────────────────────────────────────────────
  'function setTaskManagerAuthorization(address taskManager, bool authorized)',

  // ─── Minting ────────────────────────────────────────────────────────────────
  'function mintWorkerNFT(address worker, string personaName, uint8 workerType) returns (uint256 tokenId)',
  'function updateWorkerLevel(address worker, uint256 reputation)',
  'function deactivateWorker(address worker)',

  // ─── Views ───────────────────────────────────────────────────────────────────
  'function getWorkerIdentity(address worker) view returns (tuple(uint256 tokenId, address wallet, string personaName, uint8 workerType, uint256 level, uint256 mintedAt, bool active))',
  'function hasIdentity(address worker) view returns (bool)',
  'function totalWorkers() view returns (uint256)',
  'function walletToTokenId(address wallet) view returns (uint256)',
  'function identities(uint256 tokenId) view returns (tuple(uint256 tokenId, address wallet, string personaName, uint8 workerType, uint256 level, uint256 mintedAt, bool active))',
  'function authorizedTaskManagers(address) view returns (bool)',

  // ─── ERC721 ──────────────────────────────────────────────────────────────────
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',

  // ─── Events ──────────────────────────────────────────────────────────────────
  'event WorkerMinted(address indexed wallet, uint256 indexed tokenId, string personaName)',
  'event WorkerDeactivated(address indexed wallet, uint256 indexed tokenId)',
  'event TaskManagerAuthorized(address indexed taskManager, bool authorized)',
] as const;
