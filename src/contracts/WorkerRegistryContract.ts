import { ethers } from 'ethers';
import { WORKER_REGISTRY_ABI } from '../abis/WorkerRegistry';
import type { OnchainWorkerIdentity, WorkerTypeOnChainValue } from '../types';
import { WorkerTypeOnChain } from '../types';

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
export class WorkerRegistryContract {
  private readonly contract: ethers.Contract;
  private readonly providerOrSigner: ethers.Provider | ethers.Signer;

  constructor(
    address: string,
    providerOrSigner: ethers.Provider | ethers.Signer,
  ) {
    this.providerOrSigner = providerOrSigner;
    this.contract = new ethers.Contract(address, WORKER_REGISTRY_ABI, providerOrSigner);
  }

  get address(): string {
    return this.contract.target as string;
  }

  // ─── Read Methods ─────────────────────────────────────────────────────────

  /**
   * Returns true if the address has a minted worker identity NFT.
   */
  async hasIdentity(walletAddress: string): Promise<boolean> {
    return this.contract.hasIdentity(walletAddress);
  }

  /**
   * Get the full worker identity for an address.
   */
  async getWorkerIdentity(walletAddress: string): Promise<OnchainWorkerIdentity> {
    const id = await this.contract.getWorkerIdentity(walletAddress);
    return {
      tokenId: BigInt(id.tokenId),
      wallet: id.wallet,
      personaName: id.personaName,
      workerType: Number(id.workerType),
      level: BigInt(id.level),
      mintedAt: BigInt(id.mintedAt),
      active: id.active,
    };
  }

  /**
   * Get the NFT token ID for a wallet address (0 if none).
   */
  async walletToTokenId(walletAddress: string): Promise<bigint> {
    return BigInt(await this.contract.walletToTokenId(walletAddress));
  }

  /**
   * Get the total number of registered workers.
   */
  async totalWorkers(): Promise<number> {
    return Number(await this.contract.totalWorkers());
  }

  /**
   * Check whether a task manager address is authorized.
   */
  async isTaskManagerAuthorized(taskManagerAddress: string): Promise<boolean> {
    return this.contract.authorizedTaskManagers(taskManagerAddress);
  }

  // ─── Write Methods (require Signer) ──────────────────────────────────────

  private assertSigner(): ethers.Signer {
    if (!('signTransaction' in this.providerOrSigner)) {
      throw new Error(
        'WorkerRegistryContract: a Signer is required for write operations. ' +
        'Pass an ethers.Signer instead of a Provider.',
      );
    }
    return this.providerOrSigner as ethers.Signer;
  }

  /**
   * Mint a soulbound worker identity NFT.
   * Caller must be an authorized task manager or the contract owner.
   */
  async mintWorkerNFT(
    workerAddress: string,
    personaName: string,
    workerType: WorkerTypeOnChainValue = WorkerTypeOnChain.HUMAN,
  ): Promise<{ tokenId: bigint; receipt: ethers.TransactionReceipt }> {
    this.assertSigner();
    const tx = await this.contract.mintWorkerNFT(workerAddress, personaName, workerType);
    const receipt = await tx.wait();

    const iface = new ethers.Interface(Array.from(WORKER_REGISTRY_ABI));
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'WorkerMinted') {
          return { tokenId: BigInt(parsed.args.tokenId), receipt };
        }
      } catch { /* skip */ }
    }
    // Fallback: read from chain
    const tokenId = await this.walletToTokenId(workerAddress);
    return { tokenId, receipt };
  }

  // ─── Event Helpers ────────────────────────────────────────────────────────

  /**
   * Listen for WorkerMinted events. Returns a cleanup function.
   */
  onWorkerMinted(
    callback: (wallet: string, tokenId: bigint, personaName: string) => void,
  ): () => void {
    const handler = (wallet: string, tokenId: bigint, personaName: string) => {
      callback(wallet, BigInt(tokenId), personaName);
    };
    this.contract.on('WorkerMinted', handler);
    return () => void this.contract.off('WorkerMinted', handler);
  }
}
