import { DEFAULT_API_URL, DEFAULT_TIMEOUT_MS } from '../constants';
import type {
  Job,
  Task,
  Worker,
  Payment,
  PlatformStats,
  ListResponse,
  SingleResponse,
  CreateJobInput,
  RegisterWorkerInput,
  SubmitTaskInput,
  StartSimulationInput,
  JobListParams,
  TaskListParams,
  WorkerListParams,
} from '../types';

export class AmEmployerApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = 'AmEmployerApiError';
  }
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
export class AmEmployerClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: { apiUrl?: string; timeout?: number } = {}) {
    this.baseUrl = (config.apiUrl ?? DEFAULT_API_URL).replace(/\/$/, '');
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  // ─── Internal fetch ───────────────────────────────────────────────────────

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    const url = `${this.baseUrl}${path}`;
    const init: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: controller.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    try {
      const res = await fetch(url, init);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new AmEmployerApiError(
          res.status,
          (data as { error?: string })?.error ?? `HTTP ${res.status}`,
          data,
        );
      }
      return data as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private get<T>(path: string) {
    return this.request<T>('GET', path);
  }

  private post<T>(path: string, body: unknown) {
    return this.request<T>('POST', path, body);
  }

  private queryString(params?: object) {
    if (!params) {
      return '';
    }

    const entries = Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)] as [string, string]);

    const query = new URLSearchParams(
      entries,
    ).toString();

    return query ? `?${query}` : '';
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────────

  readonly jobs = {
    /**
     * List all jobs. Optionally filter by employer address.
     */
    list: (params?: JobListParams): Promise<ListResponse<Job>> =>
      this.get(`/api/jobs${this.queryString(params)}`),

    /**
     * Get a single job by its ID, including tasks and AI logs.
     */
    get: (id: string): Promise<SingleResponse<Job>> =>
      this.get(`/api/jobs/${encodeURIComponent(id)}`),

    /**
     * Create a new job. The backend will decompose it into tasks via AI.
     */
    create: (input: CreateJobInput): Promise<SingleResponse<Job>> =>
      this.post('/api/jobs', input),

    /**
     * Launch the built-in demo job (no body required).
     */
    launchDemo: (): Promise<SingleResponse<Job>> =>
      this.post('/api/jobs/demo/launch', {}),

    /**
     * Retrieve AI orchestration logs for a job.
     */
    aiLogs: (id: string): Promise<SingleResponse<unknown[]>> =>
      this.get(`/api/jobs/${encodeURIComponent(id)}/ai-logs`),
  };

  // ─── Tasks ────────────────────────────────────────────────────────────────

  readonly tasks = {
    /**
     * List tasks with optional filters.
     */
    list: (params?: TaskListParams): Promise<ListResponse<Task>> =>
      this.get(`/api/tasks${this.queryString(params)}`),

    /**
     * Get a single task by ID.
     */
    get: (id: string): Promise<SingleResponse<Task>> =>
      this.get(`/api/tasks/${encodeURIComponent(id)}`),

    /**
     * Get all OPEN tasks, ordered by reward descending.
     */
    listOpen: (): Promise<ListResponse<Task>> =>
      this.get('/api/tasks/open'),

    /**
     * Submit work for a task.
     */
    submit: (id: string, input: SubmitTaskInput): Promise<SingleResponse<Task>> =>
      this.post(`/api/tasks/${encodeURIComponent(id)}/submit`, input),
  };

  // ─── Workers ──────────────────────────────────────────────────────────────

  readonly workers = {
    /**
     * List workers, optionally filtered by type.
     */
    list: (params?: WorkerListParams): Promise<ListResponse<Worker>> =>
      this.get(`/api/workers${this.queryString(params)}`),

    /**
     * Get a worker by wallet address.
     */
    get: (address: string): Promise<SingleResponse<Worker>> =>
      this.get(`/api/workers/${encodeURIComponent(address)}`),

    /**
     * Register a new worker.
     */
    register: (input: RegisterWorkerInput): Promise<SingleResponse<Worker>> =>
      this.post('/api/workers/register', input),

    /**
     * Get the top 20 workers by completed tasks and reputation.
     */
    leaderboard: (): Promise<ListResponse<Worker>> =>
      this.get('/api/workers/leaderboard'),
  };

  // ─── Stats ────────────────────────────────────────────────────────────────

  readonly stats = {
    /**
     * Get platform-wide stats (DB + on-chain).
     */
    platform: (): Promise<SingleResponse<PlatformStats>> =>
      this.get('/api/stats'),

    /**
     * Get recent platform activity feed.
     */
    activity: (): Promise<SingleResponse<unknown[]>> =>
      this.get('/api/stats/activity'),
  };

  // ─── Simulation ───────────────────────────────────────────────────────────

  readonly simulation = {
    /**
     * List all simulations.
     */
    list: (): Promise<ListResponse<unknown>> =>
      this.get('/api/simulation'),

    /**
     * Get a simulation by ID.
     */
    get: (id: string): Promise<SingleResponse<unknown>> =>
      this.get(`/api/simulation/${encodeURIComponent(id)}`),

    /**
     * Start a new simulation with N virtual workers.
     */
    start: (input: StartSimulationInput): Promise<SingleResponse<unknown>> =>
      this.post('/api/simulation/start', input),

    /**
     * Get Bull queue statistics.
     */
    queueStats: (): Promise<SingleResponse<unknown>> =>
      this.get('/api/simulation/queues/stats'),
  };
}
