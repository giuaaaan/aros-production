import { createClient } from "./supabase/server";

interface WebhookPayload {
  id: string;
  url: string;
  payload: unknown;
  attempts: number;
  maxAttempts: number;
  retryAfter: number; // milliseconds
  createdAt: string;
}

const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

export class WebhookRetryManager {
  async scheduleWebhook(
    url: string,
    payload: unknown,
    options: { maxAttempts?: number; delay?: number } = {}
  ): Promise<void> {
    const supabase = await createClient();
    
    const webhook: WebhookPayload = {
      id: crypto.randomUUID(),
      url,
      payload,
      attempts: 0,
      maxAttempts: options.maxAttempts || MAX_RETRY_ATTEMPTS,
      retryAfter: Date.now() + (options.delay || 0),
      createdAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("webhook_queue")
      .insert(webhook);

    if (error) {
      console.error("Failed to schedule webhook:", error);
      throw error;
    }
  }

  async processWebhook(webhook: WebhookPayload): Promise<boolean> {
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-ID": webhook.id,
          "X-Webhook-Attempt": String(webhook.attempts + 1),
        },
        body: JSON.stringify(webhook.payload),
      });

      if (response.ok) {
        // Success - mark as completed
        await this.markCompleted(webhook.id);
        return true;
      } else {
        // Failure - schedule retry
        await this.scheduleRetry(webhook);
        return false;
      }
    } catch (error) {
      console.error(`Webhook ${webhook.id} failed:`, error);
      await this.scheduleRetry(webhook);
      return false;
    }
  }

  private async scheduleRetry(webhook: WebhookPayload): Promise<void> {
    const supabase = await createClient();
    
    if (webhook.attempts >= webhook.maxAttempts) {
      // Max attempts reached - mark as failed
      await supabase
        .from("webhook_queue")
        .update({
          status: "failed",
          error: "Max retry attempts reached",
          updated_at: new Date().toISOString(),
        })
        .eq("id", webhook.id);
      return;
    }

    const nextAttempt = webhook.attempts + 1;
    const delay = RETRY_DELAYS[Math.min(nextAttempt - 1, RETRY_DELAYS.length - 1)];
    const retryAfter = Date.now() + delay;

    await supabase
      .from("webhook_queue")
      .update({
        attempts: nextAttempt,
        retry_after: retryAfter,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhook.id);
  }

  private async markCompleted(id: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("webhook_queue")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  async processPendingWebhooks(): Promise<void> {
    const supabase = await createClient();
    
    const { data: pendingWebhooks } = await supabase
      .from("webhook_queue")
      .select("*")
      .eq("status", "pending")
      .lte("retry_after", Date.now())
      .limit(100);

    if (!pendingWebhooks) return;

    await Promise.all(
      pendingWebhooks.map((webhook) => this.processWebhook(webhook))
    );
  }
}

export const webhookRetry = new WebhookRetryManager();
