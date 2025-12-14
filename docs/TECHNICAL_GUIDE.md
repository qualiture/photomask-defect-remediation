# Technical Guide - Photomask Defect Analytics & Remediation Tracker

## System Architecture

### Overview

The Photomask Defect Analytics & Remediation Tracker is built using a modern three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Tier                          │
│  React 19 + TypeScript + Vite + Material-UI + D3.js         │
│                    (Port 5173)                               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/OData
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Service/Backend Tier                      │
│      SAP CAP (Node.js) + Custom Handlers + ML Logic         │
│                    (Port 4004)                               │
└────────────────────────┬────────────────────────────────────┘
                         │ CDS QL
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      Data Tier                               │
│          SQLite (dev) / SAP HANA (production)                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Backend (SAP CAP)

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | SAP Cloud Application Programming Model | 9.5.2 | Core backend framework |
| Runtime | Node.js | 18+ | JavaScript runtime |
| Database | SQLite (dev) / HANA (prod) | - | Data persistence |
| OData | OData v4 | - | REST API protocol |
| ML Library | ml-dbscan | Latest | Pattern detection clustering |
| Image Processing | sharp | Latest | Thumbnail generation |
| File Upload | multer | Latest | Multipart form handling |

#### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Build Tool | Vite | 7.2.4 | Fast build and HMR |
| Framework | React | 19.2.0 | UI framework |
| Language | TypeScript | 5.x | Type-safe JavaScript |
| UI Library | Material-UI (MUI) | 7.3.6 | Component library |
| Routing | React Router | 7.10.1 | Client-side routing |
| State Management | Zustand | 5.0.9 | Global state management |
| Data Fetching | TanStack Query (React Query) | 5.90.12 | Server state management |
| HTTP Client | Axios | 1.13.2 | API calls |
| Visualization | D3.js | 7.9.0 | Defect map visualization |
| Canvas | react-konva | 19.2.1 | Canvas rendering |
| Charts | Recharts | 3.5.1 | Analytics charts |
| Styling | Tailwind CSS + Emotion | 4.1.18 / Latest | CSS utilities + CSS-in-JS |
| Date Utils | date-fns | 4.1.0 | Date manipulation |

---

## Data Model

### Core Entities

#### Photomasks
Primary entity representing physical photomasks.

```typescript
interface Photomask {
  ID: UUID;                    // System-generated GUID
  maskID: string;              // Business ID (unique)
  layer: string;               // Process layer (Metal 1, Poly, etc.)
  technology: string;          // Node size (5nm, 7nm, etc.)
  manufacturer: string;
  receivedDate: Date;
  status: MaskStatus;          // Association to MaskStatuses
  lifecycleStage: string;      // New, In-Use, Quarantine, Retired
  usageCount: number;          // Number of exposures
  estimatedValue: Decimal;     // Replacement cost
  valueCurrency: string;
  layoutImageURL?: string;
  layoutImageData?: Binary;    // LargeBinary thumbnail

  // Relationships
  defects: Defect[];           // Composition
  equipment: EquipmentUsage[]; // Association
  remediations: RemediationOrder[]; // Composition
  criticalAreas: CriticalArea[]; // Composition

  // Managed fields
  createdAt: DateTime;
  createdBy: string;
  modifiedAt: DateTime;
  modifiedBy: string;
}
```

#### Defects
Represents individual defects on photomasks.

```typescript
interface Defect {
  ID: UUID;
  defectID: string;            // Business ID (unique)
  detectedDate: DateTime;
  detectionMethod: string;     // Manual, Inspection, Equipment

  // Classification
  defectType: DefectType;      // Association to DefectTypes
  severity: string;            // Critical, Major, Minor
  severityReason: string;      // Calculation justification
  priority: number;

  // Spatial data - NANOMETER PRECISION
  coordinateX: Decimal(12,6);  // Origin: top-left corner
  coordinateY: Decimal(12,6);
  zone?: string;
  affectedArea?: Decimal(10,2);

  // Image data
  imageData: Binary;           // LargeBinary, max 1 MB
  imageType: string;           // MIME type (image/jpeg, etc.)
  imageThumbnail?: Binary;     // Generated thumbnail
  imageURL?: string;
  annotatedImageURL?: string;

  // Analysis
  rootCause?: string;
  patternGroup?: string;       // Pattern clustering identifier
  aiConfidence?: Decimal(3,2); // 0.00-1.00

  // Impact
  impactsYield: boolean;
  estimatedImpact?: Decimal;

  // Relationships
  mask: Photomask;             // Association (mandatory)
  equipment?: Equipment;       // Equipment when detected
  remediation?: RemediationOrder;

  // Managed fields
  createdAt: DateTime;
  createdBy: string;
  modifiedAt: DateTime;
  modifiedBy: string;
}
```

