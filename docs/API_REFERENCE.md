# API Reference - Photomask Defect Analytics & Remediation Tracker

## API Overview

The system exposes OData v4 REST APIs through two main services:

- **CatalogService** (`/catalog`) - Main CRUD operations and workflow management
- **AnalyticsService** (`/analytics`) - Pattern detection and analytics

**Base URL**: `http://localhost:4004` (development) | `https://<app-name>.cfapps.<region>.hana.ondemand.com` (production)

**Protocol**: OData v4 REST API
**Authentication**: Mock (development) | XSUAA OAuth 2.0 (production)
**Content-Type**: `application/json`

---

## CatalogService API

**Base Path**: `/catalog`

### Entities

#### Photomasks

**Endpoint**: `/catalog/Photomasks`

**Methods**: GET, POST, PATCH, DELETE

**Entity Structure**:
```json
{
  "ID": "uuid",
  "maskID": "string(50)",
  "layer": "string(100)",
  "technology": "string(50)",
  "manufacturer": "string(100)",
  "receivedDate": "date",
  "status_code": "string(20)",
  "lifecycleStage": "string(50)",
  "usageCount": "integer",
  "estimatedValue": "decimal(15,2)",
  "valueCurrency_code": "string(3)",
  "layoutImageURL": "string(500)",
  "layoutImageData": "binary",
  "createdAt": "datetime",
  "createdBy": "string",
  "modifiedAt": "datetime",
  "modifiedBy": "string"
}
```

**Examples**:

**Get all photomasks**:
```http
GET /catalog/Photomasks
```

Response:
```json
{
  "value": [
    {
      "ID": "123e4567-e89b-12d3-a456-426614174000",
      "maskID": "MASK-M001",
      "layer": "Metal 1",
      "technology": "7nm",
      "manufacturer": "Vendor A",
      "receivedDate": "2025-01-15",
      "status_code": "IN_USE",
      "lifecycleStage": "In-Use",
      "usageCount": 45,
      "estimatedValue": 12000.00,
      "valueCurrency_code": "USD"
    }
  ]
}
```

**Get single photomask**:
```http
GET /catalog/Photomasks(123e4567-e89b-12d3-a456-426614174000)
```

**Get photomask with expanded defects**:
```http
GET /catalog/Photomasks(123e4567-e89b-12d3-a456-426614174000)?$expand=defects
```

**Filter photomasks by status**:
```http
GET /catalog/Photomasks?$filter=status_code eq 'IN_USE'
```

**Search photomasks by layer**:
```http
GET /catalog/Photomasks?$filter=contains(layer, 'Metal')
```

**Create photomask**:
```http
POST /catalog/Photomasks
Content-Type: application/json

{
  "maskID": "MASK-M011",
  "layer": "Metal 3",
  "technology": "5nm",
  "manufacturer": "Vendor B",
  "receivedDate": "2025-12-01",
  "status_code": "NEW",
  "lifecycleStage": "New",
  "usageCount": 0,
  "estimatedValue": 18000.00,
  "valueCurrency_code": "USD"
}
```

**Update photomask**:
```http
PATCH /catalog/Photomasks(123e4567-e89b-12d3-a456-426614174000)
Content-Type: application/json

{
  "usageCount": 46,
  "status_code": "QUARANTINE",
  "lifecycleStage": "Quarantine"
}
```

**Delete photomask**:
```http
DELETE /catalog/Photomasks(123e4567-e89b-12d3-a456-426614174000)
```

---

#### Defects

**Endpoint**: `/catalog/Defects`

**Methods**: GET, POST, PATCH, DELETE

