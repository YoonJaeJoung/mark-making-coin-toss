// coin-toss.js — Coin flight animation and physics

export class CoinTossAnimation {
  constructor(container) {
    this.container = container;
    this.coinElement = null;
    this.onComplete = null;
  }

  /**
   * Animate a coin toss
   * @param {string} coinType - 'us', 'euro', or 'won'
   * @param {number} power - 0 to 1, how hard the toss was
   * @param {number} startX - normalized start X (0-1)
   * @param {number} startY - normalized start Y (0-1)
   * @returns {Promise<{x: number, y: number}>} normalized landing position
   */
  async animate(coinType, power, startX, startY) {
    return new Promise((resolve) => {
      const containerRect = this.container.getBoundingClientRect();
      const w = containerRect.width;
      const h = containerRect.height;

      // Create coin element
      this.coinElement = document.createElement('div');
      this.coinElement.className = 'flying-coin';
      this.coinElement.innerHTML = `
        <div class="coin-inner">
          <div class="coin-front">
            <img src="/assets/coins/${coinType}_front.png" alt="coin front">
          </div>
          <div class="coin-back">
            <img src="/assets/coins/${coinType}_back.png" alt="coin back">
          </div>
        </div>
      `;

      this.container.appendChild(this.coinElement);

      // Start position (where the hand was)
      const sx = startX * w;
      const sy = startY * h;

      // Landing position — further with more power
      // Land somewhere in the center 60% of the fountain
      const landingDistance = 0.2 + power * 0.4; // 0.2 to 0.6 from center
      const angle = Math.random() * Math.PI * 2;
      const landX = 0.5 + Math.cos(angle) * landingDistance * 0.3;
      const landY = 0.5 + Math.sin(angle) * landingDistance * 0.3;

      // Clamp to safe area
      const finalX = Math.max(0.15, Math.min(0.85, landX));
      const finalY = Math.max(0.15, Math.min(0.85, landY));

      const ex = finalX * w;
      const ey = finalY * h;

      // Animation parameters
      const duration = 1200 + power * 600; // 1.2s to 1.8s
      const maxHeight = 200 + power * 150; // arc height
      const spinCount = 3 + Math.floor(power * 5); // 3-8 spins

      const startTime = performance.now();

      const animateFrame = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for position
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Current position (linear interpolation)
        const cx = sx + (ex - sx) * easeProgress;
        // Arc: parabolic height
        const arcHeight = maxHeight * 4 * progress * (1 - progress);
        const cy = sy + (ey - sy) * easeProgress - arcHeight;

        // Scale: starts big (near camera), shrinks as it flies away
        const scale = 1.2 - 0.7 * easeProgress;

        // Spin
        const rotation = progress * spinCount * 360;

        // Apply transforms
        this.coinElement.style.left = cx + 'px';
        this.coinElement.style.top = cy + 'px';
        this.coinElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
        this.coinElement.querySelector('.coin-inner').style.transform = `rotateX(${rotation}deg)`;

        // Opacity fade at end
        if (progress > 0.8) {
          this.coinElement.style.opacity = 1 - (progress - 0.8) / 0.2;
        }

        if (progress < 1) {
          requestAnimationFrame(animateFrame);
        } else {
          // Animation complete
          this.coinElement.remove();
          this.coinElement = null;
          resolve({ x: finalX, y: finalY });
        }
      };

      // Position initially
      this.coinElement.style.left = sx + 'px';
      this.coinElement.style.top = sy + 'px';

      requestAnimationFrame(animateFrame);
    });
  }

  cleanup() {
    if (this.coinElement) {
      this.coinElement.remove();
      this.coinElement = null;
    }
  }
}