#### Equipment
Equipment units used in photomask handling and inspection.

```typescript
interface Equipment {
  ID: UUID;
  equipmentID: string;         // Business ID (unique)
  equipmentName: string;
  equipmentType: string;       // Stepper, Scanner, Inspector, Cleaner
  manufacturer: string;
  model: string;
  location: string;
  status: string;              // Active, Maintenance, Retired

  // Maintenance
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  maintenanceNotes?: string;

  // Relationships
  usageHistory: EquipmentUsage[]; // Composition
  defectsDetected: Defect[];   // Association

  // Managed fields
  createdAt: DateTime;
  createdBy: string;
  modifiedAt: DateTime;
  modifiedBy: string;
}
```

#### RemediationOrders
Workflow entity for managing defect remediation.

```typescript
interface RemediationOrder {
  ID: UUID;
  orderNumber: string;         // Business ID (unique)
  orderDate: DateTime;

  mask: Photomask;             // Association (mandatory)
  defects: Defect[];           // Association to multiple defects

  // Remediation details
  remediationType: RemediationType; // Association
  priority: string;            // Urgent, High, Normal, Low
  status: string;              // Draft, Approved, In-Progress, Completed, Cancelled

  // Cost tracking
  estimatedCost: Decimal(15,2);
  actualCost?: Decimal(15,2);
  costCurrency: string;

  // Timeline
  plannedStart?: Date;
  plannedEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;

  // AI recommendations
  costBenefitScore?: Decimal(5,2); // 0-100
  recommendation?: string;     // Repair, Replace, Retire
  justification?: string;

  // Approval workflow
  requiresApproval: boolean;   // false if cost < $1000
  approver?: string;           // User ID
  approvalDate?: DateTime;
  approvalNotes?: string;

  // Vendor integration
  vendor?: Vendor;
  vendorOrderID?: string;
  vendorQuoteDate?: DateTime;

  // Relationships
  tasks: RemediationTask[];    // Composition

  // Managed fields
  createdAt: DateTime;
  createdBy: string;
  modifiedAt: DateTime;
  modifiedBy: string;
}
```

#### DefectPatterns
ML-detected patterns in defect spatial distribution.

```typescript
interface DefectPattern {
  ID: UUID;
  patternName: string;
  patternType: string;         // Cluster, Linear, Radial, Random
  confidence: Decimal(3,2);    // 0.00-1.00, must be > 0.9
  confirmed: boolean;          // Requires manual confirmation

  // Pattern characteristics
  avgDistance: Decimal(10,2);  // Average distance (nm)
  orientation?: Decimal(5,2);  // Degrees from horizontal
  frequency: number;           // Defect count in pattern
  centroidX: Decimal(12,6);    // Pattern center (nm)
  centroidY: Decimal(12,6);

  // Root cause
  suspectedCause?: string;
  correlatedEquipment?: Equipment;
  correlationStrength?: Decimal(3,2);
  analysisDate: DateTime;

  // Relationships
  mask: Photomask;
  defects: Defect[];           // Association via patternGroup

  // Managed fields
  createdAt: DateTime;
  createdBy: string;
  modifiedAt: DateTime;
  modifiedBy: string;
}
```

### Code Lists (Enumerations)

#### MaskStatuses
```typescript
interface MaskStatus {
  code: string;        // Primary key
  name: string;
  description: string;
  criticality: number; // 1-5 for UI color coding
}

// Values:
// NEW, IN_USE, QUARANTINE, UNDER_REPAIR, RETIRED
```

#### DefectTypes
```typescript
interface DefectType {
  code: string;        // Primary key
  name: string;
  category: string;    // Contamination, Pattern, Physical
  repairability: string; // Repairable, Non-Repairable, Conditional
  description: string;
}

// 10 predefined types:
// PARTICLE, SCRATCH, PATTERN_DEFECT, MISSING_FEATURE,
// SUBSTRATE_CRACK, RESIDUE, DELAMINATION, ETCH_DEFECT,
// CD_VARIATION, OVERLAY_ERROR
```

---

## API Architecture

### OData v4 Services

The system exposes two main OData services:

#### 1. CatalogService (`/catalog`)
Main CRUD service for business entities.

**Exposed Entities** (Full CRUD):
- `Photomasks`
- `Defects`
- `Equipment`
- `EquipmentUsage`
- `RemediationOrders`
- `RemediationTasks`
- `Vendors`

