/**
 * Shared Request Pacer & Retry Helper
 * Enforces ~2 requests/second rate limit and exponential backoff for Tatum Free Tier.
 */

export class RequestPacer {
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(requestsPerSecond = 2) {
    this.minIntervalMs = Math.ceil(1000 / requestsPerSecond);
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  async fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetries) {
      await this.throttle();
      try {
        const response = await fetch(url, options);

        // If rate limited (429) or transient server error (502, 503, 504), retry with backoff
        if (response.status === 429 || (response.status >= 500 && response.status <= 504)) {
          attempt++;
          if (attempt >= maxRetries) {
            return response;
          }
          console.warn(`[Pacer] Received status ${response.status} from ${url}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        return response;
      } catch (err: any) {
        attempt++;
        if (attempt >= maxRetries) {
          throw err;
        }
        console.warn(`[Pacer] Network error (${err.message}). Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error(`Request to ${url} failed after ${maxRetries} attempts.`);
  }
}

export const defaultPacer = new RequestPacer(2);
