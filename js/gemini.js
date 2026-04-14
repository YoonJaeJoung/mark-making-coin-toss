/**
 * gemini.js — Gemini API wrapper for "Spirit of the Fountain"
 * Uses import.meta.env.VITE_GEMINI_API_KEY for authentication (Vercel/Vite).
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Construction moved inside the function for robustness

/**
 * Generates a mystical response based on the user's wish.
 * @param {string} nickname - User's name
 * @param {string} wish - User's wish
 * @param {string} coinType - The coin tossed ('us', 'euro', 'won')
 * @param {string} fountain - The fountain selected ('trevi', 'palseokdam')
 * @returns {Promise<string>} - The mystical response
 */
export async function generateSpiritResponse(nickname, wish, coinType, fountain) {
  if (!API_KEY) {
    console.warn('Gemini API Key is missing. Check your Vercel Environment Variables.');
    return getDefaultWisdom(fountain);
  }

  const coinLabel = getCoinLabel(coinType);
  const fountainLabel = getFountainLabel(fountain);
  const personality = getFountainPersonality(fountain);

  const prompt = `
    You are the mystical "Spirit of the ${fountainLabel}". 
    A traveler named "${nickname}" has just tossed a "${coinLabel}" into your waters and made this wish: "${wish || "a secret wish"}".
    
    ${personality}
    
    Provide a brief, mystical, and encouraging response to their wish (max 2 sentences).
    - CRITICAL: You MUST specifically acknowledge or reference the content of their wish ("${wish}") to show you have truly listened. 
    - Personalize the response based on the theme of their request.
    - If it's the Trevi Fountain, be romantic, grand, and use a touch of Italian flair (e.g., "Mio caro", "Destiny").
    - If it's Palseokdam, be calm, poetic, and use a touch of Korean/Zen wisdom (e.g., "The ripples of time", "Inyeon").
    - Respond directly to the user as if you are the fountain itself.
    - Do not use markdown or emojis in the text.
  `;

  try {
    // Using Gemini 3 Flash (Stable as of April 2026)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-3-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 100,
        }
      })
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('Gemini 3 Flash not found. You may need to check the latest model IDs in AI Studio.');
      }
      const errorData = await response.json();
      console.error('Gemini API Error Response:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
      console.warn('Gemini response format unexpected:', data);
      throw new Error('Invalid response from Gemini');
    }
  } catch (err) {
    console.error('Gemini API error:', err);
    return getDefaultWisdom(fountain);
  }
}

function getDefaultWisdom(fountain) {
  const wisdom = {
    trevi: "The waters of Trevi have heard your heart's desire. Destiny is already weaving your path back to Rome.",
    palseokdam: "The ripples of Palseokdam carry your wish to the deep. Patience and clarity will bring your flower to bloom."
  };
  return wisdom[fountain] || "The fountain ripples in agreement. Your wish has been cast into the flow of time.";
}

function getFountainPersonality(fountain) {
  if (fountain === 'trevi') {
    return "Tone: Romantic, operatic, passionate, and slightly mysterious. You believe in grand destiny and love.";
  } else {
    return "Tone: Serene, philosophical, and grounded. You believe in the natural flow of things and the beauty of small moments.";
  }
}

function getCoinLabel(type) {
  const labels = { us: 'US Quarter', euro: '1 Euro', won: '100 Won' };
  return labels[type] || type;
}

function getFountainLabel(name) {
  const labels = { trevi: 'Trevi Fountain', palseokdam: 'Palseokdam Basin' };
  return labels[name] || name;
}
