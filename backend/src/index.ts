import express from 'express';
import path from 'path';
import { configureSaml } from './saml';
import store from './store';
import { json as bodyJson } from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Configure SAML authentication
const saml = configureSaml(app);

// public directory is ../public from compiled code location
const publicDir = path.resolve(__dirname, '..', 'public');

// Parse JSON bodies
app.use(bodyJson());

// Serve static files
app.use(express.static(publicDir));

// SAML routes
app.get(saml.routes.login, saml.routes.loginHandler);
app.post(saml.routes.callback, saml.routes.callbackHandler);
app.get(saml.routes.metadata, saml.routes.metadataHandler);
app.get(saml.routes.logout, saml.routes.logoutHandler);

// Protected API routes
app.get('/api/health', saml.ensureAuthenticated, (_req, res) => {
  res.json({ status: 'ok' });
});

// Users (fetched from IdP) - admin only
app.get('/api/users', saml.ensureAuthenticated, (req, res) => {
  const user = store.getCurrentUser(req);
  if (!user || !store.isAdmin(user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  res.json(store.getUsers());
});

// Clothing endpoints - read public, manage admin only
app.get('/api/clothing', saml.ensureAuthenticated, (_req, res) => {
  res.json(store.getClothing());
});

app.post('/api/clothing', saml.ensureAuthenticated, async (req, res) => {
  const user = store.getCurrentUser(req);
  if (!user || !store.canManageClothing(user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { clothing: name, size, count } = req.body;
    if (!name || !size || typeof count !== 'number') return res.status(400).json({ error: 'invalid payload' });
    const item = await store.addClothing({ clothing: name, size, count });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lendings - admins see all, users see own
app.get('/api/lendings', saml.ensureAuthenticated, (req, res) => {
  const user = store.getCurrentUser(req);
  if (!user) return res.status(403).json({ error: 'Authentication required' });
  
  if (store.canViewAllLendings(user)) {
    return res.json(store.getLendings());
  }
  res.json(store.getUserLendings(user.email));
});

app.post('/api/lendings', saml.ensureAuthenticated, async (req, res) => {
  const user = store.getCurrentUser(req);
  if (!user || !store.isAdmin(user)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  try {
    const { clothingId, userEmail } = req.body;
    if (!clothingId || !userEmail) return res.status(400).json({ error: 'invalid payload' });
    const ln = await store.addLending(clothingId, userEmail);
    res.json(ln);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/lendings/:id/return', saml.ensureAuthenticated, async (req, res) => {
  const user = store.getCurrentUser(req);
  if (!user) return res.status(403).json({ error: 'Authentication required' });

  try {
    const id = req.params.id;
    const existing = store.getLendings().find(l => l.id === id);
    if (!existing) return res.status(404).json({ error: 'lending not found' });
    
    if (!store.canManageLending(user, existing)) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    const ln = await store.returnLending(id);
    res.json(ln);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// SPA fallback: send index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Initialize store (load persisted data and refresh users), then start server
store.initStore()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on ${port}, serving ${publicDir}`);
      console.log(`SAML metadata available at: http://localhost:${port}/saml/metadata`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize store:', err);
    // Start server anyway
    app.listen(port, () => {
      console.log(`Server listening on ${port}, serving ${publicDir}`);
      console.log(`SAML metadata available at: http://localhost:${port}/saml/metadata`);
    });
  });