**Code Lists** (Read-only):
- `MaskStatuses`
- `DefectTypes`
- `RemediationTypes`
- `Severities`

**Actions** (POST):
- `submitForApproval(orderID)` - Submit order, auto-approve if <$1000
- `approveRemediation(orderID, approverNotes, approverUser)` - Manual approval
- `rejectRemediation(orderID, rejectionReason, rejectionUser)` - Reject order
- `completeRemediation(orderID, actualCost, completionNotes, completionUser)` - Mark complete

**Functions** (GET):
- `getDefectsByMask(maskID)` - Get all defects for a mask
- `getMaskHistory(maskID)` - Get mask timeline
- `calculateDefectSeverity(...)` - Calculate severity
- `getEquipmentDefects(equipmentID, hoursLookback)` - Equipment correlation
- `getPendingApprovals()` - List pending approvals
- `getMaskCostSummary(maskID)` - Cost analysis

#### 2. AnalyticsService (`/analytics`)
Analytics and ML-driven insights.

**Exposed Entities** (Read-only):
- `DefectPatterns`
- `DefectTrends`
- `MaskDefectSummary`

**Functions** (POST/GET):
- `detectPatterns(maskID, confidence_threshold)` - DBSCAN clustering
- `confirmPattern(patternName, maskID, suspectedCause, correlatedEquipmentID)` - Save pattern
- `calculateCostBenefit(orderID)` - Cost-benefit analysis
- `analyzeEquipmentCorrelation(equipmentID, dateFrom, dateTo)` - 24-hour analysis
- `predictDefectRisk(maskID)` - Risk prediction
- `getDefectStatistics(monthYear)` - Period statistics
- `getPatternTrends(monthsLookback)` - Trend analysis
- `compareMasks(maskID1, maskID2)` - Mask comparison
- `getCriticalAlerts()` - Critical alerts

### Custom Handlers

#### Image Upload Handler
**File**: `srv/handlers/image-handler.js`

**Capabilities**:
- Multer-based multipart/form-data handling
- 1 MB file size limit enforcement
- Support for all image formats (JPEG, PNG, TIFF, BMP, WebP)
- Automatic thumbnail generation (200×200 px) using `sharp`
- Coordinate validation against image dimensions
- Affected area calculation
- Direct database insertion (LargeBinary)

**Endpoint**: `POST /catalog/Defects` with multipart/form-data

**Request Format**:
```http
POST /catalog/Defects
Content-Type: multipart/form-data

--boundary
Content-Disposition: form-data; name="image"; filename="defect.jpg"
Content-Type: image/jpeg

[binary image data]
--boundary
Content-Disposition: form-data; name="maskID"

MASK-M001
--boundary
Content-Disposition: form-data; name="coordinateX"

15000.5
--boundary--
```

---

## Business Logic Implementation

### 1. Auto-Approval Logic

**Location**: `srv/catalog-service.js` - `submitForApproval` handler

**Algorithm**:
```javascript
async function submitForApproval(req) {
  const { orderID } = req.data;
  const order = await SELECT.one.from(RemediationOrders, orderID);

  if (!order) throw new Error('Order not found');

  const autoApprove = order.estimatedCost < 1000;

  if (autoApprove) {
    await UPDATE(RemediationOrders, orderID).set({
      status: 'Auto-Approved',
      requiresApproval: false,
      approvalDate: new Date()
    });

    return {
      orderID,
      status: 'Auto-Approved',
      autoApproved: true,
      message: 'Order auto-approved (cost < $1,000)'
    };
  } else {
    await UPDATE(RemediationOrders, orderID).set({
      status: 'Pending Approval',
      requiresApproval: true
    });

    return {
      orderID,
      status: 'Pending Approval',
      autoApproved: false,
      message: 'Order requires manual approval (cost >= $1,000)'
    };
  }
}
```

### 2. Severity Calculation

**Location**: `srv/catalog-service.js` - `calculateDefectSeverity` function

