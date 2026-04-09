// app.js — Main application controller

import { saveCoin, getCoins } from './storage.js';
import { FountainRenderer } from './fountain.js';
import { HandDetector } from './hand-detector.js';
import { CoinTossAnimation } from './coin-toss.js';
import { generateSpiritResponse } from './gemini.js';

class App {
  constructor() {
    this.state = {
      mode: null,        // 'practice' or 'actual'
      fountain: null,    // 'trevi' or 'palseokdam'
      coinType: null,    // 'us', 'euro', 'won'
      nickname: '',
      wish: '',
      wishVisible: true
    };

    this.screens = {};
    this.handDetector = new HandDetector();
    this.fountainRenderer = null;
    this.coinTossAnimation = null;

    this.init();
  }

  init() {
    // Cache screen elements
    document.querySelectorAll('.screen').forEach(el => {
      this.screens[el.id] = el;
    });

    this.setupEventListeners();
    this.showScreen('screen-landing');

    // Add water ripple particles to landing
    this.initParticles();
  }

  setupEventListeners() {
    // Landing screen
    document.getElementById('btn-practice').addEventListener('click', () => {
      this.state.mode = 'practice';
      this.showScreen('screen-fountain-select');
    });

    document.getElementById('btn-actual').addEventListener('click', () => {
      this.state.mode = 'actual';
      this.showScreen('screen-wish-form');
    });

    // Wish form
    document.getElementById('wish-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.state.nickname = document.getElementById('input-nickname').value.trim() || 'Anonymous';
      this.state.wish = document.getElementById('input-wish').value.trim();
      this.state.wishVisible = document.getElementById('input-wish-visible').checked;
      this.showScreen('screen-fountain-select');
    });

