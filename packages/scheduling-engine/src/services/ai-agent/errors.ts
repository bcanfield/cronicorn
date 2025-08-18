export class MalformedResponseError extends Error {
  phase: "plan" | "schedule";
  category: string;
  attempts: number;
  repaired: boolean;
  constructor(params: { phase: "plan" | "schedule"; category: string; attempts: number; repaired: boolean; message?: string }) {
    super(params.message || `Malformed ${params.phase} response: ${params.category}`);
    this.name = "MalformedResponseError";
    this.phase = params.phase;
    this.category = params.category;
    this.attempts = params.attempts;
    this.repaired = params.repaired;
  }
}
