import {legacyClassifier} from './legacy.js';
import {validateClassification} from './schema.js';
import {enabled} from './flags.js';
import {createBreaker} from './breaker.js';

// Inject the model adapter so tests never call a paid provider.
export function createGateway({model, percentage = 0, timeoutMs = 100,
  breaker = createBreaker(), legacy = legacyClassifier, onFallback = () => {}}) {
  async function classify(ticket) {
    if (!enabled(ticket.tenantId, percentage)) return legacy(ticket);
    try {
      const result = await breaker.run(async () => {
        const controller = new AbortController();
        let timer;
        const deadline = new Promise((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error('MODEL_TIMEOUT'));
          }, timeoutMs);
        });
        try {
          const raw = await Promise.race([model(ticket, {signal: controller.signal}), deadline]);
          return validateClassification(raw);
        } finally { clearTimeout(timer); }
      });
      return result; // Validation is structural, NOT a truth or authorization check.
    } catch (error) {
      onFallback(error);
      return legacy(ticket);
    }
  }
  return {classify, breaker};
}
