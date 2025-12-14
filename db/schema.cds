namespace photomask.defect;

using { cuid, managed, temporal } from '@sap/cds/common';
using { Currency, User, sap.common.CodeList } from '@sap/cds/common';

// ========================================
// ENUMERATIONS & CODE LISTS
// ========================================

entity MaskStatuses : CodeList {
  key code : String(20);
  name : String(100);
  description : String(500);
  criticality : Integer; // 1-5 for UI color coding
}

entity DefectTypes : CodeList {
  key code : String(30);
  name : String(100);
  category : String(50);      // Contamination, Pattern, Physical, etc.
  repairability : String(20);  // Repairable, Non-Repairable, Conditional
  description : String(500);
}

entity RemediationTypes : CodeList {
  key code : String(30);
  name : String(100);
  category : String(50);        // Repair, Cleaning, Replacement
  estimatedDuration : Integer;  // days
  typicalCost : Decimal(15,2);
  description : String(500);
}

entity Severities : CodeList {
  key code : String(20);
  name : String(100);
  level : Integer;
  description : String(500);
}

// ========================================
// CORE ENTITIES - PHOTOMASKS & DEFECTS
// ========================================

entity Photomasks : cuid, managed {
  maskID            : String(50) @mandatory @assert.unique;
  layer             : String(100);            // Process layer (Metal 1, Poly, etc.)
  technology        : String(50);             // 5nm, 7nm, etc.
  manufacturer      : String(100);
  receivedDate      : Date;
  status            : Association to MaskStatuses;
  lifecycleStage    : String(50);             // New, In-Use, Quarantine, Retired
  usageCount        : Integer default 0;
  estimatedValue    : Decimal(15,2);
  valueCurrency     : Currency;

  // Layout design reference
  layoutImageURL    : String(500);            // URL to mask layout image
  layoutImageData   : LargeBinary;            // Thumbnail of layout

  // Relationships
  defects           : Composition of many Defects on defects.mask = $self;
  equipment         : Association to many EquipmentUsage on equipment.mask = $self;
  remediations      : Composition of many RemediationOrders on remediations.mask = $self;
  criticalAreas     : Composition of many CriticalAreas on criticalAreas.mask = $self;
}

entity CriticalAreas : cuid {
  mask              : Association to Photomasks;
  areaName          : String(100);
  // Nanometer coordinates: top-left point
  coordinateX1      : Decimal(12,6);
  coordinateY1      : Decimal(12,6);
  // Nanometer coordinates: bottom-right point
  coordinateX2      : Decimal(12,6);
  coordinateY2      : Decimal(12,6);
  criticalityLevel  : Integer;                // 1-5
  notes             : String(500);
}

entity Defects : cuid, managed {
  defectID          : String(50) @mandatory @assert.unique;
  detectedDate      : DateTime @mandatory;
  detectionMethod   : String(50);             // Manual, Inspection, Equipment, etc.

  // Defect classification
  defectType        : Association to DefectTypes @mandatory;
  severity          : String(20);             // Critical, Major, Minor
  severityReason    : String(200);            // Why this severity was assigned
  priority          : Integer;

  // Spatial data - NANOMETER PRECISION
  coordinateX       : Decimal(12,6) @mandatory;  // Origin: top-left corner
  coordinateY       : Decimal(12,6) @mandatory;
  zone              : String(50);             // Die zone, reticle area, etc.
  affectedArea      : Decimal(10,2);          // Square nanometers

  // Image/Visual data
  imageData         : LargeBinary @Core.MediaType : imageType;  // Full image
  imageType         : String @Core.IsMediaType;                  // MIME type
  imageThumbnail    : LargeBinary;            // Thumbnail for list views
  imageURL          : String(500);            // Reference/path to image
  annotatedImageURL : String(500);            // With defect highlights

  // Analysis
  rootCause         : String(500);
  patternGroup      : String(100);            // For pattern detection clustering
  aiConfidence      : Decimal(3,2);           // 0.00-1.00 from ML analysis

  // Impact assessment
  impactsYield      : Boolean default false;
  estimatedImpact   : Decimal(15,2);          // Cost impact in currency units

  // Relationships
  mask              : Association to Photomasks @mandatory;
  equipment         : Association to Equipment;                  // Equipment when detected
  remediation       : Association to RemediationOrders;          // Associated repair order
}

// ========================================
// EQUIPMENT & USAGE TRACKING
// ========================================

entity Equipment : cuid, managed {
  equipmentID       : String(50) @mandatory @assert.unique;
  equipmentName     : String(200);
  equipmentType     : String(100);            // Stepper, Scanner, Inspector, etc.
  manufacturer      : String(100);
  model             : String(100);
  location          : String(200);
  status            : String(50);             // Active, Maintenance, Retired

  // Maintenance tracking
  lastMaintenance   : Date;
  nextMaintenance   : Date;
  maintenanceNotes  : String(500);

  // Relationships
  usageHistory      : Composition of many EquipmentUsage on usageHistory.equipment = $self;
  defectsDetected   : Association to many Defects on defectsDetected.equipment = $self;
}

