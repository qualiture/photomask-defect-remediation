# Deployment Guide - Photomask Defect Analytics & Remediation Tracker

## Overview

This guide covers deploying the Photomask Defect Analytics & Remediation Tracker in various environments.

---

## Prerequisites

### Software Requirements

**Development Machine**:
- Node.js 18.x or higher
- npm 9.x or higher
- Git 2.x or higher
- SQLite (included with Node.js)
- Modern web browser (Chrome, Firefox, Edge, Safari)

**Production Server** (SAP BTP):
- SAP BTP Global Account
- Cloud Foundry space
- SAP HANA Cloud instance
- XSUAA service instance

### Skills Required

- Basic command line knowledge
- Understanding of Node.js and npm
- Familiarity with Cloud Foundry (for production)
- Basic database administration (for production)

---

## Local Development Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd photomask-defect-remediation

# Verify directory structure
ls -la
# Should see: app/, db/, srv/, package.json, etc.
```

### Step 2: Install Backend Dependencies

```bash
# Install CAP and backend dependencies
npm install

# Verify CAP installation
npx cds version

# Expected output:
# @sap/cds: 9.5.2
# @sap/cds-compiler: X.X.X
# @sap/cds-dk: X.X.X
# Node.js: v18.x.x
```

### Step 3: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd app/photomask-ui

# Install frontend dependencies
npm install

# Return to project root
cd ../..
```

### Step 4: Start Backend Server

```bash
# From project root
# Start CAP development server with auto-reload
cds watch

# Expected output:
# [cds] - loaded model from 2 file(s):
#   db/schema.cds
#   srv/catalog-service.cds
#   srv/analytics-service.cds
# [cds] - connect to db > sqlite { database: ':memory:' }
# [cds] - serving CatalogService { path: '/catalog' }
# [cds] - serving AnalyticsService { path: '/analytics' }
# [cds] - server listening on { url: 'http://localhost:4004' }
```

### Step 5: Start Frontend Server

**Open a new terminal window**:

```bash
# Navigate to frontend directory
cd app/photomask-ui

# Start Vite development server
npm run dev

# Expected output:
#  VITE v7.2.4  ready in XXX ms
#
#  ➜  Local:   http://localhost:5173/
#  ➜  Network: use --host to expose
#  ➜  press h + enter to show help
```

### Step 6: Verify Installation

1. **Backend Verification**:
   - Open http://localhost:4004
   - Should see "Welcome to cds.services" page
   - Click "CatalogService" link
   - Should see list of entities (Photomasks, Defects, etc.)

2. **Frontend Verification**:
   - Open http://localhost:5173
   - Should see dashboard with metrics
   - Navigate through pages (Defects, Photomasks, Equipment, etc.)
   - Verify data loads correctly

3. **Sample Data Verification**:
   ```bash
   # From project root
   curl http://localhost:4004/catalog/Photomasks
   # Should return JSON array of 10 sample photomasks

   curl http://localhost:4004/catalog/Defects
   # Should return JSON array of 10 sample defects
   ```

---

## Development Workflow

### Running Tests

**Backend Tests** (when implemented):
```bash
# From project root
npm test

# Run specific test file
npm test -- catalog-service.test.js
```

**Frontend Tests** (when implemented):
```bash
cd app/photomask-ui
npm test

# Run with coverage
npm test -- --coverage
```

### Database Management

**Reset Database** (SQLite in-memory):
```bash
# Simply restart cds watch
# Database is recreated on each start
```

**Persist Database to File** (optional for development):
```bash
# Deploy to SQLite file
cds deploy --to sqlite:db.sqlite

# Start with persistent database
cds serve --with-mocks --in-memory? false
```

**View Database Schema**:
```bash
# Deploy and inspect
cds deploy --to sqlite:db.sqlite --dry
```

### Code Quality

**Linting**:
```bash
# Backend
npm run lint

# Frontend
cd app/photomask-ui
npm run lint
```

**Formatting** (if Prettier configured):
```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

---

## Production Build

### Step 1: Build Frontend

```bash
# Navigate to frontend directory
cd app/photomask-ui

# Create production build
npm run build

# Output in dist/ directory
ls -la dist/

# Verify build
npm run preview
# Opens http://localhost:4173 with production build
```

### Step 2: Build Backend

```bash
# From project root
# Create production-ready CAP build
cds build --production

# Output in gen/ directory
ls -la gen/
```

### Step 3: Create Deployment Package

```bash
# Create archive for deployment
tar -czf photomask-defect-tracker.tar.gz \
  --exclude=node_modules \
  --exclude=app/photomask-ui/node_modules \
  --exclude=app/photomask-ui/dist \
  .

