# Fountain Wish — Mark Making Coin Toss 🪙

An interactive website where users toss virtual coins into famous fountains and make wishes, using webcam hand detection to detect the toss gesture.

This is a project for the joint class at NYU IDM from professors Tommy and Claire. The topic is mark-making / drawing tools, and this project explores the idea of tourists tossing coins into fountains as a form of mark-making.

## ✨ Gemini AI Integration

This project is now powered by **Gemini 3 Flash** to provide mystical feedback for your wishes. Each fountain has its own unique "Spirit" with a distinct personality and cultural tone.

### Deployment on Vercel

1. **Clone the repository** to your GitHub.
2. **Deploy to Vercel**: Connect your repository to Vercel.
3. **Environment Variables**: In your Vercel project settings, add the following environment variable:
   - `VITE_GEMINI_API_KEY`: Your Google AI Studio API Key.
4. **Build Settings**: Vercel should automatically detect the Vite project. If not, use:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## 📱 Responsive Experience

The website has been optimized for all screen sizes:
- **Mobile**: Vertical layout with optimized webcam PIP and touch-friendly selection grids.
- **Glassmorphism UI**: Beautiful, translucent interface elements that feel premium and modern.
- **Hand Gesture Detection**: Works across devices with webcam access.

## Features

- **Practice Mode** — Choose a fountain and coin, toss freely without saving data
- **Actual Wish Mode** — Enter your nickname and wish, then toss to save your coin permanently
- **Webcam Hand Detection** — Uses MediaPipe Hand Landmarker to detect your hand and toss gesture
- **Coin Flight Animation** — Realistic coin arc with 3D spin (front/back faces), speed-dependent distance
- **Two Fountains** — Trevi Fountain (Rome) and Palseokdam Basin (Cheonggyecheon Stream, Seoul)
- **Three Coins** — US Quarter, 1 Euro, 100 Korean Won
- **Fountain View** — See all previously tossed coins on a top-down fountain canvas, hover to see wishes

## Tech Stack

- **Vanilla HTML / CSS / JavaScript** (ES Modules)
- **MediaPipe Tasks Vision** — Hand landmark detection via CDN
- **Canvas API** — Fountain rendering with coins
- **localStorage** — Coin data persistence

## How to Run Locally

```bash
# Serve with any static server (HTTPS or localhost required for webcam)
python3 -m http.server 8080
# Then open http://localhost:8080
```

## How to Use

1. Choose **Practice Toss** or **Make a Real Wish**
2. If making a wish, enter your nickname and wish text
3. Select a fountain (Trevi Fountain or Palseokdam Basin)
4. Choose your coin (US Quarter, Euro, or 100 Won)
5. Allow camera access — show your hand to the webcam
6. **Move your hand upward quickly** to toss the coin!
7. The faster you move, the further the coin flies into the fountain

## Deployment

This project is designed for **GitHub Pages**. Simply push to a GitHub repository and enable Pages in the repo settings.

## File Structure

```
├── index.html              # Single-page app
├── css/style.css           # Design system & styles
├── js/
│   ├── app.js              # Main app controller
│   ├── hand-detector.js    # MediaPipe hand detection
│   ├── coin-toss.js        # Coin flight animation
│   ├── fountain.js         # Fountain canvas renderer
│   └── storage.js          # localStorage persistence
├── assets/
│   ├── coins/              # Coin images (front & back)
│   └── fountains/          # Fountain illustrations
├── prompt.md               # Original project prompt
└── README.md
```

## Data Storage

Currently uses **localStorage** — each user's coins are stored locally in their browser. A shared backend (e.g., Firebase) could be added in the future to let all visitors see each other's coins.
