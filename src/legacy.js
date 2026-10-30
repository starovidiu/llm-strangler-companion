// Deliberately simple baseline; not a model of a real company's rules.
export async function legacyClassifier(ticket) {
  const text = ticket.description.toLowerCase();
  const queue = /invoice|refund|payment/.test(text) ? 'Billing'
    : /api|error|login|timeout/.test(text) ? 'Technical' : 'General';
  return {queue, reason: 'Legacy rules'};
}