# Verify archive
tar -tzf photomask-defect-tracker.tar.gz | head -20
```

---

## SAP BTP Deployment

### Prerequisites

1. **SAP BTP Account Setup**:
   - Global account with Cloud Foundry environment
   - Subaccount created
   - Cloud Foundry space created
   - User assigned SpaceDeveloper role

2. **Install Cloud Foundry CLI**:
   ```bash
   # macOS (using Homebrew)
   brew install cloudfoundry/tap/cf-cli

   # Linux/Windows: Download from https://github.com/cloudfoundry/cli/releases

   # Verify installation
   cf version
   ```

3. **Login to Cloud Foundry**:
   ```bash
   # Login to SAP BTP
   cf login -a https://api.cf.<region>.hana.ondemand.com

   # Enter email and password when prompted

   # Select organization and space

   # Verify
   cf target
   ```

### Step 1: Configure manifest.yml

Create `manifest.yml` in project root:

```yaml
---
applications:
  - name: photomask-defect-tracker
    path: ./
    buildpack: nodejs_buildpack
    memory: 512M
    instances: 2
    health-check-type: http
    health-check-http-endpoint: /
    env:
      NODE_ENV: production
      CDS_ENV: production
    services:
      - photomask-hana-db
      - photomask-xsuaa
      - photomask-destination
    routes:
      - route: photomask-defect-tracker-<space>.cfapps.<region>.hana.ondemand.com
```

### Step 2: Create Services

**HANA Database**:
```bash
# Create HANA HDI container
cf create-service hana hdi-shared photomask-hana-db

# Wait for service creation
cf service photomask-hana-db
```

**XSUAA (Authentication)**:

Create `xs-security.json`:
```json
{
  "xsappname": "photomask-defect-tracker",
  "tenant-mode": "dedicated",
  "scopes": [
    {
      "name": "$XSAPPNAME.Technician",
      "description": "Technician role"
    },
    {
      "name": "$XSAPPNAME.Engineer",
      "description": "Engineer role"
    },
    {
      "name": "$XSAPPNAME.Manager",
      "description": "Manager role"
    },
    {
      "name": "$XSAPPNAME.Administrator",
      "description": "Administrator role"
    }
  ],
  "role-templates": [
    {
      "name": "Technician",
      "description": "Technician",
      "scope-references": ["$XSAPPNAME.Technician"]
    },
    {
      "name": "Engineer",
      "description": "Engineer",
      "scope-references": ["$XSAPPNAME.Engineer"]
    },
    {
      "name": "Manager",
      "description": "Manager",
      "scope-references": ["$XSAPPNAME.Manager"]
    },
    {
      "name": "Administrator",
      "description": "Administrator",
      "scope-references": ["$XSAPPNAME.Administrator"]
    }
  ]
}
```

```bash
# Create XSUAA service
cf create-service xsuaa application photomask-xsuaa -c xs-security.json
```

**Destination Service** (for future S/4HANA integration):
```bash
cf create-service destination lite photomask-destination
```

### Step 3: Deploy Database

```bash
# Build database artifacts
cds build

# Deploy to HANA
cf push photomask-db-deployer -p gen/db -k 512M -m 512M --no-route

# Wait for deployment to complete
cf logs photomask-db-deployer --recent
```

### Step 4: Deploy Application

```bash
# Push application
cf push

# Monitor deployment
cf logs photomask-defect-tracker --recent

# Verify app is running
cf apps

# Expected output:
# name                          requested state   instances   memory   disk
# photomask-defect-tracker      started           2/2         512M     1G
```

### Step 5: Verify Deployment

```bash
# Get application URL
cf app photomask-defect-tracker

# Open in browser
open https://photomask-defect-tracker-<space>.cfapps.<region>.hana.ondemand.com

# Test OData endpoints
curl https://photomask-defect-tracker-<space>.cfapps.<region>.hana.ondemand.com/catalog/
```

### Step 6: Configure Role Collections

1. Open SAP BTP Cockpit
2. Navigate to Subaccount → Security → Role Collections
3. Create Role Collections:
   - `PhotomaskTechnician`
   - `PhotomaskEngineer`
   - `PhotomaskManager`
   - `PhotomaskAdministrator`

4. Assign roles to role collections
5. Assign role collections to users

---

## Docker Deployment (Alternative)

### Step 1: Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app

# Copy and install backend dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy backend code
COPY db ./db
COPY srv ./srv
COPY server.js ./

# Build frontend
WORKDIR /app/app/photomask-ui
COPY app/photomask-ui/package*.json ./
RUN npm ci
COPY app/photomask-ui ./
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy backend from build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/db ./db
COPY --from=build /app/srv ./srv
COPY --from=build /app/server.js ./

# Copy frontend build
COPY --from=build /app/app/photomask-ui/dist ./app/photomask-ui/dist

EXPOSE 4004

ENV NODE_ENV=production

CMD ["node", "server.js"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: photomask-app
    ports:
      - "4004:4004"
    environment:
      - NODE_ENV=production
      - DB_TYPE=sqlite
    restart: unless-stopped
    networks:
      - photomask-network

networks:
  photomask-network:
    driver: bridge
```