**Entity Structure**:
```json
{
  "ID": "uuid",
  "defectID": "string(50)",
  "detectedDate": "datetime",
  "detectionMethod": "string(50)",
  "defectType_code": "string(30)",
  "severity": "string(20)",
  "severityReason": "string(200)",
  "priority": "integer",
  "coordinateX": "decimal(12,6)",
  "coordinateY": "decimal(12,6)",
  "zone": "string(50)",
  "affectedArea": "decimal(10,2)",
  "imageData": "binary",
  "imageType": "string",
  "imageThumbnail": "binary",
  "imageURL": "string(500)",
  "annotatedImageURL": "string(500)",
  "rootCause": "string(500)",
  "patternGroup": "string(100)",
  "aiConfidence": "decimal(3,2)",
  "impactsYield": "boolean",
  "estimatedImpact": "decimal(15,2)",
  "mask_ID": "uuid",
  "equipment_ID": "uuid",
  "remediation_ID": "uuid"
}
```

**Examples**:

**Get all defects**:
```http
GET /catalog/Defects
```

**Get defects with photomask info**:
```http
GET /catalog/Defects?$expand=mask
```

**Filter critical defects**:
```http
GET /catalog/Defects?$filter=severity eq 'Critical'
```

**Filter by mask ID**:
```http
GET /catalog/Defects?$filter=mask/maskID eq 'MASK-M001'
```

**Filter by detection date**:
```http
GET /catalog/Defects?$filter=detectedDate ge 2025-12-01T00:00:00Z
```

**Sort by severity and date**:
```http
GET /catalog/Defects?$orderby=severity desc,detectedDate desc
```

**Pagination**:
```http
GET /catalog/Defects?$top=20&$skip=0
```

**Create defect**:
```http
POST /catalog/Defects
Content-Type: application/json

{
  "defectID": "DEF-M001-011",
  "detectedDate": "2025-12-14T10:30:00Z",
  "detectionMethod": "Inspection",
  "defectType_code": "PARTICLE",
  "severity": "Major",
  "coordinateX": 25000.500000,
  "coordinateY": 30000.750000,
  "affectedArea": 150.5,
  "aiConfidence": 0.92,
  "impactsYield": false,
  "mask_ID": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Create defect with image upload** (multipart/form-data):
```http
POST /catalog/Defects
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="maskID"

MASK-M001
------WebKitFormBoundary
Content-Disposition: form-data; name="defectType"

PARTICLE
------WebKitFormBoundary
Content-Disposition: form-data; name="coordinateX"

25000.5
------WebKitFormBoundary
Content-Disposition: form-data; name="coordinateY"

30000.75
------WebKitFormBoundary
Content-Disposition: form-data; name="image"; filename="defect.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary--
```

---

#### Equipment

**Endpoint**: `/catalog/Equipment`

**Methods**: GET, POST, PATCH, DELETE

**Entity Structure**:
```json
{
  "ID": "uuid",
  "equipmentID": "string(50)",
  "equipmentName": "string(200)",
  "equipmentType": "string(100)",
  "manufacturer": "string(100)",
  "model": "string(100)",
  "location": "string(200)",
  "status": "string(50)",
  "lastMaintenance": "date",
  "nextMaintenance": "date",
  "maintenanceNotes": "string(500)"
}
```

**Examples**:

**Get all equipment**:
```http
GET /catalog/Equipment
```

**Filter active equipment**:
```http
GET /catalog/Equipment?$filter=status eq 'Active'
```

**Get equipment with defects**:
```http
GET /catalog/Equipment?$expand=defectsDetected
```

**Filter by type**:
```http
GET /catalog/Equipment?$filter=equipmentType eq 'Stepper'
```

**Filter equipment needing maintenance**:
```http
GET /catalog/Equipment?$filter=nextMaintenance lt 2025-12-31
```

---

#### RemediationOrders

**Endpoint**: `/catalog/RemediationOrders`

**Methods**: GET, POST, PATCH, DELETE

**Entity Structure**:
```json
{
  "ID": "uuid",
  "orderNumber": "string(50)",
  "orderDate": "datetime",
  "mask_ID": "uuid",
  "remediationType_code": "string(30)",
  "priority": "string(20)",
  "status": "string(50)",
  "estimatedCost": "decimal(15,2)",
  "actualCost": "decimal(15,2)",
  "costCurrency_code": "string(3)",
  "plannedStart": "date",
  "plannedEnd": "date",
  "actualStart": "date",
  "actualEnd": "date",
  "costBenefitScore": "decimal(5,2)",
  "recommendation": "string(20)",
  "justification": "string(1000)",
  "requiresApproval": "boolean",
  "approver": "string",
  "approvalDate": "datetime",
  "approvalNotes": "string(1000)",
  "vendor_ID": "uuid",
  "vendorOrderID": "string(100)",
  "vendorQuoteDate": "datetime"
}
```

**Examples**:

**Get all remediation orders**:
```http
GET /catalog/RemediationOrders
```

**Filter pending approvals**:
```http
GET /catalog/RemediationOrders?$filter=requiresApproval eq true and status eq 'Pending Approval'
```

**Filter by status**:
```http
GET /catalog/RemediationOrders?$filter=status eq 'In-Progress'
```

**Get orders with mask and defects**:
```http
GET /catalog/RemediationOrders?$expand=mask,defects
```

**Create remediation order**:
```http
POST /catalog/RemediationOrders
Content-Type: application/json

