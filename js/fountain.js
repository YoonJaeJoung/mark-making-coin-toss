// fountain.js — Renders the top-down fountain view with real coin images

import { getCoins } from './storage.js';

const COIN_DISPLAY_SIZE = 26;

// Cache for loaded coin images with load tracking
const coinImageCache = {};
const coinImageLoaded = {};

// Track active renderer for re-render on image load
let activeRenderer = null;

function loadCoinImage(coinType) {
  if (coinImageCache[coinType]) return coinImageCache[coinType];

  const img = new Image();
  coinImageLoaded[coinType] = false;

  img.onload = () => {
    coinImageLoaded[coinType] = true;
    // Re-render if there's an active renderer
    if (activeRenderer) {
      activeRenderer.render();
    }
  };

  img.src = `/assets/coins/${coinType}_front.png`;
  coinImageCache[coinType] = img;
  return img;
}

function isCoinImageReady(coinType) {
  return coinImageLoaded[coinType] === true;
}

// Preload all coin images
['us', 'euro', 'won'].forEach(type => loadCoinImage(type));

export class FountainRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.fountainName = '';
    this.fountainImage = null;
    this.coins = [];
    this.hoveredCoin = null;
    this.tooltip = document.getElementById('coin-tooltip');

    // Register this renderer so coin images trigger re-render on load
    activeRenderer = this;

    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    this.render();
  }

  async loadFountain(fountainName) {
    this.fountainName = fountainName;
    const imgSrc = `/assets/fountains/${fountainName}.png`;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        this.fountainImage = img;
        this.coins = await getCoins(fountainName);
        this.render();
        resolve();
      };
      img.onerror = () => {
        this.fountainImage = null;
        this.render();
        resolve();
      };
      img.src = imgSrc;
    });
  }

  render() {
    const ctx = this.ctx;
    const w = this.displayWidth;
    const h = this.displayHeight;

    ctx.clearRect(0, 0, w, h);

    // Draw fountain image
    if (this.fountainImage) {
      const imgRatio = this.fountainImage.width / this.fountainImage.height;
      const canvasRatio = w / h;
      let drawW, drawH, drawX, drawY;

      if (canvasRatio > imgRatio) {
        drawW = w;
        drawH = w / imgRatio;
        drawX = 0;
        drawY = (h - drawH) / 2;
      } else {
        drawH = h;
        drawW = h * imgRatio;
        drawX = (w - drawW) / 2;
        drawY = 0;
      }

      ctx.drawImage(this.fountainImage, drawX, drawY, drawW, drawH);
    } else {
      const grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, Math.max(w,h)/2);
      grad.addColorStop(0, '#1a8a9e');
      grad.addColorStop(0.6, '#0e5f6e');
      grad.addColorStop(1, '#0a3d47');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // Draw water shimmer overlay
    this.drawWaterEffect(ctx, w, h);

    // Draw coins with real images
    this.coins.forEach((coin, index) => {
      this.drawCoin(ctx, coin, w, h, index === this.hoveredCoin);
    });
  }

  drawWaterEffect(ctx, w, h) {
    const time = Date.now() / 2000;
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 8; i++) {
      const x = (Math.sin(time + i * 0.7) * 0.5 + 0.5) * w;
      const y = (Math.cos(time + i * 0.9) * 0.5 + 0.5) * h;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 80);
      grad.addColorStop(0, 'rgba(255,255,255,0.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  drawCoin(ctx, coin, canvasW, canvasH, isHovered) {
    const x = coin.x * canvasW;
    const y = coin.y * canvasH;
    const size = isHovered ? COIN_DISPLAY_SIZE + 6 : COIN_DISPLAY_SIZE;

    ctx.save();

    // Shadow under coin
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 2, size / 2, size / 2.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    // Get the coin image
    const coinImg = loadCoinImage(coin.coinType);

    if (isCoinImageReady(coin.coinType)) {
      // Clip to circle and draw the actual coin image
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(coinImg, x - size / 2, y - size / 2, size, size);
      ctx.restore();
    } else {
      // Fallback: colored circle if image not loaded yet
      const COIN_COLORS = { us: '#C0C0C0', euro: '#DAA520', won: '#CD7F32' };
      const color = COIN_COLORS[coin.coinType] || '#C0C0C0';
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Coin edge ring
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Highlight on hover
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(x, y, size / 2 + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  addCoinWithAnimation(coinData) {
    this.coins.push(coinData);
    this.animateSplash(coinData);
  }

  animateSplash(coin) {
    const startTime = Date.now();
    const duration = 800;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      this.render();

      const ctx = this.ctx;
      const x = coin.x * this.displayWidth;
      const y = coin.y * this.displayHeight;

      ctx.save();
      for (let i = 0; i < 3; i++) {
        const rippleProgress = Math.min(1, progress + i * 0.15);
        const radius = rippleProgress * 40;
        const alpha = (1 - rippleProgress) * 0.5;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found = -1;
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      const cx = coin.x * this.displayWidth;
      const cy = coin.y * this.displayHeight;
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      if (dist < COIN_DISPLAY_SIZE) {
        found = i;
        break;
      }
    }

    if (found !== this.hoveredCoin) {
      this.hoveredCoin = found;
      this.render();

      if (found >= 0) {
        this.showTooltip(e, this.coins[found]);
        this.canvas.style.cursor = 'pointer';
      } else {
        this.hideTooltip();
        this.canvas.style.cursor = 'default';
      }
    } else if (found >= 0) {
      this.moveTooltip(e);
    }
  }

  handleClick(e) {
    if (this.hoveredCoin >= 0) {
      const coin = this.coins[this.hoveredCoin];
      this.showTooltip(e, coin, true);
    }
  }

  showTooltip(e, coin, sticky = false) {
    if (!this.tooltip) return;
    let html = `<strong>${coin.nickname || 'Anonymous'}</strong>`;
    html += `<br><span class="tooltip-coin-type">${getCoinLabel(coin.coinType)}</span>`;
    html += `<br><span class="tooltip-date">${new Date(coin.date).toLocaleDateString()}</span>`;
    if (coin.wishVisible && coin.wish) {
      html += `<br><em class="tooltip-wish">"${coin.wish}"</em>`;
    }
    this.tooltip.innerHTML = html;
    this.tooltip.classList.add('visible');
    this.moveTooltip(e);
  }

  moveTooltip(e) {
    if (!this.tooltip) return;
    this.tooltip.style.left = (e.clientX + 15) + 'px';
    this.tooltip.style.top = (e.clientY - 10) + 'px';
  }

  hideTooltip() {
    if (!this.tooltip) return;
    this.tooltip.classList.remove('visible');
  }

  startAnimation() {
    const loop = () => {
      this.render();
      this._animFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  stopAnimation() {
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
    }
  }
}

function getCoinLabel(type) {
  const labels = { us: 'US Quarter', euro: '1 Euro', won: '100 Won' };
  return labels[type] || type;
}
