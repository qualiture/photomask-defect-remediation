# Photomask Defect Analytics & Remediation Tracker - Quick Start Guide

## Overview

This is a **Phase 1 Foundation** implementation. The backend (CAP) is fully functional with sample data. The frontend is initialized and ready for component development.

---

## Prerequisites

- Node.js 18+ (already installed)
- npm 9+ (already installed)
- A modern web browser

---

## Quick Start (Development)

### Step 1: Start the CAP Backend

```bash
cd /Users/robin/Development/photomask-defect-remediation

# Install CAP dependencies (only first time)
npm install

# Start the development server
cds watch
```

**Expected Output:**

```
> photomask-defect-remediation@1.0.0 cds serve
...
✨ Server running on http://localhost:4004
...
```

**Backend is now ready!** 🎉

### Step 2: Start the React Frontend (New Terminal)

```bash
cd /Users/robin/Development/photomask-defect-remediation/app/photomask-ui

# Start Vite dev server
npm run dev
```

**Expected Output:**

```
  VITE v6.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

**Frontend is now running!** 🚀

---

## Test the Backend API

### Option 1: Using CAP's Built-in OData Explorer

1. Open http://localhost:4004 in your browser
2. Click on "Catalog Service"
3. Explore the entities:
   - **Photomasks** - Sample masks with defects
   - **Defects** - 10 sample defects with nanometer coordinates
   - **Equipment** - 8 equipment units
   - **Defect Types, Mask Statuses** - Code lists

### Option 2: Using cURL or Postman

```bash
# Get all photomasks
curl http://localhost:4004/catalog/Photomasks

# Get critical defects
curl "http://localhost:4004/catalog/Defects?\$filter=severity%20eq%20'Critical'"

# Get pending approvals (remediation orders requiring approval)
curl "http://localhost:4004/catalog/RemediationOrders?\$filter=requiresApproval%20eq%20true"

# Detect patterns for a mask
curl -X POST http://localhost:4004/analytics/detectPatterns \
  -H "Content-Type: application/json" \
  -d '{"maskID":"<MASK_ID>","confidence_threshold":0.9}'
```

### Option 3: Using CAP CLI

```bash
# Terminal inside the CAP project
cds repl

# Inside REPL:
> SELECT.from('Photomasks')
> SELECT.from('Defects').where({severity: 'Critical'})
> SELECT.from('Equipment')
```

---

## Sample Data Available

### Photomasks (10 samples)

- **MASK-M001** (Metal 1, 7nm) - In-Use, 45 uses, $12,000
- **MASK-M005** (Via, 5nm) - Quarantined, 120 uses, $18,000
- **MASK-M003** (Metal 2, 7nm) - In-Use, 28 uses, $15,000
- ... (7 more)

### Defects (10 samples)

- **DEF-M001-001** - Particle contamination (nanometers: 15000.5, 22500.75)
- **DEF-M003-001** - Physical scratch (Critical) (nanometers: 25500.6, 30000.4)
- **DEF-M005-002** - Substrate crack (Critical) (nanometers: 31500.5, 35500.25)
- ... (7 more)

### Equipment (8 samples)

- **EQ-STEPPER-001** - ASML Stepper (Active)
- **EQ-SCANNER-001** - ASML Scanner (Active)
- **EQ-INSPECT-001** - KLA CD Inspection (Active)
- ... (5 more)

---

## Available OData Endpoints

### CatalogService Endpoints

**Read/Create/Update/Delete:**

- `POST /catalog/Photomasks`
- `GET  /catalog/Photomasks`
- `GET  /catalog/Photomasks(ID)`
- `PATCH /catalog/Photomasks(ID)`
- `DELETE /catalog/Photomasks(ID)`

- `POST /catalog/Defects`
- `GET  /catalog/Defects`
- `GET  /catalog/Defects(ID)`
- etc...

**Actions (Business Logic):**

- `POST /catalog/submitForApproval` - Submit remediation order (auto-approves if <$1,000)
- `POST /catalog/approveRemediation` - Manually approve order (≥$1,000)
- `POST /catalog/rejectRemediation` - Reject order
- `POST /catalog/completeRemediation` - Mark order complete

**Functions (Queries):**

- `GET /catalog/getDefectsByMask?maskID='<ID>'`
- `GET /catalog/getMaskHistory?maskID='<ID>'`
- `GET /catalog/calculateDefectSeverity?...`
- `GET /catalog/getEquipmentDefects?...`
- `GET /catalog/getPendingApprovals()`
- `GET /catalog/getMaskCostSummary?...`

### AnalyticsService Endpoints

**Functions:**

- `POST /analytics/detectPatterns` - Run DBSCAN pattern detection
- `POST /analytics/confirmPattern` - Save confirmed pattern
- `POST /analytics/calculateCostBenefit` - Compare repair/replace/retire
- `POST /analytics/analyzeEquipmentCorrelation` - Equipment analysis (24-hour window)
- `POST /analytics/predictDefectRisk` - Risk prediction
- `POST /analytics/getDefectStatistics` - Period statistics
- `POST /analytics/getPatternTrends` - Historical trends

---

## Key Features Implemented (Phase 1)

### Backend (Ready)

✅ Core data model with 10+ entities
✅ Nanometer-precision coordinates (Decimal(12,6))
✅ DBSCAN pattern detection (>0.9 confidence)
✅ Auto-approval logic (<$1,000)
✅ Image upload handler (1 MB max, thumbnail generation)
✅ Equipment correlation analysis (24-hour window)
✅ Cost-benefit calculation (Repair/Replace/Retire)
✅ Sample data (10 masks, 10 defects, 8 equipment)

### Frontend (Initialized)

✅ Vite + React 18 + TypeScript
✅ Material-UI v6 for UI components
✅ React Query for data fetching
✅ Zustand for state management
✅ D3.js + Konva for visualization
✅ Recharts for analytics
✅ React Flow for agent visualization
✅ React Router for navigation (to be configured)

---

## Typical Workflow (Once Frontend Complete)

1. **Create Defect**

   - Upload image (<1 MB)
   - Enter nanometer coordinates (X, Y)
   - System auto-calculates severity based on location & AI confidence
   - Defect saved with pattern group assignment

2. **Detect Patterns**

   - User requests pattern detection for a mask
   - DBSCAN clustering runs (>0.9 confidence)
   - Results shown with "Requires Confirmation"
   - User reviews and confirms patterns

3. **Create Remediation**

   - User selects defects to remediate
   - Enters estimated cost
   - If <$1,000: Auto-approved ✅
   - If ≥$1,000: Requires manager approval ⏳

4. **Analyze Equipment**

   - System tracks defects by equipment (24-hour window)
   - If equipment correlation detected: Alert for maintenance
   - User can view equipment performance metrics

5. **Cost-Benefit Analysis**
   - System recommends: Repair, Replace, or Retire
   - Shows cost comparison and risk assessment
   - User makes informed decision

---

## Project Structure

```
/Users/robin/Development/photomask-defect-remediation/
├── package.json                  # CAP main config
├── db/
│   ├── schema.cds               # Core data model
│   └── data/                    # 7 CSV seed files
├── srv/
│   ├── catalog-service.cds      # Main CRUD service
│   ├── catalog-service.js       # 400+ lines of handlers
│   ├── analytics-service.cds    # Analytics service
│   ├── analytics-service.js     # 600+ lines of analysis logic
│   └── handlers/
│       └── image-handler.js     # Image processing (1 MB)
│
└── app/photomask-ui/            # React frontend
    ├── package.json
    ├── vite.config.js
    ├── src/
    │   ├── main.tsx
    │   ├── App.jsx
    │   └── [Components - to be created in Phase 2]
    └── public/