{
  "orderNumber": "REM-2025-001",
  "orderDate": "2025-12-14T10:00:00Z",
  "mask_ID": "123e4567-e89b-12d3-a456-426614174000",
  "remediationType_code": "REPAIR",
  "priority": "High",
  "status": "Draft",
  "estimatedCost": 750.00,
  "costCurrency_code": "USD",
  "plannedStart": "2025-12-15",
  "plannedEnd": "2025-12-16"
}
```

---

### Code Lists (Read-Only)

#### MaskStatuses

**Endpoint**: `/catalog/MaskStatuses`

**Values**:
```json
[
  { "code": "NEW", "name": "New", "description": "Recently received", "criticality": 1 },
  { "code": "IN_USE", "name": "In Use", "description": "Active in production", "criticality": 2 },
  { "code": "QUARANTINE", "name": "Quarantine", "description": "Temporarily removed", "criticality": 4 },
  { "code": "UNDER_REPAIR", "name": "Under Repair", "description": "Being remediated", "criticality": 3 },
  { "code": "RETIRED", "name": "Retired", "description": "End of life", "criticality": 5 }
]
```

#### DefectTypes

**Endpoint**: `/catalog/DefectTypes`

**Example Values**:
```json
[
  {
    "code": "PARTICLE",
    "name": "Particle Contamination",
    "category": "Contamination",
    "repairability": "Repairable",
    "description": "Foreign particle on mask surface"
  },
  {
    "code": "SCRATCH",
    "name": "Physical Scratch",
    "category": "Physical",
    "repairability": "Non-Repairable",
    "description": "Mechanical damage to mask surface"
  }
]
```

#### RemediationTypes

**Endpoint**: `/catalog/RemediationTypes`

#### Severities

**Endpoint**: `/catalog/Severities`

**Values**:
```json
[
  { "code": "CRITICAL", "name": "Critical", "level": 3, "description": "Immediate action required" },
  { "code": "MAJOR", "name": "Major", "level": 2, "description": "Action required soon" },
  { "code": "MINOR", "name": "Minor", "level": 1, "description": "Monitor and address" }
]
```

---

### Actions

Actions are invoked via POST requests and modify system state.

#### submitForApproval

Submit a remediation order for approval. Orders < $1,000 are auto-approved.

**Endpoint**: `POST /catalog/submitForApproval`

**Request**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Auto-Approved",
  "autoApproved": true,
  "message": "Order auto-approved (cost < $1,000)"
}
```

Or for orders ≥ $1,000:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Pending Approval",
  "autoApproved": false,
  "message": "Order requires manual approval (cost >= $1,000)"
}
```

---

#### approveRemediation

Manually approve a remediation order (for orders ≥ $1,000).

**Endpoint**: `POST /catalog/approveRemediation`

**Request**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "approverNotes": "Approved after cost-benefit review",
  "approverUser": "manager.john"
}
```

