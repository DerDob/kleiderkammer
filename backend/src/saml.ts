import { Strategy as SamlStrategy } from 'passport-saml';
import passport from 'passport';
import session from 'express-session';
import { readFileSync, existsSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { join } from 'path';
import { Application, CookieOptions, NextFunction, Request, Response } from 'express';

export interface SamlConfig {
  saml: {
    sp: {
      entityId: string;
      assertionConsumerService: string;
      privateKey: string;
      certificate: string;
    };
    idp: {
      entityId: string;
      ssoUrl: string;
      certificate: string;
    };
  };
  session: {
    secret: string;
    cookie: CookieOptions
  };
  server: {
    baseUrl: string;
    behindProxy: boolean;
  };
}

export interface SamlUser {
  id: string;
  nameID: string;
  nameIDFormat: string;
  email?: string;
  name?: string;
  groups?: string[];
}

// Load SAML config from YAML
const configPath = join(__dirname, '..', 'config', 'saml-config.yaml');
const config: SamlConfig = parseYaml(readFileSync(configPath, 'utf8'));

export function configureSaml(app: Application) {
  // Configure session middleware
  app.use(session({
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: config.session.cookie
  }));

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure SAML strategy
  function safeRead(p: string) {
    try {
      if (!p || !existsSync(p)) return undefined;
      return readFileSync(p, 'utf8');
    } catch (err) {
      return undefined;
    }
  }

  const spKey = safeRead(config.saml.sp.privateKey);
  const idpCert = safeRead(config.saml.idp.certificate);

  if (!spKey || !idpCert) {
    console.warn('SAML configuration incomplete or certificates missing - SAML disabled. Set correct paths in backend/config/saml-config.yaml or set environment variables.');
    // Provide a noop implementation so the rest of the app can run in dev without SAML
    return {
      ensureAuthenticated: (_req: Request, _res: Response, next: NextFunction) => next(),
      routes: {
        login: '/auth/login',
        loginHandler: (_req: Request, res: Response) => res.status(501).send('SAML not configured'),
        callback: '/saml/callback',
        callbackHandler: (_req: Request, res: Response) => res.status(501).send('SAML not configured'),
        metadata: '/saml/metadata',
        metadataHandler: (_req: Request, res: Response) => res.status(501).send('SAML not configured'),
        logout: '/auth/logout',
        logoutHandler: (_req: Request, res: Response) => res.status(501).send('SAML not configured')
      }
    };
  }

  const samlStrategy = new SamlStrategy(
    {
      callbackUrl: config.saml.sp.assertionConsumerService,
      entryPoint: config.saml.idp.ssoUrl,
      issuer: config.saml.sp.entityId,
      cert: idpCert as any,
      privateKey: spKey as any,
      decryptionPvk: spKey as any,
      signatureAlgorithm: 'sha256'
    },
    (profile: any, done: any) => {
      const user: SamlUser = {
        id: profile.nameID,
        nameID: profile.nameID,
        nameIDFormat: profile.nameIDFormat,
        email: profile.email,
        name: profile['urn:oid:2.5.4.42'],
        groups: profile['urn:oid:1.3.6.1.4.1.5923.1.5.1.1']
      };
      return done(null, user);
    }
  )
  passport.use(samlStrategy);

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  return {
    // Middleware to check if user is authenticated
    ensureAuthenticated: (req: Request, res: Response, next: NextFunction) => {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/auth/login');
    },

    // SAML routes
    routes: {
      // Initiate SAML login
      login: '/auth/login',
      loginHandler: passport.authenticate('saml', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true
      }),

      // SAML callback
      callback: '/saml/callback',
      callbackHandler: passport.authenticate('saml', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true
      }),

      // SAML metadata
      metadata: '/saml/metadata',
      metadataHandler: (req: Request, res: Response) => {
        const cert = safeRead(config.saml.sp.certificate);
        const metadata = samlStrategy.generateServiceProviderMetadata(cert as any, cert as any);
        res.type('application/xml');
        res.send(metadata);
      },

      // Logout
      logout: '/auth/logout',
      logoutHandler: (req: Request, res: Response) => {
        req.logout(() => {
          res.redirect('/');
        });
      }
    }
  };
}