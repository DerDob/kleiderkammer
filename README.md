# Kleiderkammer
Simple clothing management (Kleiderkammer) software for i.e. a youth fire brigades (Jugendfeuerwehr).

## Architecture
![Software architecture](arch.png)

## Development

The project consists of two main components:

- `backend/`: Node.js + TypeScript (Express) Server
  - Serves static frontend files from `backend/public`
  - REST API under `/api/*`
- `frontend/`: React + Vite + TypeScript App
  - Builds to `backend/public`
  - Dev mode: automatic rebuild on changes

### Initial Setup

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Start Development Server

Run in the `backend` directory:

```bash
cd backend  # if not already in backend/
npm run dev
```

This starts:
- Backend server on http://localhost:3000 (with hot-reload)
- Frontend build in watch mode (rebuilds to `backend/public` on changes)

### Debugging

#### Backend Debugging
1. Open VS Code Debug tab
2. Select "Attach to Backend"
3. Press F5 to start debugging

Note: Backend server must be running with `npm run dev`.

#### Frontend Debugging
1. Open Chrome DevTools (F12)
2. Source maps are automatically enabled
3. Set breakpoints in `.tsx`/`.ts` files

### API Test Endpoints

- Backend Health: http://localhost:3000/api/health
  ```bash
  curl http://localhost:3000/api/health
  # Expected: {"status":"ok"}
  ```