**Algorithm**:
```javascript
async function calculateDefectSeverity(req) {
  const { defectType, coordinateX, coordinateY, maskID, aiConfidence } = req.data;

  // Get defect type details
  const type = await SELECT.one.from(DefectTypes).where({ code: defectType });

  // Check if coordinates are in critical area
  const mask = await SELECT.one.from(Photomasks, maskID).columns('criticalAreas');
  const inCriticalArea = mask.criticalAreas.some(area =>
    coordinateX >= area.coordinateX1 && coordinateX <= area.coordinateX2 &&
    coordinateY >= area.coordinateY1 && coordinateY <= area.coordinateY2
  );

  // Determine severity
  let severity, level, reason;

  if (inCriticalArea && type.repairability === 'Non-Repairable') {
    severity = 'Critical';
    level = 3;
    reason = 'Non-repairable defect in critical area';
  } else if (inCriticalArea && aiConfidence >= 0.85) {
    severity = 'Critical';
    level = 3;
    reason = 'High-confidence defect in critical area';
  } else if (type.repairability === 'Repairable' && !inCriticalArea) {
    severity = 'Minor';
    level = 1;
    reason = 'Repairable defect outside critical areas';
  } else {
    severity = 'Major';
    level = 2;
    reason = 'Moderate impact defect';
  }

  return { severity, level, reason, inCriticalArea };
}
```

### 3. DBSCAN Pattern Detection

**Location**: `srv/analytics-service.js` - `detectPatterns` function

**Algorithm**:
```javascript
const DBSCAN = require('ml-dbscan');

async function detectPatterns(req) {
  const { maskID, confidence_threshold } = req.data;

  // Get all defects for mask
  const defects = await SELECT.from(Defects).where({ mask_ID: maskID });

  if (defects.length < 3) {
    return []; // Need at least 3 defects for clustering
  }

  // Prepare coordinate data for DBSCAN
  const coordinates = defects.map(d => [d.coordinateX, d.coordinateY]);

  // Run DBSCAN clustering
  // epsilon: 10000 nm (10 μm) - max distance between neighbors
  // minPoints: 3 - minimum points to form cluster
  const dbscan = new DBSCAN();
  const clusters = dbscan.run(coordinates, 10000, 3);

  // Analyze each cluster
  const patterns = clusters.map((cluster, idx) => {
    const clusterDefects = cluster.map(i => defects[i]);

    // Calculate centroid
    const centroidX = cluster.reduce((sum, i) => sum + coordinates[i][0], 0) / cluster.length;
    const centroidY = cluster.reduce((sum, i) => sum + coordinates[i][1], 0) / cluster.length;

    // Classify pattern type
    const patternType = classifyPattern(cluster, coordinates);

    // Calculate confidence based on cluster density
    const confidence = calculateConfidence(cluster, coordinates);

    // Determine suspected cause
    const suspectedCause = determineCause(clusterDefects, patternType);

    return {
      patternName: `PATTERN-${maskID}-${idx}`,
      patternType,
      confidence,
      defectCount: cluster.length,
      centroidX,
      centroidY,
      coordinates: cluster.map(i => ({ x: coordinates[i][0], y: coordinates[i][1] })),
      suspectedCause,
      requiresConfirmation: confidence > confidence_threshold
    };
  });

  // Return only patterns above threshold
  return patterns.filter(p => p.confidence >= confidence_threshold);
}

function classifyPattern(cluster, coordinates) {
  // Calculate distances and angles
  const distances = [];
  const angles = [];

  for (let i = 0; i < cluster.length - 1; i++) {
    for (let j = i + 1; j < cluster.length; j++) {
      const dx = coordinates[cluster[j]][0] - coordinates[cluster[i]][0];
      const dy = coordinates[cluster[j]][1] - coordinates[cluster[i]][1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      distances.push(dist);
      angles.push(angle);
    }
  }

  // Analyze distribution
  const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
  const stdDist = Math.sqrt(
    distances.reduce((sum, d) => sum + Math.pow(d - avgDist, 2), 0) / distances.length
  );

  const angleStd = calculateAngleStd(angles);

  // Classification logic
  if (angleStd < 0.3) return 'Linear';      // Aligned defects
  if (stdDist / avgDist < 0.3) return 'Radial';  // Equidistant from center
  return 'Cluster';                          // General clustering
}

function calculateConfidence(cluster, coordinates) {
  // Confidence based on:
  // 1. Cluster size (more defects = higher confidence)
  // 2. Cluster density (tighter cluster = higher confidence)
  // 3. Spatial regularity

  const size = cluster.length;
  const sizeScore = Math.min(size / 10, 1.0); // Max out at 10 defects

  // Calculate cluster compactness
  const centroid = [
    cluster.reduce((sum, i) => sum + coordinates[i][0], 0) / size,
    cluster.reduce((sum, i) => sum + coordinates[i][1], 0) / size
  ];

  const distances = cluster.map(i => {
    const dx = coordinates[i][0] - centroid[0];
    const dy = coordinates[i][1] - centroid[1];
    return Math.sqrt(dx * dx + dy * dy);
  });

  const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
  const densityScore = 1.0 / (1.0 + avgDist / 10000); // Normalize by 10 μm

  // Combined confidence
  return Math.min((sizeScore * 0.6 + densityScore * 0.4), 1.0);
}
```