```

---

## Useful Commands

### Backend Development

```bash
cd /Users/robin/Development/photomask-defect-remediation

# Install dependencies
npm install

# Start dev server (with auto-reload)
cds watch

# Start with mock data (in-memory)
cds serve

# REPL (interactive CLI)
cds repl

# Database utilities
cds deploy --to sqlite:db.sqlite   # Persist DB
cds build                          # Build for production

# Run tests
npm test
```

### Frontend Development

```bash
cd app/photomask-ui

# Install dependencies
npm install

# Start dev server (with HMR)
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Lint code
npm run lint

# Run tests (when added)
npm test

# E2E tests (when added)
npm run e2e
```

---

## Debugging

### Backend

- CAP auto-reloads on file changes
- Check console for errors in `cds watch` terminal
- Use `cds repl` for interactive debugging

### Frontend

- Vite shows errors in browser console
- Check VS Code Problems panel for TypeScript errors
- React DevTools browser extension recommended

---

## API Testing Tools

**Recommended:**

1. **Postman** - Import OData endpoints
2. **REST Client VS Code Extension** - Create .rest files
3. **curl** - Command line testing
4. **CAP OData Explorer** - Built-in at http://localhost:4004

---

## Next Phase: Phase 2

Phase 2 will add:

- ✨ Interactive defect map (D3.js + Konva)
- 📤 Image upload UI with drag-drop
- 📊 Pattern detection dashboard
- 📋 Defect list views
- ✏️ Defect creation form
- 🎯 Mask detail pages

---

## Troubleshooting

### "Port 4004 already in use"

```bash
# Find process on port 4004
lsof -i :4004

# Kill it
kill -9 <PID>
```

### "Module not found" error

```bash
# Reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

### Frontend won't connect to backend

- Ensure backend is running on http://localhost:4004
- Check browser console for CORS errors
- Add CORS middleware if needed (in Phase 2)

### Database locked

```bash
# Clear SQLite locks
rm db.sqlite*

# Restart CAP
cds watch
```

---

## Documentation

- **Implementation Plan:** `/PHASE1_COMPLETION.md` (detailed Phase 1 summary)
- **Plan File:** `/Users/robin/.claude/plans/gleaming-gliding-twilight.md` (full architecture)
- **This Guide:** `QUICKSTART.md` (you are here)

---

## Success Indicators

✅ Backend (http://localhost:4004) shows "Server running"
✅ Frontend (http://localhost:5173) loads React app
✅ Can view sample data in OData explorer
✅ Pattern detection endpoint responds
✅ Image handler validates 1 MB limit

---

## Support & Next Steps

**Need help?**

1. Check `PHASE1_COMPLETION.md` for detailed implementation info
2. Review CAP documentation: https://cap.cloud.sap/docs/
3. Check React documentation: https://react.dev/

**Ready for Phase 2?**

- Backend is fully functional ✅
- Sample data ready ✅
- Frontend initialized ✅
- All dependencies installed ✅

Start building the interactive UI components! 🎨

---

**Happy developing!** 🚀
