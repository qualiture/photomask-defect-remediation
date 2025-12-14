# Architecture Overview - Photomask Defect Analytics & Remediation Tracker

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Web Browser (Chrome, Firefox, Edge, Safari)                   │ │
│  │  - React 19 Single Page Application                            │ │
│  │  - Material-UI Components                                      │ │
│  │  - D3.js Visualization                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS / OData v4
┌──────────────────────────────▼──────────────────────────────────────┐
│                      Application Server Layer                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  SAP Cloud Application Programming (CAP) - Node.js Runtime     │ │
│  │                                                                 │ │
│  │  ┌──────────────────┐  ┌──────────────────┐                   │ │
│  │  │ CatalogService   │  │ AnalyticsService │                   │ │
│  │  │  - CRUD Ops      │  │  - ML Pattern    │                   │ │
│  │  │  - Workflow      │  │  - Cost Benefit  │                   │ │
│  │  │  - Validation    │  │  - Risk Analysis │                   │ │
│  │  └────────┬─────────┘  └────────┬─────────┘                   │ │
│  │           │                     │                              │ │
│  │  ┌────────▼─────────────────────▼─────────┐                   │ │
│  │  │     Custom Handlers & Business Logic    │                   │ │
│  │  │  - Image Processing (sharp, multer)     │                   │ │
│  │  │  - DBSCAN Pattern Detection (ml-dbscan) │                   │ │
│  │  │  - Auto-Approval Logic                  │                   │ │
│  │  │  - Severity Calculation                 │                   │ │
│  │  └─────────────────────┬───────────────────┘                   │ │
│  └────────────────────────┼───────────────────────────────────────┘ │
└───────────────────────────┼─────────────────────────────────────────┘
                            │ CDS QL / SQL
┌───────────────────────────▼─────────────────────────────────────────┐
│                         Data Layer                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Database (SQLite / SAP HANA)                                  │ │
│  │  - Core Entities (Photomasks, Defects, Equipment)             │ │
│  │  - Workflow Entities (RemediationOrders, Tasks)                │ │
│  │  - Analytics Entities (DefectPatterns, Trends)                 │ │
│  │  - Code Lists (MaskStatuses, DefectTypes)                      │ │
│  │  - Binary Storage (Images up to 1 MB)                          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architectural Patterns

### 1. Three-Tier Architecture

**Presentation Tier** (React Frontend)
- Single Page Application (SPA)
- Client-side routing with React Router
- State management via TanStack Query + Zustand
- Responsive Material-UI components

**Business Logic Tier** (CAP Backend)
- Service-oriented architecture
- Two main services: Catalog (CRUD) and Analytics (ML)
- Custom handlers for complex operations
- Stateless request handling

**Data Tier** (Database)
- SQLite (development) / SAP HANA (production)
- Entity-Relationship model
- Managed aspects (temporal, audit)
- Binary large object storage

### 2. Service-Oriented Architecture (SOA)

**Service Separation**:
- `CatalogService`: Transactional operations (CRUD, workflow)
- `AnalyticsService`: Read-heavy operations (reports, ML)

**Benefits**:
- Clear separation of concerns
- Independent scaling potential
- Easier testing and maintenance

### 3. Domain-Driven Design (DDD)

**Core Domain**: Photomask defect lifecycle management

**Bounded Contexts**:
1. **Defect Management**: Defect registration, tracking, classification
2. **Remediation Workflow**: Approval process, cost-benefit analysis
3. **Pattern Detection**: ML-based spatial analysis
4. **Equipment Correlation**: Equipment-defect relationship tracking

**Entities vs. Value Objects**:
- Entities: Photomasks, Defects, Equipment, RemediationOrders
- Value Objects: Coordinates (X, Y pair), Costs, Dates
- Aggregates: Photomask (root) + Defects + RemediationOrders

---

## Data Architecture

### Entity-Relationship Diagram

```
┌────────────────────┐
│   Photomasks       │
│  (Root Entity)     │
└─────────┬──────────┘
          │ 1
          │
          │ *
┌─────────▼──────────┐         ┌────────────────────┐
│     Defects        │ *    1  │    DefectTypes     │
│                    ├─────────│   (Code List)      │
└─────────┬──────────┘         └────────────────────┘
          │
          │ *
          │ 0..1
┌─────────▼──────────┐         ┌────────────────────┐
│ RemediationOrders  │ *    1  │ RemediationTypes   │
│                    ├─────────│   (Code List)      │
└─────────┬──────────┘         └────────────────────┘
          │
          │ *
          │ 1
┌─────────▼──────────┐
│ RemediationTasks   │
│                    │
└────────────────────┘

┌────────────────────┐         ┌────────────────────┐
│    Equipment       │ 1    *  │  EquipmentUsage    │
│                    ├─────────│                    │
└────────────────────┘         └────────────────────┘
          │ 1
          │
          │ *
┌─────────▼──────────┐
│  Defects           │  (equipment correlation)
└────────────────────┘

┌────────────────────┐         ┌────────────────────┐
│  DefectPatterns    │ 1    *  │    Defects         │
│                    ├─────────│ (via patternGroup) │
└────────────────────┘         └────────────────────┘
```

