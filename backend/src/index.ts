import express from 'express';
import path from 'path';
import { configureSaml } from './saml';

const app = express();
const port = process.env.PORT || 3000;

// Configure SAML authentication
const saml = configureSaml(app);

// public directory is ../public from compiled code location
const publicDir = path.resolve(__dirname, '..', 'public');

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

// SPA fallback: send index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server listening on ${port}, serving ${publicDir}`);
  console.log(`SAML metadata available at: http://localhost:${port}/saml/metadata`);
});
