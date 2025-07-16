import {
  createContextEntry,
  createMessage,
  getContextEntries,
  incrementJobTokens,
  updateJob,
  type Endpoint as DbEndpoint,
} from "@cronicorn/database";

import type { JSONSchema7, LanguageModelUsage, ModelMessage } from "ai";

/**
 * Represents a user-defined webhook endpoint with its JSON request schema.
 */
export type ValidatedEndpoint = Omit<
  DbEndpoint,
  "id" | "responseSchema" | "requestSchema" | "jobId"
> & {
  requestSchema: JSONSchema7;
};

/**
 * Client interface for interacting with the scheduler backend.
 */
export interface SaaSApiClient {
  /** Append new messages to the job's LLM history */
  appendJobHistory(
    jobId: string,
    messages: ModelMessage[],
    usage?: LanguageModelUsage
  ): Promise<void>;
  /** Persist the next scheduled run time */
  scheduleNext(
    jobId: string,
    opts: { delayMinutes: number; reason: string }
  ): Promise<{
    result: string;
    success: boolean;
  }>;
  /** Store a key/value pair in the job's context store */
  updateContext(
    jobId: string,
    entry: { key: string; value: any }
  ): Promise<void>;
  /** Retrieve all context entries as a key→value map */
  getContext(jobId: string): Promise<Record<string, any>>;
  /** Send a notification (Discord, Slack, email, etc.) */
  sendNotification(
    jobId: string,
    opts: { message: string; level: string }
  ): Promise<void>;
}

/**
 * Creates a SaaS API client backed by Prisma for persistence.
 */
export function createSaaSApiClient(): SaaSApiClient {
  return {
    appendJobHistory: async (jobId, messages, usage) => {
      // Add sequence numbers to preserve order
      const messagesWithSequence = messages.map((message, index) => ({
        ...message,
        sequence: index,
        // set createdat to new date plus millisecdon
        createdAt: new Date(Date.now() + index * 100), // stagger by 1 second for uniqueness
      }));

      //   await prisma.$transaction(
      //     messagesWithSequence.map((msg) =>
      //       prisma.message.create({
      //         data: {
      //           role: msg.role as string,
      //           content: msg.content as Prisma.InputJsonValue,
      //           jobId,
      //           createdAt: msg.createdAt, // set createdAt to the calculated value
      //         },
      //       })
      //     )
      //   );
      // await an async loop to insert messages
      for (const msg of messagesWithSequence) {
        await createMessage({
          role: msg.role as string,
          content: msg.content as any, // assuming content is JSON serializable
          jobId,
          createdAt: msg.createdAt, // set createdAt to the calculated value
        });
      }

      await incrementJobTokens(jobId, {
        cachedInputTokens: usage?.cachedInputTokens ?? 0,
        inputTokens: usage?.inputTokens ?? 0,
        outputTokens: usage?.outputTokens ?? 0,
        totalTokens: usage?.totalTokens ?? 0,
        reasoningTokens: usage?.reasoningTokens ?? 0,
      });
    },

    scheduleNext: async (jobId, opts) => {
      const nextRunAt = new Date(Date.now() + opts.delayMinutes * 60 * 1000);
      //   const updated = await prisma.job.update({
      //     where: { id: jobId },
      //     data: { nextRunAt },
      //   });
      const updated = await updateJob(jobId, { nextRunAt });
      if (updated.nextRunAt) {
        return {
          result: `Next run scheduled for ${nextRunAt.toISOString()}`,
          success: true,
        };
      }
      return {
        result: `Failed to schedule next run for job ${jobId}`,
        success: false,
      };
    },

    updateContext: async (jobId, entry) => {
      await createContextEntry({
        jobId,
        ...entry,
      });
    },

    getContext: async (jobId) => {
      const entries = await getContextEntries({ limit: 100, page: 1 });
      return entries.reduce<Record<string, any>>((ctx, entry) => {
        ctx[entry.key] = entry.value;
        return ctx;
      }, {});
    },

    sendNotification: async (jobId, opts) => {
      console.log(
        `Notification for job ${jobId}: ${opts.message} (level: ${opts.level})`
      );
    },
  };
}