### Step 3: Build and Run

```bash
# Build Docker image
docker build -t photomask-defect-tracker:latest .

# Run container
docker-compose up -d

# Verify
docker ps
docker logs photomask-app

# Access application
open http://localhost:4004
```

### Step 4: Docker with HANA (Advanced)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "4004:4004"
    environment:
      - NODE_ENV=production
      - DB_TYPE=hana
      - HANA_HOST=hana-db
      - HANA_PORT=39017
      - HANA_USER=${HANA_USER}
      - HANA_PASSWORD=${HANA_PASSWORD}
    depends_on:
      - hana-db
    networks:
      - photomask-network

  hana-db:
    image: saplabs/hanaexpress:latest
    container_name: photomask-hana
    ports:
      - "39017:39017"
      - "39041-39045:39041-39045"
    volumes:
      - hana-data:/hana/mounts
    environment:
      - AGREE_TO_SAP_LICENSE=Y
      - MASTER_PASSWORD=${HANA_PASSWORD}
    networks:
      - photomask-network

volumes:
  hana-data:

networks:
  photomask-network:
    driver: bridge
```

---

## Environment Configuration

### Environment Variables

**Backend (.env)**:
```bash
# Node environment
NODE_ENV=production

# Database
DB_TYPE=hana
HANA_HOST=<hana-host>
HANA_PORT=39017
HANA_USER=<username>
HANA_PASSWORD=<password>

# Authentication
XSUAA_URL=<xsuaa-url>
XSUAA_CLIENT_ID=<client-id>
XSUAA_CLIENT_SECRET=<client-secret>

# Application
LOG_LEVEL=info
PORT=4004
```

**Frontend (.env.production)**:
```bash
# API endpoint
VITE_API_BASE_URL=https://photomask-defect-tracker.cfapps.sap.hana.ondemand.com

# Feature flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_WEBSOCKETS=false
```

### Configuration Files

**cds-rc.json** (Production):
```json
{
  "requires": {
    "db": {
      "kind": "hana"
    },
    "auth": {
      "kind": "xsuaa"
    }
  },
  "hana": {
    "deploy-format": "hdbtable"
  }
}
```

---

## Post-Deployment

### Health Checks

**Backend Health**:
```bash
# Check application health
curl https://<app-url>/

# Check OData metadata
curl https://<app-url>/catalog/$metadata

# Check database connection
curl https://<app-url>/catalog/Photomasks/$count
```

**Frontend Health**:
```bash
# Check frontend loads
curl -I https://<app-url>/

# Should return 200 OK
```

### Performance Tuning

**Backend**:
```yaml
# manifest.yml
memory: 1G          # Increase if needed
instances: 3        # Scale horizontally
disk_quota: 2G      # Increase for larger databases
```

**Database Connection Pool**:
```json
// cds-rc.json
{
  "hana": {
    "pool": {
      "min": 5,
      "max": 20,
      "acquireTimeoutMillis": 30000
    }
  }
}
```

### Monitoring Setup

**Application Logging**:
```bash
# View live logs
cf logs photomask-defect-tracker

# View recent logs
cf logs photomask-defect-tracker --recent
```

**Metrics** (SAP BTP):
- Navigate to Cloud Foundry → Applications → photomask-defect-tracker
- View CPU, Memory, Disk usage
- Monitor request rate and response time

---

## Backup and Recovery

### Database Backup (HANA)

**Manual Backup**:
```bash
# Connect to HANA
cf ssh photomask-defect-tracker

# Create backup (HANA SQL)
BACKUP DATA USING FILE ('photomask-backup');
```

**Automated Backup** (SAP BTP):
- HANA Cloud provides automated backups
- Configure in SAP BTP Cockpit → HANA Cloud
- Retention: 14 days default

**Restore from Backup**:
```sql
RECOVER DATA USING FILE ('photomask-backup');
```

### Export/Import Sample Data

**Export Data**:
```bash
# Export to CSV
curl https://<app-url>/catalog/Photomasks -o photomasks.json
curl https://<app-url>/catalog/Defects -o defects.json
```

**Import Data**:
```bash
# Use CAP bulk import
cds import --from photomasks.json --to Photomasks
```

---

## Rollback Procedures

### Application Rollback

**Cloud Foundry**:
```bash
# View deployment history
cf app photomask-defect-tracker --guid