entity EquipmentUsage : cuid, managed {
  equipment         : Association to Equipment @mandatory;
  mask              : Association to Photomasks @mandatory;
  usageDate         : DateTime @mandatory;
  duration          : Integer;                // minutes
  operationType     : String(50);             // Exposure, Inspection, Cleaning, etc.

  // Correlation data
  defectsFound      : Integer default 0;
  yieldImpact       : Decimal(5,2);           // percentage
}

// ========================================
// REMEDIATION WORKFLOW
// ========================================

entity RemediationOrders : cuid, managed {
  orderNumber       : String(50) @mandatory @assert.unique;
  orderDate         : DateTime @mandatory;

  mask              : Association to Photomasks @mandatory;
  defects           : Association to many Defects on defects.remediation = $self;

  // Remediation details
  remediationType   : Association to RemediationTypes @mandatory;
  priority          : String(20);             // Urgent, High, Normal, Low
  status            : String(50);             // Draft, Approved, In-Progress, Completed, Cancelled

  // Cost estimation
  estimatedCost     : Decimal(15,2);
  actualCost        : Decimal(15,2);
  costCurrency      : Currency;

  // Timeline
  plannedStart      : Date;
  plannedEnd        : Date;
  actualStart       : Date;
  actualEnd         : Date;

  // AI-driven recommendations
  costBenefitScore  : Decimal(5,2);           // 0-100
  recommendation    : String(20);             // Repair, Replace, Retire
  justification     : String(1000);           // Why this recommendation

  // Approval workflow (single approver)
  requiresApproval  : Boolean;                // false if cost < $1000
  approver          : User;                   // Assigned approver
  approvalDate      : DateTime;
  approvalNotes     : String(1000);

  // Vendor integration (if applicable)
  vendor            : Association to Vendors;
  vendorOrderID     : String(100);
  vendorQuoteDate   : DateTime;

  // Sub-tasks
  tasks             : Composition of many RemediationTasks on tasks.order = $self;
}

entity RemediationTasks : cuid, managed {
  order             : Association to RemediationOrders @mandatory;
  taskNumber        : Integer;
  taskName          : String(200);
  description       : String(500);
  status            : String(50);             // Pending, In-Progress, Completed
  assignedTo        : User;
  completedDate     : DateTime;
  notes             : String(1000);
}

entity Vendors : cuid, managed {
  vendorID          : String(50) @mandatory @assert.unique;
  vendorName        : String(200);
  specialization    : String(100);            // Repair type specialty
  rating            : Decimal(3,2);           // 0.00-5.00
  avgTurnaround     : Integer;                // days
  contactEmail      : String(100);
  phone             : String(20);

  // Integration reference (for future S/4HANA)
  s4VendorCode      : String(10);             // SAP vendor master ID
}

// ========================================
// ANALYTICS & PATTERN DETECTION
// ========================================

entity DefectPatterns : cuid, managed {
  patternName       : String(100);
  patternType       : String(50);             // Cluster, Linear, Radial, Random
  confidence        : Decimal(3,2);           // 0.00-1.00, must be > 0.9 to alert
  confirmed         : Boolean default false;  // Manual confirmation required

  // Pattern characteristics
  avgDistance       : Decimal(10,2);          // Average distance between defects (nm)
  orientation       : Decimal(5,2);           // Degrees from horizontal
  frequency         : Integer;                // Number of defects in pattern
  centroidX         : Decimal(12,6);          // Center of pattern (nm)
  centroidY         : Decimal(12,6);

  // Root cause analysis
  suspectedCause    : String(500);
  correlatedEquipment : Association to Equipment;
  correlationStrength : Decimal(3,2);         // How strongly correlated to equipment
  analysisDate      : DateTime;

  // Relationships
  mask              : Association to Photomasks;
  defects           : Association to many Defects on defects.patternGroup = patternName;
}

// Computed view for trend analysis
entity DefectTrends {
  key period        : String(10);             // YYYY-MM or YYYY-WW
  key defectType    : Association to DefectTypes;
  count             : Integer;
  avgSeverity       : Decimal(3,2);
  totalCost         : Decimal(15,2);
}

// Summary statistics per mask
entity MaskDefectSummary {
  key maskID        : String(50);
  maskName          : String(100);
  totalDefects      : Integer;
  criticalDefects   : Integer;
  majorDefects      : Integer;
  minorDefects      : Integer;
  totalCost         : Decimal(15,2);
  lastDefectDate    : DateTime;
  activeRemediations : Integer;
}
