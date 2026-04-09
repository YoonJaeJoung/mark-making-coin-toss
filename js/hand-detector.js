// hand-detector.js — MediaPipe Hand Landmarker wrapper
// Draws a SCALED-DOWN hand skeleton on fountain canvas with coin at index fingertip.
// Detects toss via finger movement (not just wrist).

export class HandDetector {
  constructor() {
    this.handLandmarker = null;
    this.video = null;
    this.drawCanvas = null;
    this.drawCtx = null;
    this.isRunning = false;
    this.lastFingerPos = null;  // {x, y} of avg fingertips
    this.lastWristPos = null;   // {x, y} of wrist
    this.lastTime = 0;
    this.velocityHistory = [];
    this.onStatusChange = null;
    this.onToss = null;
    this.tossTriggered = false;
    this.status = 'loading';
    this._animFrame = null;
    this.coinImage = null;
    this.coinType = null;

    // Scale the hand skeleton to ~40% of canvas size, centered at hand position
    this.handScale = 0.4;
  }

  async init(videoElement, drawCanvas, coinType) {
    this.video = videoElement;
    this.drawCanvas = drawCanvas;
    this.drawCtx = drawCanvas.getContext('2d');
    this.coinType = coinType;

    this.coinImage = new Image();
    this.coinImage.src = `/assets/coins/${coinType}_front.png`;

    this.setStatus('loading');

    try {
      const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs');
      const { HandLandmarker, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      this.video.srcObject = stream;

      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });

      this.resizeDrawCanvas();
      this._resizeHandler = () => this.resizeDrawCanvas();
      window.addEventListener('resize', this._resizeHandler);

      this.isRunning = true;
      this.tossTriggered = false;
      this.setStatus('no_hand');
      this.detect();

      return true;
    } catch (err) {
      console.error('Hand detector init failed:', err);
      this.setStatus('error');
      return false;
    }
  }

  resizeDrawCanvas() {
    const container = this.drawCanvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.drawCanvas.width = rect.width * dpr;
    this.drawCanvas.height = rect.height * dpr;
    this.drawCanvas.style.width = rect.width + 'px';
    this.drawCanvas.style.height = rect.height + 'px';
    this.drawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._displayWidth = rect.width;
    this._displayHeight = rect.height;
  }

  detect() {
    if (!this.isRunning) return;
    
    try {
      const now = performance.now();
      
      // Ensure strictly increasing timestamp for MediaPipe
      if (now <= this.lastTime) {
        this._animFrame = requestAnimationFrame(() => this.detect());
        return;
      }

      if (this.video.readyState >= 2 && this.handLandmarker) {
        const results = this.handLandmarker.detectForVideo(this.video, now);
        
        // Wrap drawing and processing separately so one doesn't kill the other
        try {
          this.drawOnFountain(results);
        } catch (drawErr) {
          console.error('Hand drawing error:', drawErr);
        }

        try {
          this.processResults(results, now);
        } catch (procErr) {
          console.error('Hand processing error:', procErr);
        }
      }
    } catch (err) {
      console.error('Hand detection loop error:', err);
      // Don't stop the loop, just log and continue to next frame
    }
    
    this._animFrame = requestAnimationFrame(() => this.detect());
  }

  /**
   * Draw scaled-down hand wireframe + coin on the fountain overlay.
   * The hand is rendered at ~40% of canvas size, positioned based on the
   * wrist location but scaled smaller so the fountain remains visible.
   */
  drawOnFountain(results) {
    const ctx = this.drawCtx;
    const w = this._displayWidth;
    const h = this._displayHeight;

    ctx.clearRect(0, 0, w, h);

    if (!results.landmarks || results.landmarks.length === 0) return;

    const landmarks = results.landmarks[0];
    const scale = this.handScale;

    // Compute the center of the hand (average of all landmarks)
    let cx = 0, cy = 0;
    landmarks.forEach(lm => { cx += lm.x; cy += lm.y; });
    cx /= landmarks.length;
    cy /= landmarks.length;

    // Mirror X for natural feel
    cx = 1 - cx;

    // Map landmark to screen coords: scaled down around the hand center
    const mapX = (lm) => {
      const mirrored = 1 - lm.x;
      return ((mirrored - cx) * scale + cx) * w;
    };
    const mapY = (lm) => {
      return ((lm.y - cy) * scale + cy) * h;
    };

    // Hand connections
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17]
    ];

    // --- OUTER GLOW (wide, soft) ---
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 100, 255, 0.15)';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    connections.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(mapX(landmarks[a]), mapY(landmarks[a]));
      ctx.lineTo(mapX(landmarks[b]), mapY(landmarks[b]));
      ctx.stroke();
    });
    ctx.restore();

    // --- MID GLOW ---
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.3)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    connections.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(mapX(landmarks[a]), mapY(landmarks[a]));
      ctx.lineTo(mapX(landmarks[b]), mapY(landmarks[b]));
      ctx.stroke();
    });
    ctx.restore();

    // --- MAIN SKELETON LINES ---
    ctx.save();
    ctx.strokeStyle = '#00FFDD';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00FFDD';
    ctx.shadowBlur = 10;

    connections.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(mapX(landmarks[a]), mapY(landmarks[a]));
      ctx.lineTo(mapX(landmarks[b]), mapY(landmarks[b]));
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
    ctx.restore();

    // --- JOINT DOTS ---
    landmarks.forEach((lm, i) => {
      const x = mapX(lm);
      const y = mapY(lm);

      // Fingertips are bigger and brighter
      const isFingertip = [4, 8, 12, 16, 20].includes(i);
      const isWrist = i === 0;
      const radius = isFingertip ? 6 : (isWrist ? 7 : 3);

      // Glow ring on fingertips
      if (isFingertip) {
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = i === 8 ? 'rgba(255, 215, 0, 0.25)' : 'rgba(0, 255, 221, 0.15)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      if (i === 8) {
        ctx.fillStyle = '#FFD700'; // Index fingertip — gold
      } else if (isWrist) {
        ctx.fillStyle = '#FF4466'; // Wrist — red
      } else if (isFingertip) {
        ctx.fillStyle = '#00FFaa'; // Other fingertips — bright green
      } else {
        ctx.fillStyle = '#00DDCC'; // Joints — teal
      }
      ctx.fill();

      // White outline
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // --- COIN IN PALM (center of thumb tip(4), index MCP(5), middle MCP(9)) ---
    const thumbTip = landmarks[4];
    const indexMCP = landmarks[5];
    const middleMCP = landmarks[9];
    const coinCX = (mapX(thumbTip) + mapX(indexMCP) + mapX(middleMCP)) / 3;
    const coinCY = (mapY(thumbTip) + mapY(indexMCP) + mapY(middleMCP)) / 3;
    const coinSize = 38;

    if (this.coinImage && this.coinImage.complete) {
      ctx.save();
      const bobOffset = Math.sin(Date.now() / 300) * 2;

      // Glow behind coin
      ctx.beginPath();
      ctx.arc(coinCX, coinCY + bobOffset, coinSize / 2 + 8, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(coinCX, coinCY + bobOffset, coinSize / 4, coinCX, coinCY + bobOffset, coinSize / 2 + 8);
      glow.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
      glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fill();

      // Clip to circle and draw
      ctx.beginPath();
      ctx.arc(coinCX, coinCY + bobOffset, coinSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      ctx.drawImage(this.coinImage, coinCX - coinSize / 2, coinCY - coinSize / 2 + bobOffset, coinSize, coinSize);
      ctx.restore();

      // Gold border
      ctx.beginPath();
      ctx.arc(coinCX, coinCY + bobOffset, coinSize / 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.restore();
    }
  }

  /**
   * Process results for toss detection.
   * Detects a "snap/flick" gesture: fingers move rapidly while wrist stays relatively still.
   * This matches the real coin toss motion — wrist stays, fingers snap forward.
   */
  processResults(results, currentTime) {
    if (!results.landmarks || results.landmarks.length === 0) {
      this.setStatus('no_hand');
      this.lastFingerPos = null;
      this.lastWristPos = null;
      this.velocityHistory = [];
      return;
    }

    if (this.tossTriggered) return;

    const wrist = results.landmarks[0][0];
    const indexTip = results.landmarks[0][8];
    const middleTip = results.landmarks[0][12];

    // Average position of index + middle fingertips
    const fingerX = (indexTip.x + middleTip.x) / 2;
    const fingerY = (indexTip.y + middleTip.y) / 2;

    if (this.lastFingerPos !== null && this.lastTime > 0) {
      const deltaTime = (currentTime - this.lastTime) / 1000;
      if (deltaTime > 0 && deltaTime < 0.2) {
        // Finger displacement (magnitude — any direction)
        const fingerDx = fingerX - this.lastFingerPos.x;
        const fingerDy = fingerY - this.lastFingerPos.y;
        const fingerSpeed = Math.sqrt(fingerDx * fingerDx + fingerDy * fingerDy) / deltaTime;

        // Wrist displacement
        const wristDx = wrist.x - this.lastWristPos.x;
        const wristDy = wrist.y - this.lastWristPos.y;
        const wristSpeed = Math.sqrt(wristDx * wristDx + wristDy * wristDy) / deltaTime;

        // The "snap" ratio: how much faster fingers move vs wrist
        // A snap/flick has high finger speed + low wrist speed
        const relativeSpeed = fingerSpeed - wristSpeed;

        this.velocityHistory.push(relativeSpeed);
        if (this.velocityHistory.length > 6) {
          this.velocityHistory.shift();
        }

        // Check the peak velocity in recent frames (snap is brief)
        const peakVelocity = Math.max(...this.velocityHistory);
        const avgVelocity = this.velocityHistory.reduce((a, b) => a + b, 0) / this.velocityHistory.length;

        // Require: peak > 3.0, average > 1.5, and at least 3 frames of data
        if (peakVelocity > 3.0 && avgVelocity > 1.5 && this.velocityHistory.length >= 3) {
          this.tossTriggered = true;
          this.setStatus('tossing');
          if (this.onToss) {
            const power = Math.min(1, Math.max(0, (peakVelocity - 3.0) / 5));
            // Use center of palm grip as toss origin
            const thumb = results.landmarks[0][4];
            const idxMCP = results.landmarks[0][5];
            const midMCP = results.landmarks[0][9];
            const tossX = 1 - (thumb.x + idxMCP.x + midMCP.x) / 3;
            const tossY = (thumb.y + idxMCP.y + midMCP.y) / 3;
            this.onToss(power, tossX, tossY);
          }
        } else {
          this.setStatus('hand_detected');
        }
      }
    }

    this.lastFingerPos = { x: fingerX, y: fingerY };
    this.lastWristPos = { x: wrist.x, y: wrist.y };
    this.lastTime = currentTime;
  }

  setStatus(status) {
    if (this.status !== status) {
      this.status = status;
      if (this.onStatusChange) {
        this.onStatusChange(status);
      }
    }
  }

  resetToss() {
    this.tossTriggered = false;
    this.velocityHistory = [];
    this.lastFingerPos = null;
    this.lastWristPos = null;
    this.lastTime = 0;
    this.setStatus('no_hand');
  }

  stop() {
    this.isRunning = false;
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
    }
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
      this.video.srcObject = null;
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
  }
}