### 4. Cost-Benefit Analysis

**Location**: `srv/analytics-service.js` - `calculateCostBenefit` function

**Algorithm**:
```javascript
async function calculateCostBenefit(req) {
  const { orderID } = req.data;

  const order = await SELECT.one.from(RemediationOrders, orderID)
    .columns(['ID', 'mask_ID', 'estimatedCost', 'remediationType_code'])
    .expand('mask', 'defects');

  if (!order) throw new Error('Order not found');

  const mask = order.mask;
  const defects = order.defects;

  // Option 1: Repair
  const repairCost = order.estimatedCost;
  const repairRisk = calculateRepairRisk(order.remediationType_code, defects);

  // Option 2: Replace
  const replacementCost = mask.estimatedValue || 15000;
  const replacementRisk = 0.1; // Low risk, but lead time

  // Option 3: Retire
  const retirementCost = calculateRetirementCost(mask, defects);
  const retirementRisk = calculateRetirementRisk(mask);

  // Calculate scores (inverse of cost × risk)
  const repairScore = 1 / (repairCost * (1 + repairRisk));
  const replaceScore = 1 / (replacementCost * (1 + replacementRisk));
  const retireScore = 1 / (retirementCost * (1 + retirementRisk));

  // Determine recommendation
  let recommendation, costBenefitScore, justification;

  if (repairScore > replaceScore && repairScore > retireScore) {
    recommendation = 'Repair';
    costBenefitScore = normalizeScore(repairScore);
    justification = `Repair is most cost-effective at $${repairCost} with ${Math.round(repairRisk * 100)}% risk. ` +
      `Replacement would cost $${replacementCost}. Repair recommended if success probability >70%.`;
  } else if (replaceScore > retireScore) {
    recommendation = 'Replace';
    costBenefitScore = normalizeScore(replaceScore);
    justification = `Replacement at $${replacementCost} provides best value. ` +
      `Repair cost of $${repairCost} carries ${Math.round(repairRisk * 100)}% risk. ` +
      `New mask ensures reliability.`;
  } else {
    recommendation = 'Retire';
    costBenefitScore = normalizeScore(retireScore);
    justification = `Retiring this mask is most economical. ` +
      `Total defect count (${defects.length}) and repair costs (${repairCost}) exceed mask value. ` +
      `Consider process changes or alternative masks.`;
  }

  return {
    orderID,
    repairCost,
    replacementCost,
    retirementCost,
    repairRisk,
    replacementRisk,
    retirementRisk,
    recommendation,
    costBenefitScore,
    justification
  };
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App.tsx (Router + Theme Provider)
  └── Layout.tsx (AppBar + Sidebar + Main Content)
      ├── Dashboard.tsx
      │   ├── Metrics Cards
      │   ├── Recent Defects Table
      │   ├── Mask Status Summary
      │   └── DefectForm.tsx (Dialog)
      │       └── ImageUpload.tsx
      │
      ├── DefectsPage.tsx
      │   └── DefectMap.tsx (D3.js visualization)
      │
      ├── PhotomasksPage.tsx
      │   └── Mask Cards Grid
      │
      ├── EquipmentPage.tsx
      │   ├── Metrics Cards
      │   ├── Equipment Table
      │   └── Equipment Detail Cards
      │
      ├── RemediationPage.tsx
      │   ├── Metrics Cards
      │   ├── Remediation Orders Table
      │   ├── Pending Approvals Section
      │   └── Approval Dialog
      │
      └── AnalyticsPage.tsx
          ├── Metrics Cards
          ├── Defect Type Distribution
          └── Severity Distribution
```

### State Management Strategy

#### Server State (React Query)
All server-side data managed through TanStack Query hooks:

**Defect Hooks** (`hooks/useDefects.ts`):
- `useDefects()` - Fetch all defects
- `useDefect(id)` - Fetch single defect
- `useDefectsByMask(maskID)` - Filter by mask
- `useCreateDefect()` - Create mutation
- `useUpdateDefect()` - Update mutation
- `useDeleteDefect()` - Delete mutation
- `useCriticalDefects()` - Pre-filtered query
- `useRecentDefects()` - Dashboard query

**Photomask Hooks** (`hooks/usePhotomasks.ts`):
- `usePhotomasks()` - Fetch all masks
- `usePhotomask(id)` - Fetch single mask
- `usePhotomaskHistory(maskID)` - Timeline
- `usePhotomaskCostSummary(maskID)` - Cost data
- `useActiveMasks()` - Status filter
- `useQuarantinedMasks()` - Status filter