### Key Relationships

**1. Photomask → Defects (1:N Composition)**
- A photomask has many defects
- Defects cannot exist without a photomask
- Cascade delete: Deleting photomask deletes defects

**2. Photomask → RemediationOrders (1:N Composition)**
- A photomask has many remediation orders
- Orders tied to specific photomask

**3. RemediationOrder → RemediationTasks (1:N Composition)**
- An order has multiple tasks
- Tasks cannot exist without parent order

**4. Equipment → Defects (1:N Association)**
- Equipment can be linked to defects (correlation)
- Defect can exist without equipment link

**5. DefectPattern → Defects (1:N Association)**
- Pattern groups multiple defects
- Linked via `patternGroup` string field

---

## Component Architecture

### Backend Components

#### 1. Service Layer (`srv/`)

**catalog-service.cds**:
- OData service definition
- Entity projections
- Action/function signatures

**catalog-service.js**:
- Custom handlers implementation
- Before/after event handlers
- Business logic validation

**analytics-service.cds**:
- Analytics OData service
- Read-only entity projections
- ML function signatures

**analytics-service.js**:
- Pattern detection algorithms
- Cost-benefit calculations
- Risk prediction models

#### 2. Handler Layer (`srv/handlers/`)

**image-handler.js**:
- Multer configuration
- Image validation (size, format)
- Thumbnail generation (sharp)
- Binary data processing

#### 3. Data Layer (`db/`)

**schema.cds**:
- Entity definitions
- Relationships (associations, compositions)
- Type definitions
- Code list structures

**data/ (CSV seed files)**:
- Sample data for development
- Code list values
- Test fixtures

### Frontend Components

#### 1. Pages (`app/photomask-ui/src/pages/`)

**Dashboard.tsx**:
- Metrics cards
- Recent defects table
- Quick actions
- Defect creation dialog

**DefectsPage.tsx**:
- DefectMap component wrapper
- Defect list view (future)

**PhotomasksPage.tsx**:
- Photomask grid cards
- Status filtering

**EquipmentPage.tsx**:
- Equipment metrics
- Equipment table and cards
- Maintenance tracking

**RemediationPage.tsx**:
- Remediation orders table
- Pending approvals section
- Approval dialog

**AnalyticsPage.tsx**:
- Defect statistics
- Type distribution charts
- Severity breakdown

#### 2. Components (`app/photomask-ui/src/components/`)

**Layout.tsx**:
- App shell (AppBar + Sidebar)
- Navigation menu
- User profile

**DefectMap.tsx**:
- D3.js visualization
- SVG rendering
- Zoom/pan controls
- Interactive defect markers

**DefectForm.tsx**:
- Defect creation dialog
- Form validation
- Image upload integration

**ImageUpload.tsx**:
- Drag-and-drop interface
- File validation
- Preview generation

#### 3. Hooks (`app/photomask-ui/src/hooks/`)

**useDefects.ts**:
- `useDefects()` - Query hook
- `useCreateDefect()` - Mutation hook
- `useCriticalDefects()` - Filtered query

**usePhotomasks.ts**:
- Photomask CRUD hooks

**useEquipment.ts**:
- Equipment CRUD hooks

**useRemediation.ts**:
- Remediation workflow hooks
- Approval action hooks

**useAnalytics.ts**:
- Pattern detection (with polling)
- Cost-benefit analysis
- Statistics queries

#### 4. Services (`app/photomask-ui/src/services/`)

**api.ts**:
- Axios client configuration
- OData request builders
- Type-safe API methods
- Error handling

---

## Technology Stack Deep Dive

### Backend Stack

**SAP CAP 9.5.2**
- Framework: Model-driven development
- OData v4 auto-generation
- Built-in authentication/authorization
- Temporal and audit aspects

**Node.js 18+**
- Runtime: JavaScript execution
- NPM: Package management
- Async/await: Modern async patterns

**Key Libraries**:
- `ml-dbscan`: Spatial clustering algorithm
- `sharp`: Image processing and thumbnails
- `multer`: Multipart file upload handling

