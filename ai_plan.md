# Implementation Plan - Gemini API & Responsive Design (Vercel Deployment)

This plan outlines the integration of Gemini AI to provide mystical feedback for user wishes and improvements to ensure the website works beautifully on all devices. To securely manage the Gemini API key, we will transition to a **Vite-based build system** for deployment on Vercel.

## User Review Required

> [!IMPORTANT]
> **Environment Variables**: We will use Vercel Environment Variables. This requires adding a build step (Vite) to the project. The API key will be accessed via `import.meta.env.VITE_GEMINI_API_KEY`.

> [!TIP]
> **Build System**: I have initialized a `package.json` and set up Vite. You will need to add `VITE_GEMINI_API_KEY` to your Vercel project settings.

## Proposed Changes

### 1. Build System & Gemini AI Integration

#### [NEW] [package.json](file:///Users/yoonjae_joung/Library/Mobile%20Documents/com~apple~CloudDocs/1.%20Study/School/KAIST/NYU%20Minor/Spring%20Course/ai%20tools/InClassActivity/mark-making-coin-toss/package.json)
- Initialized a basic project with Vite scripts.

#### [NEW] [gemini.js](file:///Users/yoonjae_joung/Library/Mobile%20Documents/com~apple~CloudDocs/1.%20Study/School/KAIST/NYU%20Minor/Spring%20Course/ai%20tools/InClassActivity/mark-making-coin-toss/js/gemini.js)
- Implemented a wrapper for the Gemini API using `fetch`.
- Uses `import.meta.env.VITE_GEMINI_API_KEY` for authentication.
- Function `generateSpiritResponse(nickname, wish, coinType, fountain)` to call Gemini 1.5 Flash.

#### [MODIFY] [index.html](file:///Users/yoonjae_joung/Library/Mobile%20Documents/com~apple~CloudDocs/1.%20Study/School/KAIST/NYU%20Minor/Spring%20Course/ai%20tools/InClassActivity/mark-making-coin-toss/index.html)
- Added a placeholder for the AI response in the `#screen-result`.

#### [MODIFY] [app.js](file:///Users/yoonjae_joung/Library/Mobile%20Documents/com~apple~CloudDocs/1.%20Study/School/KAIST/NYU%20Minor/Spring%20Course/ai%20tools/InClassActivity/mark-making-coin-toss/js/app.js)
- Integrated the Gemini service into the `handleToss` workflow.
- Display the AI response once received with a typewriter effect.

---

### 2. Responsive UI Enhancements

#### [MODIFY] [style.css](file:///Users/yoonjae_joung/Library/Mobile%20Documents/com~apple~CloudDocs/1.%20Study/School/KAIST/NYU%20Minor/Spring%20Course/ai%20tools/InClassActivity/mark-making-coin-toss/css/style.css)
- Refactored `.selection-grid` for better auto-wrapping on mobile.
- Optimized `.toss-pip` (webcam) size and layout for vertical screens.
- Ensured the "Spirit Response" box is beautifully styled with glassmorphism and subtle animations.

---

### 3. Documentation & Setup

#### [MODIFY] [README.md](file:///Users/yoonjae_joung/Library/Mobile%20Documents/com~apple~CloudDocs/1.%20Study/School/KAIST/NYU%20Minor/Spring%20Course/ai%20tools/InClassActivity/mark-making-coin-toss/README.md)
- Added instructions for Gemini API setup and Vercel deployment.