**Equipment Hooks** (`hooks/useEquipment.ts`):
- `useEquipment()` - Fetch all equipment
- `useEquipmentById(id)`
- `useEquipmentDefects(equipmentID)`
- `useActiveEquipment()`
- `useMalfunctioningEquipment()`

**Remediation Hooks** (`hooks/useRemediation.ts`):
- `useRemediationOrders()`
- `useRemediationOrder(id)`
- `usePendingApprovals()`
- `useSubmitForApproval()`
- `useApproveRemediation()`
- `useRejectRemediation()`
- `useCompleteRemediation()`

**Analytics Hooks** (`hooks/useAnalytics.ts`):
- `useDetectPatterns(maskID)` - 5-second polling
- `useCalculateCostBenefit(orderID)`
- `useAnalyzeEquipmentCorrelation(equipmentID)`
- `usePredictDefectRisk(maskID)`
- `useDefectStatistics(monthYear)`

**Caching Strategy**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,      // 2 minutes
      gcTime: 5 * 60 * 1000,         // 5 minutes (garbage collection)
      refetchOnWindowFocus: false,
      retry: 2
    }
  }
});

// Custom stale times for specific queries:
// - Pattern detection: 30 seconds (with 5-second polling)
// - Approval queries: 1 minute
// - Analytics: 5-10 minutes
// - Code lists: Infinity (static data)
```

#### Client State (Zustand)
Minimal client-only state for UI concerns (ready but not extensively used in Phase 2):

```typescript
// uiStore.ts
interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  selectedDefectID: string | null;
  setSelectedDefect: (id: string | null) => void;

  defectDialogOpen: boolean;
  openDefectDialog: () => void;
  closeDefectDialog: () => void;
}
```

### Data Fetching Patterns

#### Standard Query Pattern
```typescript
// Component example
function DefectsPage() {
  const { data: defects, isLoading, error } = useDefects();

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return <DefectMap defects={defects} />;
}
```

#### Mutation Pattern with Optimistic Updates
```typescript
function DefectForm() {
  const queryClient = useQueryClient();

  const createMutation = useCreateDefect({
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['defects'] });
      queryClient.invalidateQueries({ queryKey: ['recentDefects'] });
    }
  });

  const handleSubmit = async (data) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={createMutation.isPending}>
        {createMutation.isPending ? 'Creating...' : 'Create Defect'}
      </Button>
    </form>
  );
}
```

#### Polling Pattern (Pattern Detection)
```typescript
function usePatternDetectionPolling(maskID: string) {
  return useQuery({
    queryKey: ['patterns', maskID],
    queryFn: () => analyticsAPI.detectPatterns(maskID, 0.9),
    enabled: !!maskID,
    refetchInterval: 5000,  // Poll every 5 seconds
    staleTime: 30000,        // Consider stale after 30 seconds
  });
}
```

---

## Development Guidelines

### Code Structure Standards

#### Backend (CAP)

**File Naming**:
- Service definitions: `<service-name>-service.cds`
- Service implementations: `<service-name>-service.js`
- Handlers: `handlers/<handler-name>-handler.js`
- Data models: `db/schema.cds`
- Seed data: `db/data/<namespace>-<entity>.csv`

**CDS Naming Conventions**:
- Entities: PascalCase (e.g., `Photomasks`)
- Fields: camelCase (e.g., `maskID`, `coordinateX`)
- Associations: camelCase (e.g., `defectType`)
- Actions: camelCase (e.g., `submitForApproval`)

**Handler Structure**:
```javascript
module.exports = cds.service.impl(async function() {
  const { Photomasks, Defects } = this.entities;

  // Before CREATE
  this.before('CREATE', 'Defects', async (req) => {
    // Validation logic
  });

  // After CREATE
  this.after('CREATE', 'Defects', async (data, req) => {
    // Post-processing
  });

  // Custom actions
  this.on('submitForApproval', async (req) => {
    // Action implementation
  });

  // Custom functions
  this.on('getDefectsByMask', async (req) => {
    // Function implementation
  });
});
```

#### Frontend (React)

**File Naming**:
- Components: PascalCase (e.g., `DefectMap.tsx`, `ImageUpload.tsx`)
- Pages: PascalCase (e.g., `Dashboard.tsx`, `DefectsPage.tsx`)
- Hooks: camelCase starting with `use` (e.g., `useDefects.ts`)
- Services: camelCase (e.g., `api.ts`)
- Utilities: camelCase (e.g., `formatters.ts`)

**Component Structure**:
```typescript
import React from 'react';
import { Box, Typography } from '@mui/material';

