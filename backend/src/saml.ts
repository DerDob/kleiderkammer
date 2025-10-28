import { Strategy as SamlStrategy } from 'passport-saml';
import passport from 'passport';
import session from 'express-session';
import { readFileSync } from 'fs';
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
  const samlStrategy = new SamlStrategy(
    {
      callbackUrl: config.saml.sp.assertionConsumerService,
      entryPoint: config.saml.idp.ssoUrl,
      issuer: config.saml.sp.entityId,
      cert: readFileSync(config.saml.idp.certificate, 'utf8'),
      privateKey: readFileSync(config.saml.sp.privateKey, 'utf8'),
      decryptionPvk: readFileSync(config.saml.sp.privateKey, 'utf8'),
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
        const metadata = samlStrategy.generateServiceProviderMetadata(
          readFileSync(config.saml.sp.certificate, 'utf8'),
          readFileSync(config.saml.sp.certificate, 'utf8')
        );
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