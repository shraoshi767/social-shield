# Social Shield AI

A YouTube anomaly detection dashboard with Firebase authentication, YouTube API ingestion, ML scoring, and Vercel serverless backend.

## What was added
- Firebase auth and Firestore storage for user scan history
- Reworked dashboard to scan YouTube search or channel content
- Serverless API at `api/anomaly.js` for video/comment analysis
- ML scoring with Isolation Forest, Random Forest, LOF, and LSTM
- Sentiment analysis and anomaly reasoning
- Vercel-ready configuration via `vercel.json`

## Setup
1. Copy `.env.example` to `.env.local` or add env variables in Vercel.
2. Set `YOUTUBE_API_KEY` to your YouTube API key.

## Local development
Install dependencies:
```bash
npm install
```

Run locally:
```bash
npm run dev
```

Open `http://localhost:3000` in your browser and use the login/signup pages. The dashboard will call `/api/anomaly` for real-time analysis.

## Deploy
1. Create a Vercel project from this repo.
2. Add `YOUTUBE_API_KEY` as a Vercel environment variable.
3. Deploy normally.

## Notes
- Firebase config is already wired into `firebase.js`.
- The app expects a local server or Vercel, not a file:// browser load.
- If you want, I can add support for Netlify functions next.
