// storage.js — Global Vercel KV persistence for coin toss data

export async function saveCoin(coinData) {
  try {
    const response = await fetch('/api/coins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coinData)
    });
    const saved = await response.json();
    return saved;
  } catch (err) {
    console.warn('Could not save to cloud, falling back to local storage:', err);
    saveLocal(coinData);
    return coinData;
  }
}

export async function getCoins(fountainName) {
  try {
    const response = await fetch(`/api/coins?fountain=${fountainName}`);
    if (!response.ok) throw new Error('Network response not ok');
    const coins = await response.json();
    return coins || [];
  } catch (err) {
    console.warn('Could not fetch from cloud, falling back to local storage:', err);
    return getLocal(fountainName);
  }
}

// --- Local Backups ---
function saveLocal(coinData) {
  const key = `fountain_coins_${coinData.fountain}`;
  const existing = getLocal(coinData.fountain);
  coinData._localOnly = true;
  existing.push(coinData);
  localStorage.setItem(key, JSON.stringify(existing));
}

function getLocal(fountainName) {
  const key = `fountain_coins_${fountainName}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}