**Database**:
- Development: SQLite (embedded, in-memory)
- Production: SAP HANA Cloud (columnar, in-memory)
- Migration: CAP handles dialect differences

### Frontend Stack

**React 19.2.0**
- UI Library: Component-based
- Hooks: Modern state management
- Virtual DOM: Performance optimization

**TypeScript 5.x**
- Type Safety: Compile-time checks
- IntelliSense: IDE support
- Refactoring: Safer code changes

**Build Tool: Vite 7.2.4**
- Fast HMR (Hot Module Replacement)
- Optimized production builds
- Native ES modules support

**Key Libraries**:
- **Material-UI 7.3.6**: Component library, theming
- **TanStack Query 5.90.12**: Server state management, caching
- **React Router 7.10.1**: Client-side routing
- **Axios 1.13.2**: HTTP client with interceptors
- **D3.js 7.9.0**: Data visualization, SVG manipulation
- **Zustand 5.0.9**: Lightweight client state
- **date-fns 4.1.0**: Date utilities

---

## Design Patterns

### Backend Patterns

**1. Repository Pattern**
- CAP abstracts database access
- CDS QL provides type-safe queries
- No direct SQL needed

```javascript
// Repository-style query
const defects = await SELECT.from(Defects)
  .where({ mask_ID: maskID, severity: 'Critical' })
  .orderBy('detectedDate desc');
```

**2. Service Layer Pattern**
- Services expose business capabilities
- Handlers encapsulate business logic
- Clean separation from data layer

**3. Event-Driven Pattern**
- Before/After event handlers
- Decoupled validation and processing

```javascript
this.before('CREATE', 'Defects', async (req) => {
  // Validation before create
});

this.after('CREATE', 'Defects', async (data, req) => {
  // Post-processing after create
});
```

**4. Strategy Pattern (Cost-Benefit Analysis)**
- Multiple calculation strategies (Repair/Replace/Retire)
- Pluggable algorithm selection

### Frontend Patterns

**1. Container/Presentational Components**
- Containers: Data fetching, business logic (Pages)
- Presentational: Pure rendering (Components)

**2. Custom Hooks Pattern**
- Encapsulate data fetching logic
- Reusable across components

```typescript
// Custom hook encapsulation
function useDefects() {
  return useQuery({
    queryKey: ['defects'],
    queryFn: defectsAPI.getAll
  });
}
```

**3. Render Props / Children Pattern**
- Layout component wraps all pages
- Flexible composition

**4. Facade Pattern (API Service)**
- Single interface to OData complexity
- Type-safe API methods

---

## Security Architecture

### Authentication Flow (Production)

```
┌──────────┐                ┌──────────┐                ┌──────────┐
│  Client  │                │   XSUAA  │                │   CAP    │
│ (Browser)│                │  (OAuth) │                │  Backend │
└─────┬────┘                └─────┬────┘                └─────┬────┘
      │                           │                           │
      │ 1. Login Request          │                           │
      ├──────────────────────────>│                           │
      │                           │                           │
      │ 2. Auth Challenge         │                           │
      │<──────────────────────────┤                           │
      │                           │                           │
      │ 3. Credentials            │                           │
      ├──────────────────────────>│                           │
      │                           │                           │
      │ 4. Access Token (JWT)     │                           │
      │<──────────────────────────┤                           │
      │                           │                           │
      │ 5. API Request + Token    │                           │
      ├───────────────────────────┼──────────────────────────>│
      │                           │                           │
      │                           │ 6. Validate Token         │
      │                           │<──────────────────────────┤
      │                           │                           │
      │                           │ 7. Token Valid            │
      │                           ├──────────────────────────>│
      │                           │                           │
      │ 8. API Response           │                           │
      │<──────────────────────────┼──────────────────────────┤
      │                           │                           │
```

### Authorization Model

**Role-Based Access Control (RBAC)**:

1. **Roles**:
   - `Technician`: Create defects, view data
   - `Engineer`: Create defects, create remediation orders
   - `Manager`: All engineer permissions + approve orders
   - `Administrator`: All permissions + configuration

2. **Permissions** (CAP annotations):
```cds
service CatalogService {
  entity Defects @(requires: 'authenticated-user');
  entity RemediationOrders @(requires: 'Engineer');

  action approveRemediation @(requires: 'Manager');
}
```

3. **Data Isolation**:
   - Multi-tenant support via `@sap/cds-mtx`
   - Tenant-specific data isolation
   - User-based filtering (future: row-level security)

### Data Security