    // Fountain selection
    document.querySelectorAll('.fountain-card').forEach(card => {
      card.addEventListener('click', () => {
        this.state.fountain = card.dataset.fountain;
        document.querySelectorAll('.fountain-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        // Short delay for selection feedback
        setTimeout(() => this.showScreen('screen-coin-select'), 300);
      });
    });

    // Coin selection
    document.querySelectorAll('.coin-card').forEach(card => {
      card.addEventListener('click', () => {
        this.state.coinType = card.dataset.coin;
        document.querySelectorAll('.coin-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        setTimeout(() => this.startTossScreen(), 300);
      });
    });

    // Toss screen retry / back
    document.getElementById('btn-toss-retry').addEventListener('click', () => {
      this.handDetector.resetToss();
    });

    document.getElementById('btn-toss-back').addEventListener('click', () => {
      this.handDetector.stop();
      this.showScreen('screen-coin-select');
    });

    // Result screen buttons
    document.getElementById('btn-toss-again').addEventListener('click', () => {
      this.showScreen('screen-coin-select');
    });

    document.getElementById('btn-view-fountain').addEventListener('click', () => {
      this.showFountainView();
    });

    document.getElementById('btn-home').addEventListener('click', () => {
      this.resetState();
      this.showScreen('screen-landing');
    });

    // Fountain view back
    document.getElementById('btn-fountain-back').addEventListener('click', () => {
      if (this.fountainRenderer) {
        this.fountainRenderer.stopAnimation();
      }
      this.showScreen('screen-landing');
    });

    // View coins buttons on landing
    document.getElementById('btn-view-trevi')?.addEventListener('click', () => {
      this.state.fountain = 'trevi';
      this.showFountainView();
    });

    document.getElementById('btn-view-palseokdam')?.addEventListener('click', () => {
      this.state.fountain = 'palseokdam';
      this.showFountainView();
    });
  }

  showScreen(screenId) {
    Object.values(this.screens).forEach(el => {
      el.classList.remove('active');
    });

    const target = this.screens[screenId];
    if (target) {
      // Small delay for transition
      requestAnimationFrame(() => {
        target.classList.add('active');
      });
    }

    // Update fountain coin counts if on fountain select
    if (screenId === 'screen-fountain-select') {
      this.updateFountainCounts();
    }
  }

  async updateFountainCounts() {
    const treviCoins = await getCoins('trevi');
    const palseokdamCoins = await getCoins('palseokdam');

    const treviCount = document.querySelector('[data-fountain="trevi"] .coin-count');
    const palseokdamCount = document.querySelector('[data-fountain="palseokdam"] .coin-count');

    if (treviCount) treviCount.textContent = `${treviCoins.length} coin${treviCoins.length !== 1 ? 's' : ''} tossed`;
    if (palseokdamCount) palseokdamCount.textContent = `${palseokdamCoins.length} coin${palseokdamCoins.length !== 1 ? 's' : ''} tossed`;
  }

  async startTossScreen() {
    this.showScreen('screen-toss');

    const video = document.getElementById('toss-video');
    const handCanvas = document.getElementById('toss-hand-canvas');
    const fountainBg = document.getElementById('toss-fountain-bg');
    const statusEl = document.getElementById('toss-status');

    // Set fountain background image
    fountainBg.src = `/assets/fountains/${this.state.fountain}.png`;

    // Status updates
    this.handDetector.onStatusChange = (status) => {
      const messages = {
        loading: '⏳ Loading hand detection...',
        no_hand: '✋ Show your hand to the camera',
        hand_detected: '👆 Move your hand UP to toss!',
        tossing: '🎯 Tossing!',
        error: '❌ Camera access denied. Please allow camera access.'
      };
      statusEl.textContent = messages[status] || status;
      statusEl.className = 'toss-status status-' + status;
    };

    // Toss handler
    this.handDetector.onToss = async (power, handX, handY) => {
      await this.handleToss(power, handX, handY);
    };

    // Initialize hand detector with draw canvas and coin type
    const success = await this.handDetector.init(video, handCanvas, this.state.coinType);
    if (!success) {
      statusEl.textContent = '❌ Could not start camera. Please check permissions.';
    }
  }

  async handleToss(power, handX, handY) {
    // Stop hand detection
    this.handDetector.stop();

    // Switch to result screen with animation overlay
    this.showScreen('screen-result');

    const animContainer = document.getElementById('result-animation-container');
    const resultCanvas = document.getElementById('result-fountain-canvas');

    // Init fountain renderer on result canvas
    this.fountainRenderer = new FountainRenderer('result-fountain-canvas');
    await this.fountainRenderer.loadFountain(this.state.fountain);

    // Animate coin toss
    this.coinTossAnimation = new CoinTossAnimation(animContainer);
    const landingPos = await this.coinTossAnimation.animate(
      this.state.coinType,
      power,
      0.5,  // start from center top
      0.1
    );

    // Save coin if actual mode
    if (this.state.mode === 'actual') {
      const coinData = {
        fountain: this.state.fountain,
        coinType: this.state.coinType,
        x: landingPos.x,
        y: landingPos.y,
        nickname: this.state.nickname,
        wish: this.state.wish,
        wishVisible: this.state.wishVisible
      };
      await saveCoin(coinData);

      // Reload coins and animate splash
      this.fountainRenderer.coins = await getCoins(this.state.fountain);
      const newCoin = this.fountainRenderer.coins[this.fountainRenderer.coins.length - 1];
      this.fountainRenderer.animateSplash(newCoin);
    } else {
      // Practice mode — still show it but don't save
      const tempCoin = {
        coinType: this.state.coinType,
        x: landingPos.x,
        y: landingPos.y,
        nickname: 'Practice',
        wish: '',
        wishVisible: false,
        date: new Date().toISOString()
      };
      this.fountainRenderer.addCoinWithAnimation(tempCoin);
    }

    // Update result info
    const resultInfo = document.getElementById('result-info');
    if (this.state.mode === 'actual') {
      resultInfo.innerHTML = `
        <h3>🌟 Your wish has been cast!</h3>
        <p><strong>${this.state.nickname}</strong> tossed a <strong>${getCoinLabel(this.state.coinType)}</strong> into <strong>${getFountainLabel(this.state.fountain)}</strong></p>
        ${this.state.wishVisible && this.state.wish ? `<p class="wish-text">"${this.state.wish}"</p>` : '<p class="wish-text">Your wish is a secret ✨</p>'}
      `;
    } else {
      resultInfo.innerHTML = `
        <h3>🎯 Nice toss!</h3>
        <p>Practice throw into <strong>${getFountainLabel(this.state.fountain)}</strong></p>
        <p class="wish-text">Try the real thing to save your wish!</p>
      `;
    }

    // --- AI SPIRIT RESPONSE ---
    const spiritContainer = document.getElementById('spirit-response-container');
    const spiritText = document.getElementById('spirit-text');

    if (this.state.mode === 'actual') {
      spiritContainer.classList.remove('hidden');
      spiritContainer.classList.add('loading');
      spiritText.innerHTML = '✨ <span class="loading-dots">The spirit is contemplating your wish...</span>';

      try {
        const spiritMessage = await generateSpiritResponse(
          this.state.nickname,
          this.state.wish,
          this.state.coinType,
          this.state.fountain
        );
        
        spiritContainer.classList.remove('loading');
        // Simple typing effect or direct show
        this.typeMessage(spiritText, spiritMessage);
      } catch (err) {
        spiritContainer.classList.remove('loading');
        spiritText.textContent = "The fountain ripples in agreement. Your wish has been cast into the flow of time.";
      }
    } else {
      spiritContainer.classList.add('hidden');
    }

    this.fountainRenderer.startAnimation();
  }

  async showFountainView() {
    this.showScreen('screen-fountain-view');

    // Update title
    document.getElementById('fountain-view-title').textContent = getFountainLabel(this.state.fountain);

    this.fountainRenderer = new FountainRenderer('fountain-view-canvas');
    await this.fountainRenderer.loadFountain(this.state.fountain);
    this.fountainRenderer.startAnimation();

    // Update coin count
    const coins = await getCoins(this.state.fountain);
    document.getElementById('fountain-view-count').textContent =
      `${coins.length} wish${coins.length !== 1 ? 'es' : ''} made here`;
  }

  resetState() {
    this.state = {
      mode: null,
      fountain: null,
      coinType: null,
      nickname: '',
      wish: '',
      wishVisible: true
    };

    if (this.fountainRenderer) {
      this.fountainRenderer.stopAnimation();
    }
    this.handDetector.stop();
  }

  initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    // Create floating particle elements
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (6 + Math.random() * 8) + 's';
      particle.style.opacity = 0.1 + Math.random() * 0.3;
      particle.style.width = particle.style.height = (4 + Math.random() * 8) + 'px';
      container.appendChild(particle);
    }
  }

  typeMessage(element, message, speed = 30) {
    element.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      if (i < message.length) {
        element.textContent += message.charAt(i);
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
  }
}

function getCoinLabel(type) {
  const labels = { us: 'US Quarter', euro: '1 Euro', won: '100 Won' };
  return labels[type] || type;
}

function getFountainLabel(name) {
  const labels = {
    trevi: 'Trevi Fountain',
    palseokdam: 'Palseokdam Basin'
  };
  return labels[name] || name;
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