interface DefectMapProps {
  defects: Defect[];
  onDefectClick?: (defect: Defect) => void;
}

export const DefectMap: React.FC<DefectMapProps> = ({
  defects,
  onDefectClick
}) => {
  // Hooks
  const [zoom, setZoom] = React.useState(1);

  // Event handlers
  const handleZoom = (newZoom: number) => {
    setZoom(newZoom);
  };

  // Render
  return (
    <Box>
      {/* Component JSX */}
    </Box>
  );
};
```

**Custom Hook Pattern**:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { defectsAPI } from '../services/api';

export function useDefects() {
  return useQuery({
    queryKey: ['defects'],
    queryFn: defectsAPI.getAll,
    staleTime: 2 * 60 * 1000
  });
}

export function useCreateDefect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: defectsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defects'] });
    }
  });
}
```

### Testing Standards

#### Backend Testing
```javascript
// test/catalog-service.test.js
const cds = require('@sap/cds/lib');
const { expect } = require('chai');

describe('CatalogService', () => {
  let srv;

  before(async () => {
    srv = await cds.test(__dirname + '/..');
  });

  it('should auto-approve orders under $1000', async () => {
    const { data } = await srv.POST('/catalog/submitForApproval', {
      orderID: 'test-order-1'
    });

    expect(data.autoApproved).to.be.true;
    expect(data.status).to.equal('Auto-Approved');
  });

  it('should require approval for orders >= $1000', async () => {
    const { data } = await srv.POST('/catalog/submitForApproval', {
      orderID: 'test-order-2'
    });

    expect(data.autoApproved).to.be.false;
    expect(data.status).to.equal('Pending Approval');
  });
});
```

#### Frontend Testing
```typescript
// components/DefectMap.test.tsx
import { render, screen } from '@testing-library/react';
import { DefectMap } from './DefectMap';

describe('DefectMap', () => {
  const mockDefects = [
    {
      ID: '1',
      defectID: 'DEF-001',
      coordinateX: 1000,
      coordinateY: 2000,
      severity: 'Critical'
    }
  ];

  it('renders defect markers', () => {
    render(<DefectMap defects={mockDefects} />);
    expect(screen.getByTestId('defect-marker-1')).toBeInTheDocument();
  });

  it('handles zoom controls', () => {
    const { container } = render(<DefectMap defects={mockDefects} />);
    const zoomIn = screen.getByLabelText('Zoom In');

    fireEvent.click(zoomIn);
    expect(container.querySelector('.defect-map')).toHaveStyle('transform: scale(2)');
  });
});
```

### Performance Optimization

#### Backend
1. **Database Indexing**: Add indexes on frequently queried fields
   ```cds
   entity Defects {
     @cds.index
     maskID: String(50);
     @cds.index
     defectType: Association to DefectTypes;
     @cds.index
     detectedDate: DateTime;
   }
   ```

2. **Pagination**: Use `$top` and `$skip` for large result sets
   ```javascript
   const defects = await SELECT.from(Defects)
     .limit(100)
     .offset(0)
     .orderBy('detectedDate desc');
   ```

3. **Selective Columns**: Only fetch required fields
   ```javascript
   const defects = await SELECT.from(Defects)
     .columns(['ID', 'defectID', 'coordinateX', 'coordinateY', 'severity']);
   ```

#### Frontend
1. **Code Splitting**: Lazy load routes
   ```typescript
   const DefectsPage = lazy(() => import('./pages/DefectsPage'));
   const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
   ```

2. **Memoization**: Prevent unnecessary re-renders
   ```typescript
   const memoizedValue = useMemo(() => {
     return expensiveCalculation(defects);
   }, [defects]);
   ```

3. **Virtual Scrolling**: For large lists (future enhancement)
   ```typescript
   import { FixedSizeList } from 'react-window';
   ```

---

## Security Considerations

### Authentication & Authorization

#### Development (Current)
- Mock authentication using CAP's built-in middleware
- Test users: alice, bob, charlie
- No password validation (development only)

#### Production (Phase 6 Roadmap)
- XSUAA integration for SAP BTP
- OAuth 2.0 / OpenID Connect
- Role-based access control (RBAC)
- Multi-tenant isolation

### Data Validation

#### Input Validation
All user inputs validated at multiple layers:

1. **Frontend (TypeScript)**:
   ```typescript
   interface CreateDefectRequest {
     maskID: string;
     defectType: string;
     coordinateX: number;  // Must be >= 0
     coordinateY: number;  // Must be >= 0
     imageData: File;      // Max 1 MB
   }
   ```

