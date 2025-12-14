using { photomask.defect } from '../db/schema';

service AnalyticsService @(path: '/analytics') {
  // ========================================
  // ANALYTICS ENTITIES - Read-only
  // ========================================

  @readonly entity DefectPatterns as projection on defect.DefectPatterns;
  @readonly entity DefectTrends as projection on defect.DefectTrends;
  @readonly entity MaskDefectSummary as projection on defect.MaskDefectSummary;

  // ========================================
  // FUNCTIONS - Pattern detection & analysis
  // ========================================

  /**
   * Detect spatial patterns in defects using DBSCAN clustering
   * Returns patterns with confidence > 0.9
   * Manual confirmation required before patterns are saved
   */
  function detectPatterns(
    maskID : UUID,
    confidence_threshold : Decimal
  ) returns array of {
    patternName : String;
    patternType : String;
    confidence : Decimal;
    defectCount : Integer;
    centroidX : Decimal;
    centroidY : Decimal;
    coordinates : array of {
      x : Decimal;
      y : Decimal;
    };
    suspectedCause : String;
    requiresConfirmation : Boolean;
  };

  /**
   * Confirm a detected pattern and save it to database
   * Called after manual review of pattern detection results
   */
  function confirmPattern(
    patternName : String,
    maskID : UUID,
    suspectedCause : String,
    correlatedEquipmentID : UUID
  ) returns {
    patternID : UUID;
    patternName : String;
    status : String;
  };

  /**
   * Calculate cost-benefit analysis for a remediation order
   * Compares: Repair vs Replace vs Retire
   * Returns recommendation with justification
   */
  function calculateCostBenefit(
    orderID : UUID
  ) returns {
    orderID : UUID;
    repairCost : Decimal;
    replacementCost : Decimal;
    retirementCost : Decimal;
    repairRisk : Decimal;
    replacementRisk : Decimal;
    retirementRisk : Decimal;
    recommendation : String;
    costBenefitScore : Decimal;
    justification : String;
  };

  /**
   * Analyze equipment correlation with defects (24-hour window)
   * Determines if specific equipment is causing defects
   */
  function analyzeEquipmentCorrelation(
    equipmentID : UUID,
    dateFrom : Date,
    dateTo : Date
  ) returns {
    equipmentID : UUID;
    equipmentName : String;
    defectCount : Integer;
    defectRate : Decimal;
    defectRateChange : Decimal;
    mostCommonDefectType : String;
    trend : String;
    recommendation : String;
    correlationStrength : Decimal;
  };

  /**
   * Predict defect risk for a specific photomask
   * Based on historical patterns and current defects
   */
  function predictDefectRisk(
    maskID : UUID
  ) returns {
    maskID : UUID;
    riskScore : Decimal;
    factors : array of {
      factor : String;
      weight : Decimal;
      impact : String;
    };
    recommendedAction : String;
    confidenceLevel : Decimal;
  };

  /**
   * Get defect statistics for a given time period
   */
  function getDefectStatistics(
    monthYear : String
  ) returns {
    period : String;
    totalDefects : Integer;
    byType : array of {
      defectType : String;
      count : Integer;
      avgSeverity : Decimal;
    };
    bySeverity : array of {
      severity : String;
      count : Integer;
    };
    totalCost : Decimal;
    avgCostPerDefect : Decimal;
  };

  /**
   * Get pattern trends over time
   * Shows evolution of detected patterns
   */
  function getPatternTrends(
    monthsLookback : Integer
  ) returns array of {
    period : String;
    patternCount : Integer;
    avgConfidence : Decimal;
    confirmedPatterns : Integer;
    pendingConfirmation : Integer;
  };

  /**
   * Compare defect metrics between two masks
   * Useful for analyzing similar masks with different outcomes
   */
  function compareMasks(
    maskID1 : UUID,
    maskID2 : UUID
  ) returns {
    mask1ID : UUID;
    mask2ID : UUID;
    defectCountDiff : Integer;
    costDiff : Decimal;
    severityCompare : String;
    patternSimilarity : Decimal;
    recommendations : String;
  };

  /**
   * Get critical alerts that require immediate attention
   */
  function getCriticalAlerts(
  ) returns array of {
    alertID : UUID;
    alertType : String;
    severity : String;
    maskID : String;
    description : String;
    generatedDate : DateTime;
    actionRequired : String;
  };
}
