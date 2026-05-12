// ─── Chain IDs ─────────────────────────────────────────────────────────────────

export const CHAIN_IDS = {
  CELO_MAINNET: 42220,
  CELO_ALFAJORES: 44787,
  HARDHAT: 31337,
} as const;

// ─── RPC URLs ─────────────────────────────────────────────────────────────────

export const RPC_URLS = {
  [CHAIN_IDS.CELO_MAINNET]: 'https://forno.celo.org',
  [CHAIN_IDS.CELO_ALFAJORES]: 'https://alfajores-forno.celo-testnet.org',
} as const;

// ─── Explorer URLs ────────────────────────────────────────────────────────────

export const EXPLORER_URLS = {
  [CHAIN_IDS.CELO_MAINNET]: 'https://celoscan.io',
  [CHAIN_IDS.CELO_ALFAJORES]: 'https://alfajores.celoscan.io',
} as const;

// ─── cUSD Addresses ───────────────────────────────────────────────────────────

export const CUSD_ADDRESSES = {
  [CHAIN_IDS.CELO_MAINNET]: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  [CHAIN_IDS.CELO_ALFAJORES]: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
} as const;

// ─── Deployed Contract Addresses ──────────────────────────────────────────────

export const CONTRACT_ADDRESSES = {
  [CHAIN_IDS.CELO_MAINNET]: {
    TaskManager: '0xA532809154b1f8A18c09aaf5E59B0e8de6049E0b',
    WorkerRegistry: '0x7b08eb88a15911BcF00b22011def1E02d7F7640b',
    cUSD: CUSD_ADDRESSES[CHAIN_IDS.CELO_MAINNET],
  },
  [CHAIN_IDS.CELO_ALFAJORES]: {
    TaskManager: '0xA532809154b1f8A18c09aaf5E59B0e8de6049E0b',
    WorkerRegistry: '0x7b08eb88a15911BcF00b22011def1E02d7F7640b',
    cUSD: CUSD_ADDRESSES[CHAIN_IDS.CELO_ALFAJORES],
  },
} as const;

// ─── Misc ─────────────────────────────────────────────────────────────────────

/** cUSD token decimals */
export const CUSD_DECIMALS = 18;

/** Default platform fee percent */
export const DEFAULT_PLATFORM_FEE_PERCENT = 5;

/** AI validation pass threshold */
export const VALIDATION_PASS_SCORE = 60;

/** Default API base URL */
export const DEFAULT_API_URL = 'http://localhost:4000';

/** Default RPC (Celo mainnet) */
export const DEFAULT_RPC_URL = RPC_URLS[CHAIN_IDS.CELO_MAINNET];

/** Default request timeout in ms */
export const DEFAULT_TIMEOUT_MS = 10_000;