2. **Backend (CAP)**:
   ```cds
   entity Defects {
     coordinateX: Decimal(12,6) @mandatory @assert.range: [0, 999999.999999];
     coordinateY: Decimal(12,6) @mandatory @assert.range: [0, 999999.999999];
   }
   ```

3. **Custom Handlers**:
   ```javascript
   this.before('CREATE', 'Defects', async (req) => {
     const { coordinateX, coordinateY } = req.data;

     if (coordinateX < 0 || coordinateY < 0) {
       req.error(400, 'Coordinates must be non-negative');
     }

     if (coordinateX > 999999 || coordinateY > 999999) {
       req.error(400, 'Coordinates exceed maximum mask size');
     }
   });
   ```

#### SQL Injection Prevention
- CAP's CDS QL prevents SQL injection by design
- No raw SQL queries used
- All queries use parameterized statements

#### XSS Prevention
- React automatically escapes JSX content
- DOMPurify used for any HTML rendering (if needed)
- Content Security Policy headers (production)

### File Upload Security

**Image Handler Validation**:
```javascript
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024  // 1 MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});
```

---

## Deployment Architecture

### Development Environment

```
Developer Workstation
  ├── Backend: npm start → http://localhost:4004
  ├── Frontend: npm run dev → http://localhost:5173
  └── Database: SQLite in-memory
```

### Production Environment (SAP BTP)

```
SAP Business Technology Platform
  ├── Cloud Foundry Runtime
  │   ├── CAP Application (Node.js)
  │   │   ├── Instances: 2+ (for HA)
  │   │   ├── Memory: 512 MB per instance
  │   │   └── Bindings:
  │   │       ├── HANA DB
  │   │       ├── XSUAA (authentication)
  │   │       └── Destination (for S/4HANA)
  │   │
  │   └── Static Frontend (HTML5 Application Repository)
  │       ├── React build artifacts
  │       └── Served via App Router
  │
  ├── SAP HANA Cloud
  │   ├── Schema: <app-name>
  │   └── HDI Container
  │
  └── Services
      ├── XSUAA (authentication)
      ├── Destination (external systems)
      └── Connectivity (on-premise)
```

### Container Deployment (Alternative)

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build frontend
WORKDIR /app/app/photomask-ui
RUN npm ci
RUN npm run build

# Prepare CAP
WORKDIR /app
RUN npx cds build --production

EXPOSE 4004

CMD ["node", "server.js"]
```

**docker-compose.yml**:
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
      - DB_HOST=${DB_HOST}
      - DB_PORT=${DB_PORT}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
    depends_on:
      - db

  db:
    image: saplabs/hanaexpress:latest
    ports:
      - "39017:39017"
      - "39041-39045:39041-39045"
    volumes:
      - hana-data:/hana/mounts
    environment:
      - AGREE_TO_SAP_LICENSE=Y
      - MASTER_PASSWORD=${HANA_PASSWORD}

volumes:
  hana-data:
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Port Already in Use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::4004`

**Solution**:
```bash
# Find process using port 4004
lsof -i :4004

# Kill the process
kill -9 <PID>

# Or use a different port
cds serve --port 4005
```

#### Issue 2: Module Not Found

**Symptom**: `Error: Cannot find module '@sap/cds'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify CAP installation
npx cds version
```

#### Issue 3: Database Locked (SQLite)

**Symptom**: `Error: SQLITE_BUSY: database is locked`

**Solution**:
```bash
# Stop all CAP instances
pkill -f "cds watch"

# Remove database file
rm -f db.sqlite*

# Restart
cds watch
```

#### Issue 4: Frontend Build Fails

**Symptom**: `Error: Cannot resolve module 'xyz'`

**Solution**:
```bash
cd app/photomask-ui

# Clear cache and reinstall
rm -rf node_modules .vite package-lock.json
npm install

# Rebuild
npm run build
```

#### Issue 5: CORS Errors

**Symptom**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution** (in development):
```javascript
// server.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## Additional Resources

### SAP CAP Documentation
- [CAP Official Docs](https://cap.cloud.sap/docs/)
- [CDS Language Reference](https://cap.cloud.sap/docs/cds/)
- [CAP Node.js Runtime](https://cap.cloud.sap/docs/node.js/)

### React & Frontend
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [D3.js Documentation](https://d3js.org/)

### Tools
- [OData v4 Specification](https://www.odata.org/documentation/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Maintained By**: Engineering Team
**Review Cycle**: Quarterly
