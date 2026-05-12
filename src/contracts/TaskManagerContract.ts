import { ethers } from 'ethers';
import { TASK_MANAGER_ABI } from '../abis/TaskManager';
import type { OnchainTask, OnchainWorkerProfile } from '../types';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
] as const;

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
export class TaskManagerContract {
  private readonly contract: ethers.Contract;
  private readonly providerOrSigner: ethers.Provider | ethers.Signer;

  constructor(
    address: string,
    providerOrSigner: ethers.Provider | ethers.Signer,
  ) {
    this.providerOrSigner = providerOrSigner;
    this.contract = new ethers.Contract(address, TASK_MANAGER_ABI, providerOrSigner);
  }

  get address(): string {
    return this.contract.target as string;
  }

  // ─── Read Methods ─────────────────────────────────────────────────────────

  /**
   * Get a task's full on-chain data by ID.
   */
  async getTask(taskId: bigint | number): Promise<OnchainTask> {
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
      completedAt: BigInt(t.completedAt),
    };
  }

  /**
   * Get a worker's on-chain stats.
   */
  async getWorkerStats(walletAddress: string): Promise<{
    reputation: number;
    completedTasks: number;
    failedTasks: number;
    earnings: string;
    isRegistered: boolean;
  }> {
    const [reputation, completedTasks, failedTasks, earnings, isRegistered] =
      await this.contract.getWorkerStats(walletAddress);
    return {
      reputation: Number(reputation),
      completedTasks: Number(completedTasks),
      failedTasks: Number(failedTasks),
      earnings: ethers.formatEther(earnings),
      isRegistered,
    };
  }

  /**
   * Get all task IDs for a worker address.
   */
  async getWorkerTaskIds(walletAddress: string): Promise<number[]> {
    const ids = await this.contract.getWorkerTaskIds(walletAddress);
    return ids.map(Number);
  }

  /**
   * Get all task IDs for an employer address.
   */
  async getEmployerTaskIds(employerAddress: string): Promise<number[]> {
    const ids = await this.contract.getEmployerTaskIds(employerAddress);
    return ids.map(Number);
  }

  /**
   * Get platform-wide statistics.
   */
  async getPlatformStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    paidOut: string;
  }> {
    const [totalTasks, completedTasks, paidOut] = await this.contract.getPlatformStats();
    return {
      totalTasks: Number(totalTasks),
      completedTasks: Number(completedTasks),
      paidOut: ethers.formatEther(paidOut),
    };
  }

  async taskCounter(): Promise<number> {
    return Number(await this.contract.taskCounter());
  }

  async platformFeePercent(): Promise<number> {
    return Number(await this.contract.platformFeePercent());
  }

  async paymentToken(): Promise<string> {
    return this.contract.paymentToken();
  }

  async aiValidatorAddress(): Promise<string> {
    return this.contract.aiValidatorAddress();
  }

  // ─── Write Methods (require Signer) ──────────────────────────────────────

  private assertSigner(): ethers.Signer {
    if (!('signTransaction' in this.providerOrSigner)) {
      throw new Error(
        'TaskManagerContract: a Signer is required for write operations. ' +
        'Pass an ethers.Signer instead of a Provider.',
      );
    }
    return this.providerOrSigner as ethers.Signer;
  }

  /**
   * Register the calling wallet as a worker.
   */
  async registerWorker(): Promise<ethers.TransactionReceipt> {
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
  async createTask(
    rewardWei: bigint,
    metadataHash: string,
    deadlineDuration: number,
  ): Promise<number> {
    this.assertSigner();
    const tx = await this.contract.createTask(rewardWei, metadataHash, deadlineDuration);
    const receipt = await tx.wait();

    const iface = new ethers.Interface(Array.from(TASK_MANAGER_ABI));
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'TaskCreated') {
          return Number(parsed.args.taskId);
        }
      } catch { /* skip non-matching logs */ }
    }
    throw new Error('TaskCreated event not found in receipt');
  }

  /**
   * Create multiple tasks in one transaction.
   * @returns Array of on-chain task IDs
   */
  async batchCreateTasks(
    tasks: Array<{ rewardWei: bigint; metadataHash: string; deadlineDuration: number }>,
  ): Promise<number[]> {
    this.assertSigner();
    const rewards = tasks.map((t) => t.rewardWei);
    const hashes = tasks.map((t) => t.metadataHash);
    const deadlines = tasks.map((t) => BigInt(t.deadlineDuration));

    const tx = await this.contract.batchCreateTasks(rewards, hashes, deadlines);
    const receipt = await tx.wait();

    const iface = new ethers.Interface(Array.from(TASK_MANAGER_ABI));
    const ids: number[] = [];
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'TaskCreated') {
          ids.push(Number(parsed.args.taskId));
        }
      } catch { /* skip */ }
    }
    return ids;
  }

  /**
   * Submit work for an assigned task.
   */
  async submitWork(
    taskId: bigint | number,
    submissionData: string,
  ): Promise<ethers.TransactionReceipt> {
    this.assertSigner();
    const tx = await this.contract.submitWork(taskId, submissionData);
    return tx.wait();
  }

  // ─── Token helpers ────────────────────────────────────────────────────────

  /**
   * Approve the TaskManager to spend `amount` of the payment token on behalf
   * of the signer. Use `ethers.MaxUint256` for unlimited approval.
   */
  async approveToken(amount: bigint = ethers.MaxUint256): Promise<ethers.TransactionReceipt> {
    const signer = this.assertSigner();
    const tokenAddress = await this.paymentToken();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await tokenContract.approve(this.address, amount);
    return tx.wait();
  }

  /**
   * Get the caller's current payment token allowance for this contract.
   */
  async getTokenAllowance(ownerAddress: string): Promise<bigint> {
    const tokenAddress = await this.paymentToken();
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.providerOrSigner,
    );
    return tokenContract.allowance(ownerAddress, this.address);
  }

  /**
   * Get the payment token balance of an address in formatted ether units.
   */
  async getTokenBalance(walletAddress: string): Promise<string> {
    const tokenAddress = await this.paymentToken();
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.providerOrSigner,
    );
    const balance = await tokenContract.balanceOf(walletAddress);
    return ethers.formatEther(balance);
  }

  // ─── Event Helpers ────────────────────────────────────────────────────────

  /**
   * Listen for TaskCreated events. Returns a cleanup function.
   */
  onTaskCreated(
    callback: (taskId: number, employer: string, reward: bigint) => void,
  ): () => void {
    const handler = (taskId: bigint, employer: string, reward: bigint) => {
      callback(Number(taskId), employer, reward);
    };
    this.contract.on('TaskCreated', handler);
    return () => void this.contract.off('TaskCreated', handler);
  }

  /**
   * Listen for TaskVerified events. Returns a cleanup function.
   */
  onTaskVerified(
    callback: (taskId: number, worker: string, approved: boolean) => void,
  ): () => void {
    const handler = (taskId: bigint, worker: string, approved: boolean) => {
      callback(Number(taskId), worker, approved);
    };
    this.contract.on('TaskVerified', handler);
    return () => void this.contract.off('TaskVerified', handler);
  }

  /**
   * Listen for PaymentReleased events. Returns a cleanup function.
   */
  onPaymentReleased(
    callback: (taskId: number, worker: string, amount: bigint) => void,
  ): () => void {
    const handler = (taskId: bigint, worker: string, amount: bigint) => {
      callback(Number(taskId), worker, amount);
    };
    this.contract.on('PaymentReleased', handler);
    return () => void this.contract.off('PaymentReleased', handler);
  }
}
