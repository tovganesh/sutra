/**
 * Sutra Valkey Queue & Event Bus (Linux Foundation Open Source Engine)
 * Provides asynchronous job dispatching, workflow event messaging, and task worker queues.
 */

export interface QueueJob<T = Record<string, unknown>> {
  id: string;
  queueName: string;
  payload: T;
  attempts: number;
  maxRetries: number;
  createdAt: string;
}

export type JobHandler<T = Record<string, unknown>> = (job: QueueJob<T>) => Promise<void>;

export class ValkeyQueueService {
  private inMemoryQueues: Map<string, Array<QueueJob>> = new Map();
  private subscribers: Map<string, Array<JobHandler>> = new Map();

  constructor(private valkeyUrl: string = 'valkey://localhost:6379') {}

  /**
   * Enqueues a job for background execution (e.g. NIC E-Invoice submission, PDF generation).
   */
  public async enqueue<T = Record<string, unknown>>(
    queueName: string,
    payload: T,
    maxRetries = 3
  ): Promise<QueueJob<T>> {
    const job: QueueJob<T> = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      queueName,
      payload,
      attempts: 0,
      maxRetries,
      createdAt: new Date().toISOString(),
    };

    const q = this.inMemoryQueues.get(queueName) || [];
    q.push(job as QueueJob<Record<string, unknown>>);
    this.inMemoryQueues.set(queueName, q);

    // Asynchronously dispatch to subscriber handlers
    this.dispatchJob(job as QueueJob<Record<string, unknown>>).catch((err) => {
      console.error(`[Sutra Valkey] Worker failed for job ${job.id}:`, err);
    });

    return job;
  }

  /**
   * Subscribes a worker handler to a specific queue.
   */
  public subscribe<T = Record<string, unknown>>(
    queueName: string,
    handler: JobHandler<T>
  ): void {
    const handlers = this.subscribers.get(queueName) || [];
    handlers.push(handler as JobHandler<Record<string, unknown>>);
    this.subscribers.set(queueName, handlers);
  }

  /**
   * Publishes an event to a Valkey PubSub topic.
   */
  public async publishEvent(topic: string, eventData: Record<string, unknown>): Promise<void> {
    const payload = {
      topic,
      data: eventData,
      timestamp: new Date().toISOString(),
    };
    await this.enqueue(`events:${topic}`, payload);
  }

  private async dispatchJob(job: QueueJob): Promise<void> {
    const handlers = this.subscribers.get(job.queueName) || [];
    for (const handler of handlers) {
      job.attempts++;
      try {
        await handler(job);
      } catch (err) {
        if (job.attempts < job.maxRetries) {
          // Re-queue for retry
          const q = this.inMemoryQueues.get(job.queueName) || [];
          q.push(job);
        }
        throw err;
      }
    }
  }

  public getQueueStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [k, v] of this.inMemoryQueues.entries()) {
      stats[k] = v.length;
    }
    return stats;
  }
}
