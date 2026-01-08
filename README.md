# Frontend

React + TypeScript + Vite frontend for TrueShot Odds arbitrage betting platform.

## Quick Start

### Prerequisites
- Node.js 18+
- npm or other package manager
- Firebase project (for authentication)
- Backend API running

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   ```bash
   # Add your Firebase config to src/config/firebase.ts
   # You'll need: apiKey, authDomain, projectId, etc.
   ```

### Configuration

**Firebase Setup** (`src/config/firebase.ts`):
- Configure Firebase Authentication
- Enable Email/Password and Google providers
- Add your Firebase project credentials

**Stripe Setup** (`src/config/stripe.ts`):
- Add your Stripe publishable key
- Configure for test or production mode

**API Connection**:
- Backend API URL is configured in `src/services/api.ts`
- Default: `http://localhost:8000` for local development

### Running the Frontend

**Local development**:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Build for production**:
```bash
npm run build
```

**Preview production build**:
```bash
npm run preview
```

## Development

### Setting up Git Hooks

This project uses Husky + lint-staged for pre-commit linting:

```bash
# Hooks are automatically installed via the prepare script
npm install

# Manually trigger if needed
npm run prepare
```

Now ESLint will automatically check your code on every commit. Only staged TypeScript/TSX files are linted (fast!).

### Project Structure

```
frontend/
├── public/
│   └── sportsbook_icons/     # Sportsbook logo images
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── AuthModal.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── config/
│   │   ├── firebase.ts       # Firebase initialization
│   │   └── stripe.ts         # Stripe configuration
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.tsx   # Authentication state
│   │   ├── DataContext.tsx   # Arbitrage & charts data
│   │   ├── StripeContext.tsx # Subscription state
│   │   └── ParticlesContext.tsx
│   ├── pages/                # Route components
│   │   ├── Home.tsx          # Landing page
│   │   ├── Dashboard.tsx     # Arbitrage opportunities
│   │   ├── Charts.tsx        # Odds line tracking
│   │   ├── Subscription.tsx  # Pricing & billing
│   │   └── NotFound.tsx
│   ├── services/
│   │   └── api.ts            # Backend API client
│   ├── App.tsx               # Main app component with routing
│   └── main.tsx              # Entry point
├── .husky/                   # Git hooks (Husky)
│   └── pre-commit            # Runs lint-staged
├── eslint.config.js          # ESLint configuration
├── vite.config.ts            # Vite build configuration
├── package.json
└── README.md
```

## Architecture

### Key Features

**Authentication (Firebase)**
- Email/password authentication
- Google OAuth
- Email verification
- Password reset
- Protected routes

**Subscription Management (Stripe)**
- Free tier: Limited arbitrage opportunities, 60-second updates
- Premium tier: Unlimited opportunities, real-time updates (5 seconds)
- Stripe Checkout integration
- Customer portal for subscription management

**Real-Time Data**
- Server-Sent Events (SSE) for live updates
- Automatic fallback to polling if SSE fails
- Persistent data caching across route navigation
- DataContext manages arbitrage and charts data globally

**Data Context Pattern**
- Centralized data fetching in `DataContext`
- Data persists across navigation (no re-fetch when returning to pages)
- SSE connections managed at app level
- Only fetches data when on relevant pages

### Routing

React Router v7 with the following routes:
- `/` - Home/landing page
- `/dashboard` - Arbitrage opportunities (protected)
- `/charts` - Odds line tracking (protected)
- `/pricing` - Subscription plans
- `/subscription` - Alias for pricing
- `*` - 404 Not Found

### State Management

**Contexts:**
- `AuthContext` - User authentication state, tier (free/premium)
- `DataContext` - Arbitrage data, charts data, filters
- `StripeContext` - Subscription info, product pricing
- `ParticlesContext` - Background animation initialization

### Styling

- **Tailwind CSS v4** - Utility-first CSS framework
- **@tailwindcss/vite** - Vite plugin for Tailwind
- Custom color palette and responsive design
- Dark theme optimized for betting data visibility

### Performance Optimizations

- **React Compiler** (experimental) - Automatic memoization
- **Vite** - Fast HMR and optimized production builds
- **Code splitting** - Route-based lazy loading
- **lint-staged** - Only lint changed files
- **Data persistence** - Cache data across navigation

## Code Quality

### Linting
```bash
# Run ESLint
npm run lint

# Lint runs automatically on git commit via Husky
```

### TypeScript
- Strict mode enabled
- Full type coverage across components and contexts
- Separate configs for app and node code

## Common Issues

**Firebase errors**: Ensure you've added your Firebase config and enabled authentication providers in Firebase Console

**CORS errors**: Check that backend API is running and CORS is configured to allow your frontend origin

**SSE not working**: Falls back to polling automatically. Check browser console for SSE connection errors

**Stripe checkout fails**: Verify Stripe publishable key matches your account mode (test/production)

## Production Deployment

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Serve the `dist/` directory with a static file server

3. Configure environment:
   - Update Firebase config for production
   - Update Stripe keys for production
   - Ensure backend API URL points to production

4. Enable proper error tracking and analytics

## Additional Resources

- [Vite Documentation](https://vite.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)