**Response**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Approved",
  "approvalDate": "2025-12-14T14:30:00Z"
}
```

---

#### rejectRemediation

Reject a remediation order.

**Endpoint**: `POST /catalog/rejectRemediation`

**Request**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "rejectionReason": "Cost exceeds budget threshold",
  "rejectionUser": "manager.john"
}
```

**Response**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Rejected"
}
```

---

#### completeRemediation

Mark a remediation order as completed.

**Endpoint**: `POST /catalog/completeRemediation`

**Request**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "actualCost": 725.50,
  "completionNotes": "Repair successful, mask returned to production",
  "completionUser": "tech.jane"
}
```

**Response**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "status": "Completed",
  "actualCost": 725.50
}
```

---

### Functions

Functions are read-only queries invoked via GET or POST.

#### getDefectsByMask

Get all defects for a specific photomask.

**Endpoint**: `GET /catalog/getDefectsByMask(maskID='MASK-M001')`

**Response**:
```json
{
  "value": [
    {
      "ID": "...",
      "defectID": "DEF-M001-001",
      "severity": "Critical",
      "coordinateX": 15000.5,
      "coordinateY": 22500.75
    }
  ]
}
```

---

#### getMaskHistory

Get mask history including defect timeline and cost impact.

**Endpoint**: `GET /catalog/getMaskHistory(maskID='123e4567-...')`

**Response**:
```json
{
  "maskID": "MASK-M001",
  "layer": "Metal 1",
  "technology": "7nm",
  "lifecycleStage": "In-Use",
  "defectCount": 3,
  "criticalDefects": 1,
  "majorDefects": 1,
  "minorDefects": 1,
  "totalRemediationCost": 2500.00,
  "timeline": [
    {
      "date": "2025-01-15T00:00:00Z",
      "eventType": "Received",
      "description": "Mask received from vendor",
      "defectCount": 0
    },
    {
      "date": "2025-02-10T08:30:00Z",
      "eventType": "Defect Detected",
      "description": "Particle contamination detected",
      "defectCount": 1
    }
  ]
}
```

---

#### calculateDefectSeverity

Calculate severity for a defect based on type, location, and AI confidence.

**Endpoint**: `GET /catalog/calculateDefectSeverity(...)`

**Parameters**:
- `defectType`: string - Defect type code
- `coordinateX`: decimal - X coordinate (nm)
- `coordinateY`: decimal - Y coordinate (nm)
- `maskID`: UUID - Photomask ID
- `aiConfidence`: decimal - AI confidence (0.0-1.0)

**Example**:
```http
GET /catalog/calculateDefectSeverity(
  defectType='SCRATCH',
  coordinateX=25000.5,
  coordinateY=30000.75,
  maskID='123e4567-e89b-12d3-a456-426614174000',
  aiConfidence=0.95
)
```

**Response**:
```json
{
  "severity": "Critical",
  "level": 3,
  "reason": "Non-repairable defect in critical area",
  "inCriticalArea": true
}
```

---

#### getEquipmentDefects

Get equipment correlation data (24-hour window analysis).

**Endpoint**: `GET /catalog/getEquipmentDefects(...)`

**Parameters**:
- `equipmentID`: UUID
- `hoursLookback`: integer (default: 24)

**Example**:
```http
GET /catalog/getEquipmentDefects(
  equipmentID='456e7890-e89b-12d3-a456-426614174000',
  hoursLookback=24
)
```

**Response**:
```json
{
  "equipmentID": "456e7890-e89b-12d3-a456-426614174000",
  "equipmentName": "ASML Stepper #001",
  "defectCount": 8,
  "defectTypes": [
    { "type": "Overlay Error", "count": 5 },
    { "type": "CD Variation", "count": 3 }
  ],
  "correlationStrength": 0.87,
  "recommendation": "Schedule alignment verification"
}
```

---

#### getPendingApprovals

List all remediation orders awaiting approval.

**Endpoint**: `GET /catalog/getPendingApprovals()`

**Response**:
```json
{
  "value": [
    {
      "orderID": "123e4567-...",
      "orderNumber": "REM-2025-001",
      "maskID": "MASK-M003",
      "estimatedCost": 5500.00,
      "submittedDate": "2025-12-13T10:00:00Z",
      "remediationType": "Comprehensive Repair"
    }
  ]
}
```

---

#### getMaskCostSummary

Get cost impact summary for a photomask.

**Endpoint**: `GET /catalog/getMaskCostSummary(maskID='123e4567-...')`

**Response**:
```json
{
  "maskID": "123e4567-...",
  "estimatedValue": 12000.00,
  "totalDefectImpact": 1500.00,
  "totalRemediationCost": 2500.00,
  "netValue": 8000.00,
  "costTrend": "Increasing"
}
```

---

## AnalyticsService API

**Base Path**: `/analytics`

### Entities (Read-Only)

#### DefectPatterns

**Endpoint**: `/analytics/DefectPatterns`

**Entity Structure**:
```json
{
  "ID": "uuid",
  "patternName": "string(100)",
  "patternType": "string(50)",
  "confidence": "decimal(3,2)",
  "confirmed": "boolean",
  "avgDistance": "decimal(10,2)",
  "orientation": "decimal(5,2)",
  "frequency": "integer",
  "centroidX": "decimal(12,6)",
  "centroidY": "decimal(12,6)",
  "suspectedCause": "string(500)",
  "correlatedEquipment_ID": "uuid",
  "correlationStrength": "decimal(3,2)",
  "analysisDate": "datetime",
  "mask_ID": "uuid"
}
```

**Examples**:

**Get all patterns**:
```http
GET /analytics/DefectPatterns
```

**Filter confirmed patterns**:
```http
GET /analytics/DefectPatterns?$filter=confirmed eq true
```

**Filter by confidence**:
```http
GET /analytics/DefectPatterns?$filter=confidence ge 0.95
```

---

### Functions

#### detectPatterns

Detect spatial patterns using DBSCAN clustering.

**Endpoint**: `POST /analytics/detectPatterns`

**Request**:
```json
{
  "maskID": "123e4567-e89b-12d3-a456-426614174000",
  "confidence_threshold": 0.9
}
```

**Response**:
```json
{
  "value": [
    {
      "patternName": "PATTERN-MASK-M001-0",
      "patternType": "Cluster",
      "confidence": 0.94,
      "defectCount": 7,
      "centroidX": 28500.3,
      "centroidY": 32000.5,
      "coordinates": [
        { "x": 27000.1, "y": 31500.2 },
        { "x": 28000.4, "y": 32000.8 },
        { "x": 29000.2, "y": 32500.1 }
      ],
      "suspectedCause": "Localized contamination or equipment-induced damage",
      "requiresConfirmation": true
    }
  ]
}
```

---

#### confirmPattern

Confirm a detected pattern and save to database.

**Endpoint**: `POST /analytics/confirmPattern`

**Request**:
```json
{
  "patternName": "PATTERN-MASK-M001-0",
  "maskID": "123e4567-e89b-12d3-a456-426614174000",
  "suspectedCause": "Cleaning station contamination",
  "correlatedEquipmentID": "789e0123-e89b-12d3-a456-426614174000"
}
```

**Response**:
```json
{
  "patternID": "abc12345-e89b-12d3-a456-426614174000",
  "patternName": "PATTERN-MASK-M001-0",
  "status": "Confirmed"
}
```

---

#### calculateCostBenefit

Calculate cost-benefit analysis for remediation order.

**Endpoint**: `POST /analytics/calculateCostBenefit`

**Request**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response**:
```json
{
  "orderID": "123e4567-e89b-12d3-a456-426614174000",
  "repairCost": 8000.00,
  "replacementCost": 15000.00,
  "retirementCost": 12000.00,
  "repairRisk": 0.30,
  "replacementRisk": 0.10,
  "retirementRisk": 0.40,
  "recommendation": "Repair",
  "costBenefitScore": 7.2,
  "justification": "Repair is most cost-effective at $8,000 with 30% risk. Replacement would cost $15,000. Repair recommended if success probability >70%."
}
```

---

#### analyzeEquipmentCorrelation

Analyze equipment-defect correlation (24-hour window).

**Endpoint**: `POST /analytics/analyzeEquipmentCorrelation`

**Request**:
```json
{
  "equipmentID": "456e7890-e89b-12d3-a456-426614174000",
  "dateFrom": "2025-12-10",
  "dateTo": "2025-12-14"
}
```

**Response**:
```json
{
  "equipmentID": "456e7890-e89b-12d3-a456-426614174000",
  "equipmentName": "ASML Stepper #001",
  "defectCount": 12,
  "defectRate": 0.15,
  "defectRateChange": 0.08,
  "mostCommonDefectType": "Overlay Error",
  "trend": "Increasing",
  "recommendation": "Schedule preventive maintenance for alignment system",
  "correlationStrength": 0.87
}
```

---

#### predictDefectRisk

Predict defect risk for a photomask.

**Endpoint**: `POST /analytics/predictDefectRisk`

**Request**:
```json
{
  "maskID": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response**:
```json
{
  "maskID": "123e4567-e89b-12d3-a456-426614174000",
  "riskScore": 0.72,
  "factors": [
    { "factor": "High usage count (120 exposures)", "weight": 0.30, "impact": "High" },
    { "factor": "Recent defect activity (3 in last week)", "weight": 0.25, "impact": "Medium" },
    { "factor": "Critical area defects (2)", "weight": 0.20, "impact": "High" },
    { "factor": "Lifecycle stage (In-Use, mature)", "weight": 0.15, "impact": "Medium" }
  ],
  "recommendedAction": "Schedule proactive inspection and consider preventive cleaning",
  "confidenceLevel": 0.85
}
```

---

#### getDefectStatistics

Get defect statistics for a time period.

**Endpoint**: `POST /analytics/getDefectStatistics`

**Request**:
```json
{
  "monthYear": "2025-12"
}
```

**Response**:
```json
{
  "period": "2025-12",
  "totalDefects": 42,
  "byType": [
    { "defectType": "Particle Contamination", "count": 15, "avgSeverity": 2.2 },
    { "defectType": "Physical Scratch", "count": 10, "avgSeverity": 2.8 },
    { "defectType": "Pattern Defect", "count": 8, "avgSeverity": 1.9 }
  ],
  "bySeverity": [
    { "severity": "Critical", "count": 8 },
    { "severity": "Major", "count": 18 },
    { "severity": "Minor", "count": 16 }
  ],
  "totalCost": 45000.00,
  "avgCostPerDefect": 1071.43
}
```

---

#### getPatternTrends

Get pattern detection trends over time.

**Endpoint**: `POST /analytics/getPatternTrends`

**Request**:
```json
{
  "monthsLookback": 6
}
```

**Response**:
```json
{
  "value": [
    {
      "period": "2025-07",
      "patternCount": 3,
      "avgConfidence": 0.91,
      "confirmedPatterns": 2,
      "pendingConfirmation": 1
    },
    {
      "period": "2025-08",
      "patternCount": 5,
      "avgConfidence": 0.93,
      "confirmedPatterns": 4,
      "pendingConfirmation": 1
    }
  ]
}
```

---

#### compareMasks

Compare defect metrics between two masks.

**Endpoint**: `POST /analytics/compareMasks`

**Request**:
```json
{
  "maskID1": "123e4567-e89b-12d3-a456-426614174000",
  "maskID2": "234e5678-e89b-12d3-a456-426614174000"
}
```

**Response**:
```json
{
  "mask1ID": "123e4567-e89b-12d3-a456-426614174000",
  "mask2ID": "234e5678-e89b-12d3-a456-426614174000",
  "defectCountDiff": -5,
  "costDiff": -2500.00,
  "severityCompare": "Mask 1 has fewer critical defects",
  "patternSimilarity": 0.65,
  "recommendations": "Mask 1 performing better. Consider retiring Mask 2 if defect trends continue."
}
```

---

#### getCriticalAlerts

Get critical alerts requiring immediate attention.

**Endpoint**: `GET /analytics/getCriticalAlerts()`

**Response**:
```json
{
  "value": [
    {
      "alertID": "alert-001",
      "alertType": "Pattern Detected",
      "severity": "Critical",
      "maskID": "MASK-M005",
      "description": "High-confidence defect pattern detected (0.96) with 12 defects",
      "generatedDate": "2025-12-14T09:15:00Z",
      "actionRequired": "Confirm pattern and investigate suspected cause"
    },
    {
      "alertID": "alert-002",
      "alertType": "Equipment Correlation",
      "severity": "High",
      "maskID": "Multiple",
      "description": "ASML Scanner #002 shows elevated defect correlation (0.89)",
      "generatedDate": "2025-12-14T08:30:00Z",
      "actionRequired": "Schedule equipment maintenance"
    }
  ]
}
```

---

## OData Query Options

### Common Query Parameters

#### $filter (Filter)
Filter results based on conditions.

**Examples**:
```http
# Equality
GET /catalog/Defects?$filter=severity eq 'Critical'

# Comparison
GET /catalog/Defects?$filter=coordinateX gt 50000.0

# Logical operators
GET /catalog/Defects?$filter=severity eq 'Critical' and impactsYield eq true

# String functions
GET /catalog/Photomasks?$filter=contains(layer, 'Metal')
GET /catalog/Photomasks?$filter=startswith(maskID, 'MASK-M')

# Date functions
GET /catalog/Defects?$filter=detectedDate ge 2025-12-01T00:00:00Z
```

#### $expand (Expand Associations)
Include related entities in response.

**Examples**:
```http
# Single expansion
GET /catalog/Defects?$expand=mask

# Multiple expansions
GET /catalog/Defects?$expand=mask,equipment

# Nested expansion
GET /catalog/RemediationOrders?$expand=mask($expand=defects)
```

#### $select (Select Specific Fields)
Return only specified fields.

**Examples**:
```http
# Select specific fields
GET /catalog/Defects?$select=defectID,severity,coordinateX,coordinateY

# Select with expand
GET /catalog/Photomasks?$select=maskID,layer,technology&$expand=defects($select=defectID,severity)
```

#### $orderby (Sort)
Sort results by one or more fields.

**Examples**:
```http
# Ascending
GET /catalog/Defects?$orderby=detectedDate

# Descending
GET /catalog/Defects?$orderby=detectedDate desc

# Multiple fields
GET /catalog/Defects?$orderby=severity desc,detectedDate desc
```

#### $top and $skip (Pagination)
Limit and offset results.

**Examples**:
```http
# First 20 results
GET /catalog/Defects?$top=20

# Skip first 20, get next 20
GET /catalog/Defects?$top=20&$skip=20

# Page 3 (items 41-60)
GET /catalog/Defects?$top=20&$skip=40
```

#### $count (Count)
Get total count of results.

**Examples**:
```http
# Include count in response
GET /catalog/Defects?$count=true

# Get only count
GET /catalog/Defects/$count
```

#### $search (Full-Text Search)
Search across all text fields (if enabled).

**Examples**:
```http
GET /catalog/Photomasks?$search=Metal
GET /catalog/Defects?$search="Particle Contamination"
```

---

## Error Handling

### Error Response Format

All errors follow OData v4 error format:

```json
{
  "error": {
    "code": "400",
    "message": "Coordinates must be non-negative",
    "details": [
      {
        "code": "VALIDATION_ERROR",
        "message": "coordinateX value -100.5 is invalid",
        "target": "coordinateX"
      }
    ]
  }
}
```

### Common Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | Bad Request | Invalid request syntax or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Entity not found |
| 409 | Conflict | Duplicate key or constraint violation |
| 413 | Payload Too Large | Image exceeds 1 MB limit |
| 422 | Unprocessable Entity | Business logic validation failed |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Validation Errors

**Coordinate Validation**:
```json
{
  "error": {
    "code": "400",
    "message": "Coordinates exceed maximum mask size",
    "details": [{
      "code": "COORDINATE_OUT_OF_RANGE",
      "message": "coordinateX value 1000000.5 exceeds maximum 999999.999999",
      "target": "coordinateX"
    }]
  }
}
```

**Image Size Validation**:
```json
{
  "error": {
    "code": "413",
    "message": "Image file size exceeds 1 MB limit",
    "details": [{
      "code": "FILE_TOO_LARGE",
      "message": "File size 1.5 MB exceeds maximum 1 MB",
      "target": "imageData"
    }]
  }
}
```

**Business Rule Validation**:
```json
{
  "error": {
    "code": "422",
    "message": "Cannot approve order that is not pending",
    "details": [{
      "code": "INVALID_STATE_TRANSITION",
      "message": "Order status 'Completed' cannot transition to 'Approved'",
      "target": "status"
    }]
  }
}
```

---

## Authentication

### Development (Mock Auth)
```http
# No authentication required in development mode
GET /catalog/Photomasks
```

### Production (OAuth 2.0)
```http
# 1. Obtain access token
POST https://auth.server.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>

# Response
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}

# 2. Use access token
GET /catalog/Photomasks
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Rate Limiting

**Development**: No limits

**Production**:
- **Standard APIs**: 100 requests/minute per client
- **Analytics APIs**: 20 requests/minute per client
- **Pattern Detection**: 1 request/5 seconds per mask (polling)

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702567890
```

**Rate Limit Exceeded Response**:
```json
{
  "error": {
    "code": "429",
    "message": "Rate limit exceeded",
    "details": [{
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Maximum 100 requests per minute exceeded. Retry after 30 seconds.",
      "retryAfter": 30
    }]
  }
}
```

---

## Testing & Examples

### cURL Examples

**Get all defects**:
```bash
curl -X GET "http://localhost:4004/catalog/Defects" \
  -H "Accept: application/json"
```

**Create defect**:
```bash
curl -X POST "http://localhost:4004/catalog/Defects" \
  -H "Content-Type: application/json" \
  -d '{
    "defectID": "DEF-TEST-001",
    "detectedDate": "2025-12-14T10:00:00Z",
    "defectType_code": "PARTICLE",
    "coordinateX": 10000.5,
    "coordinateY": 15000.75,
    "mask_ID": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

**Upload defect with image**:
```bash
curl -X POST "http://localhost:4004/catalog/Defects" \
  -F "maskID=MASK-M001" \
  -F "defectType=PARTICLE" \
  -F "coordinateX=10000.5" \
  -F "coordinateY=15000.75" \
  -F "image=@/path/to/defect.jpg"
```

**Submit for approval**:
```bash
curl -X POST "http://localhost:4004/catalog/submitForApproval" \
  -H "Content-Type: application/json" \
  -d '{
    "orderID": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

**Detect patterns**:
```bash
curl -X POST "http://localhost:4004/analytics/detectPatterns" \
  -H "Content-Type: application/json" \
  -d '{
    "maskID": "123e4567-e89b-12d3-a456-426614174000",
    "confidence_threshold": 0.9
  }'
```

### Postman Collection

A Postman collection is available with pre-configured requests for all endpoints.

**Import URL**: `<repository>/docs/postman-collection.json`

---

## Changelog

### Version 1.0 (December 2025)
- Initial API release
- CatalogService with full CRUD operations
- AnalyticsService with DBSCAN pattern detection
- Auto-approval workflow for orders <$1,000
- Cost-benefit analysis endpoints
- Equipment correlation analysis (24-hour window)

---

**Document Version**: 1.0
**Last Updated**: December 2025
**API Version**: v1
**OData Version**: OData v4
**Maintained By**: API Team
