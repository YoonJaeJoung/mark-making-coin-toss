// storage.js — localStorage persistence for coin toss data

const STORAGE_KEY_PREFIX = 'fountain_coins_';

export function saveCoin(coinData) {
  const key = STORAGE_KEY_PREFIX + coinData.fountain;
  const existing = getCoins(coinData.fountain);
  coinData.date = new Date().toISOString();
  coinData.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  existing.push(coinData);
  localStorage.setItem(key, JSON.stringify(existing));
  return coinData;
}

export function getCoins(fountainName) {
  const key = STORAGE_KEY_PREFIX + fountainName;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function getAllCoins() {
  const all = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(STORAGE_KEY_PREFIX)) {
      const fountainName = key.replace(STORAGE_KEY_PREFIX, '');
      all[fountainName] = JSON.parse(localStorage.getItem(key));
    }
  }
  return all;
}

export function clearCoins(fountainName) {
  const key = STORAGE_KEY_PREFIX + fountainName;
  localStorage.removeItem(key);
}