**Encryption**:
- In-transit: TLS 1.2+ (HTTPS)
- At-rest: Database encryption (HANA native)
- Sensitive fields: No PII stored

**Input Validation**:
- Frontend: TypeScript types, form validation
- Backend: CAP @assert annotations
- Custom handlers: Business rule validation

**Injection Prevention**:
- SQL Injection: CDS QL parameterization
- XSS: React auto-escaping
- File Upload: Type and size validation

---

## Performance Architecture

### Backend Optimizations

**1. Database Indexing**
```cds
entity Defects {
  @cds.index maskID: String(50);
  @cds.index detectedDate: DateTime;
  @cds.index severity: String(20);
}
```

**2. Query Optimization**
- Selective columns: Only fetch needed fields
- Pagination: `$top` and `$skip` support
- Lazy loading: Associations expanded on demand

**3. Caching** (Future Enhancement)
- Code lists cached in memory
- Pattern detection results cached (30s TTL)

### Frontend Optimizations

**1. React Query Caching**
```typescript
{
  staleTime: 2 * 60 * 1000,  // 2 minutes
  gcTime: 5 * 60 * 1000,     // 5 minutes
  refetchOnWindowFocus: false
}
```

**2. Code Splitting**
```typescript
const DefectsPage = lazy(() => import('./pages/DefectsPage'));
```

**3. Memoization**
```typescript
const expensiveCalculation = useMemo(() => {
  return calculateSeverityDistribution(defects);
}, [defects]);
```

**4. Virtual Scrolling** (Future)
- For large defect lists (>1000 items)
- Only render visible items

---

## Scalability Considerations

### Current Capacity

**Data Volume**:
- Photomasks: Up to 500
- Defects: Up to 5,000
- Equipment: Up to 50
- Remediation Orders: Up to 1,000
- Concurrent Users: Up to 50

**Performance Targets**:
- API Response: <200ms (p95)
- Page Load: <2 seconds
- Pattern Detection: <100ms for 1,000 defects

### Scaling Strategy

**Horizontal Scaling**:
- Stateless CAP backend
- Multiple instances behind load balancer
- Session affinity not required

**Vertical Scaling**:
- Increase instance memory for ML processing
- Increase database connection pool

**Future Optimizations**:
- Redis cache for pattern detection
- CDN for static frontend assets
- S3 for image storage (offload database)
- WebSocket for real-time updates

---

## Integration Architecture

### Current Integrations

**1. Frontend ↔ Backend**
- Protocol: HTTP/HTTPS
- Format: OData v4 JSON
- Authentication: Session-based (dev) / OAuth (prod)

### Future Integration Points

**1. SAP S/4HANA** (Phase 6+)
```
CAP Backend ↔ S/4HANA
  - Destination Service (SAP BTP)
  - OData APIs or RFC
  - Vendor Master (BP)
  - Purchase Orders (MM)
```

**2. MES (Manufacturing Execution System)**
```
CAP Backend ← MES
  - Equipment status updates
  - Real-time wafer data
  - Process parameters
```

**3. External ML Services** (Post-MVP)
```
CAP Backend → ML API
  - Advanced defect classification
  - Predictive maintenance
  - Yield prediction
```

---

## Deployment Architecture

### Development

```
Localhost
  ├── Backend: http://localhost:4004 (CAP)
  ├── Frontend: http://localhost:5173 (Vite)
  └── Database: SQLite in-memory
```

### Production (SAP BTP)

```
SAP Business Technology Platform
  ├── Cloud Foundry
  │   ├── CAP Application (2+ instances)
  │   ├── App Router (authentication gateway)
  │   └── HTML5 Application Repository (static frontend)
  │
  ├── SAP HANA Cloud
  │   └── HDI Container (schema, data)
  │
  └── Platform Services
      ├── XSUAA (authentication)
      ├── Destination (S/4HANA connectivity)
      └── Logging (application logs)
```

---

## Monitoring & Observability

### Metrics to Track

**Backend**:
- Request latency (p50, p95, p99)
- Error rate
- Database query time
- Pattern detection duration
- Active connections

**Frontend**:
- Page load time
- API call latency
- JavaScript errors
- User session duration

**Business Metrics**:
- Defects created per day
- Average time to remediation
- Auto-approval rate
- Pattern detection accuracy

### Logging Strategy

**Backend Logging**:
- CAP built-in logging
- Log levels: ERROR, WARN, INFO, DEBUG
- Structured JSON logs

**Frontend Logging**:
- Error boundary catches
- API error tracking
- User action logging (privacy-compliant)

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Maintained By**: Architecture Team
**Review Cycle**: Quarterly
