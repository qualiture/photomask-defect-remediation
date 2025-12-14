using { photomask.defect } from '../db/schema';
using { User } from '@sap/cds/common';

service CatalogService @(path: '/catalog') {
  // ========================================
  // MAIN ENTITIES - Full CRUD
  // ========================================

  entity Photomasks as projection on defect.Photomasks;
  entity Defects as projection on defect.Defects;
  entity Equipment as projection on defect.Equipment;
  entity EquipmentUsage as projection on defect.EquipmentUsage;
  entity RemediationOrders as projection on defect.RemediationOrders;
  entity RemediationTasks as projection on defect.RemediationTasks;
  entity Vendors as projection on defect.Vendors;

  // ========================================
  // CODE LISTS - Read-only
  // ========================================

  @readonly entity MaskStatuses as projection on defect.MaskStatuses;
  @readonly entity DefectTypes as projection on defect.DefectTypes;
  @readonly entity RemediationTypes as projection on defect.RemediationTypes;
  @readonly entity Severities as projection on defect.Severities;

  // ========================================
  // ACTIONS - Workflow operations
  // ========================================

  /**
   * Submit remediation order for approval
   * Auto-approves if cost < $1,000
   * Requires manual approval if cost >= $1,000
   */
  action submitForApproval(
    orderID : UUID
  ) returns {
    orderID : UUID;
    status : String;
    autoApproved : Boolean;
    message : String;
  };

  /**
   * Approve a remediation order (manual approval)
   * Called when requiresApproval is true (cost >= $1,000)
   */
  action approveRemediation(
    orderID : UUID,
    approverNotes : String,
    approverUser : User
  ) returns {
    orderID : UUID;
    status : String;
    approvalDate : DateTime;
  };

  /**
   * Reject a remediation order
   */
  action rejectRemediation(
    orderID : UUID,
    rejectionReason : String,
    rejectionUser : User
  ) returns {
    orderID : UUID;
    status : String;
  };

  /**
   * Mark remediation as completed
   */
  action completeRemediation(
    orderID : UUID,
    actualCost : Decimal,
    completionNotes : String,
    completionUser : User
  ) returns {
    orderID : UUID;
    status : String;
    actualCost : Decimal;
  };

  // ========================================
  // FUNCTIONS - Read-only queries
  // ========================================

  /**
   * Get all defects for a specific photomask
   */
  function getDefectsByMask(
    maskID : String
  ) returns array of Defects;

  /**
   * Get mask history including defect count, timeline, and cost impact
   */
  function getMaskHistory(
    maskID : UUID
  ) returns {
    maskID : String;
    layer : String;
    technology : String;
    lifecycleStage : String;
    defectCount : Integer;
    criticalDefects : Integer;
    majorDefects : Integer;
    minorDefects : Integer;
    totalRemediationCost : Decimal;
    timeline : array of {
      date : DateTime;
      eventType : String;
      description : String;
      defectCount : Integer;
    };
  };

  /**
   * Get severity level for a defect based on location and type
   * Factors: defect type, location in critical area, AI confidence
   */
  function calculateDefectSeverity(
    defectType : String,
    coordinateX : Decimal,
    coordinateY : Decimal,
    maskID : UUID,
    aiConfidence : Decimal
  ) returns {
    severity : String;
    level : Integer;
    reason : String;
    inCriticalArea : Boolean;
  };

  /**
   * Get equipment correlation data for a specific equipment
   * 24-hour window analysis
   */
  function getEquipmentDefects(
    equipmentID : UUID,
    hoursLookback : Integer
  ) returns {
    equipmentID : UUID;
    equipmentName : String;
    defectCount : Integer;
    defectTypes : array of {
      type : String;
      count : Integer;
    };
    correlationStrength : Decimal;
    recommendation : String;
  };

  /**
   * List remediation orders with pending approval
   */
  function getPendingApprovals(
  ) returns array of {
    orderID : UUID;
    orderNumber : String;
    maskID : String;
    estimatedCost : Decimal;
    submittedDate : DateTime;
    remediationType : String;
  };

  /**
   * Get cost impact summary for a photomask
   */
  function getMaskCostSummary(
    maskID : UUID
  ) returns {
    maskID : UUID;
    estimatedValue : Decimal;
    totalDefectImpact : Decimal;
    totalRemediationCost : Decimal;
    netValue : Decimal;
    costTrend : String;
  };
}
