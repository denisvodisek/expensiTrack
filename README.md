# ExpensiTrak

A production-ready expense tracking application built with React and TypeScript.

## Features

- Track income and expenses
- Manage credit cards
- Set financial goals
- Track assets and net worth
- Privacy mode
- Dark/Light theme support
- **Export/Import all data to JSON** for backup
- **PWA Support** - Install on your phone and use offline

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Storage**: Browser localStorage (with JSON export)
- **Charts**: Recharts

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup

1. **Clone the repository**:
   ```bash
   git clone git@github.com:denisvodisek/expensiTrack.git
   cd expensitrak
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional, for login credentials):
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and set your values:
   ```
   USERNAME=your_username
   PASSWORD=your_password
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the application**:
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

## Data Storage

All data is stored in the browser's localStorage:
- Transactions
- Categories
- Credit cards
- Goals
- Assets
- Settings

**Export your data**: Go to Profile → Settings → "Export All Data (JSON)" to download a backup of all your data.

**Import your data**: Use "Import Data (JSON)" to restore from a backup.

## PWA Installation

The app is configured as a Progressive Web App (PWA) and can be installed on mobile devices.

### On Mobile (iOS/Android):

- **iOS Safari**: Tap Share → "Add to Home Screen"
- **Android Chrome**: Tap Menu → "Install App" or "Add to Home Screen"
- The app will work offline and appear like a native app!

### Testing Locally:

1. Build the app: `npm run build`
2. Serve it: `npm run preview` (or use a local server)
3. Open in mobile browser or Chrome DevTools mobile emulator
4. Check DevTools → Application → Manifest for PWA status

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git remote add origin git@github.com:denisvodisek/expensiTrack.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard:
     - `USERNAME` (optional, defaults to 'admin')
     - `PASSWORD` (optional, defaults to 'password')
     - `GEMINI_API_KEY` (if using Gemini features)
   - Click "Deploy"

   Vercel will automatically detect Vite and deploy your app!

### Manual Build

Build the frontend:
```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
expensitrak/
├── components/          # React components
├── contexts/           # React contexts (Auth, App)
├── services/           # API service layer (localStorage)
├── .env                # Environment variables (not in git)
├── .env.example        # Example environment variables
├── vercel.json         # Vercel deployment config
└── package.json        # Dependencies and scripts
```

## License

Private project
