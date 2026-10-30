import express from 'express';
import {createGateway} from './gateway.js';

const app = express();
app.use(express.json({limit: '16kb'}));
// No real model is wired in: use legacy-only mode until one is injected.
const gateway = createGateway({percentage: 0, model: async () => {
  throw new Error('MODEL_NOT_CONFIGURED');
}});
app.post('/classify', async (req, res) => {
  const {tenantId, description} = req.body ?? {};
  if (typeof tenantId !== 'string' || !tenantId ||
      typeof description !== 'string' || !description.trim() || description.length > 4000) {
    return res.status(400).json({error: 'tenantId and description required'});
  }
  try { res.json(await gateway.classify({tenantId, description})); }
  catch { res.status(500).json({error: 'classification failed'}); }
});
app.listen(3000, '127.0.0.1', () => console.log('Demo listening on localhost:3000'));
