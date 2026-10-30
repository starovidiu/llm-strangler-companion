import Ajv from 'ajv';
const ajv = new Ajv();
const validate = ajv.compile({
  type: 'object', required: ['queue', 'reason'], additionalProperties: false,
  properties: {
    queue: {enum: ['Billing', 'Technical', 'General']},
    reason: {type: 'string', minLength: 1, maxLength: 500}
  }
});
export function validateClassification(value) {
  if (!validate(value)) throw new Error('Invalid classification schema');
  return value;
}
