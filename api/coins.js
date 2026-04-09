import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { method } = req;
  const STORAGE_KEY_PREFIX = 'fountain_coins_';

  try {
    if (method === 'GET') {
      const { fountain } = req.query;
      if (!fountain) return res.status(400).json({ error: 'Fountain name required' });
      
      const key = STORAGE_KEY_PREFIX + fountain;
      const coins = await kv.get(key);
      return res.status(200).json(coins || []);
    } 

    if (method === 'POST') {
      const coinData = req.body;
      if (!coinData || !coinData.fountain) {
        return res.status(400).json({ error: 'Valid coin data required' });
      }

      const key = STORAGE_KEY_PREFIX + coinData.fountain;
      
      // Add id and timestamp server-side for consistency
      coinData.date = new Date().toISOString();
      coinData.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Atomic push to list
      const existing = await kv.get(key) || [];
      existing.push(coinData);
      
      // Keep only last 100 coins to avoid huge payloads in a demo
      if (existing.length > 100) {
        existing.shift();
      }

      await kv.set(key, existing);
      return res.status(200).json(coinData);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('KV Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