# Rollback to previous version (if blue-green deployed)
cf map-route photomask-defect-tracker-old <domain> --hostname photomask-defect-tracker
cf unmap-route photomask-defect-tracker <domain> --hostname photomask-defect-tracker

# Or redeploy previous version
cf push photomask-defect-tracker -p <previous-build.tar.gz>
```

**Docker**:
```bash
# Tag and save current version
docker tag photomask-defect-tracker:latest photomask-defect-tracker:v1.0.0

# Rollback to previous version
docker-compose down
docker tag photomask-defect-tracker:v0.9.0 photomask-defect-tracker:latest
docker-compose up -d
```

### Database Rollback

```sql
-- HANA recovery to point in time
RECOVER DATABASE UNTIL TIMESTAMP '2025-12-14 10:00:00';
```

---

## Security Hardening

### HTTPS Configuration

**Cloud Foundry**:
- HTTPS enforced by default
- Custom domain setup (optional):
  ```bash
  cf map-route photomask-defect-tracker <custom-domain> --hostname <subdomain>
  ```

### Security Headers

Add to `server.js`:
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
});
```

### Rate Limiting

Install and configure:
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100 // 100 requests per minute
});

app.use('/catalog', limiter);
app.use('/analytics', limiter);
```

---

## Troubleshooting Deployment

### Issue: Application won't start

**Symptoms**: `cf apps` shows app in "crashed" state

**Solutions**:
```bash
# Check logs
cf logs photomask-defect-tracker --recent

# Common issues:
# 1. Missing service binding
cf services
cf bind-service photomask-defect-tracker photomask-hana-db
cf restage photomask-defect-tracker

# 2. Insufficient memory
cf scale photomask-defect-tracker -m 1G

# 3. Database connection error
cf env photomask-defect-tracker
# Verify HANA credentials
```

### Issue: Database deployment fails

**Symptoms**: HDI deployer app fails

**Solutions**:
```bash
# Check deployer logs
cf logs photomask-db-deployer --recent

# Increase memory for deployer
cf push photomask-db-deployer -p gen/db -m 1G

# Check HANA service status
cf service photomask-hana-db
```

### Issue: Authentication not working

**Symptoms**: "401 Unauthorized" errors

**Solutions**:
```bash
# Verify XSUAA binding
cf env photomask-defect-tracker | grep XSUAA

# Recreate XSUAA service
cf delete-service photomask-xsuaa
cf create-service xsuaa application photomask-xsuaa -c xs-security.json
cf bind-service photomask-defect-tracker photomask-xsuaa
cf restage photomask-defect-tracker
```

### Issue: Frontend not loading

**Symptoms**: Blank page or 404 errors

**Solutions**:
1. Verify frontend build exists:
   ```bash
   ls -la app/photomask-ui/dist/
   ```

2. Check build configuration in `vite.config.js`:
   ```javascript
   export default defineConfig({
     base: './', // Relative paths
     build: {
       outDir: 'dist'
     }
   });
   ```

3. Verify routing in production

---

## Maintenance Windows

### Planned Maintenance

**Schedule**:
- Monthly: First Sunday, 2:00 AM - 4:00 AM
- Quarterly: Major updates during planned downtime

**Procedure**:
1. Notify users 72 hours in advance
2. Create database backup
3. Deploy to staging environment first
4. Deploy to production
5. Verify functionality
6. Monitor for 24 hours

### Emergency Maintenance

**Hotfix Procedure**:
1. Create hotfix branch from production
2. Apply fix and test in staging
3. Deploy to production immediately
4. Notify users via in-app banner
5. Document incident and resolution

---

## Checklist

### Pre-Deployment Checklist

- [ ] All tests passing (backend and frontend)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Database migration scripts prepared
- [ ] Environment variables configured
- [ ] Security scan completed
- [ ] Performance testing completed
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Stakeholders notified

### Post-Deployment Checklist

- [ ] Application accessible via URL
- [ ] Health checks passing
- [ ] Sample data visible
- [ ] Authentication working
- [ ] API endpoints responding
- [ ] Frontend pages loading
- [ ] Critical user flows tested
- [ ] Monitoring configured
- [ ] Logs reviewed for errors
- [ ] Users notified of deployment

---

## Support Contacts

### Development Team
- Lead Developer: developer@company.com
- Frontend Lead: frontend@company.com
- Backend Lead: backend@company.com

### Operations Team
- SAP BTP Admin: btp-admin@company.com
- Database Admin: dba@company.com
- Security Team: security@company.com

### Escalation
- Engineering Manager: eng-manager@company.com
- On-Call Hotline: +1-XXX-XXX-XXXX

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Maintained By**: DevOps Team
**Review Cycle**: Quarterly
