const cds = require('@sap/cds');
const DBSCAN = require('dbscan');

class AnalyticsServiceHandler extends cds.ApplicationService {
  async init() {
    /**
     * detectPatterns function
     * Uses DBSCAN clustering to find spatial patterns in defects
     * Confidence threshold default: 0.9
     */
    this.on('detectPatterns', async (req) => {
      const { maskID, confidence_threshold } = req.data;
      const minConfidence = confidence_threshold || 0.9;

      const db = cds.db;

      // Get all defects for this mask with coordinates
      const defects = await db.run(
        SELECT.from('Defects')
          .where({ mask_ID: maskID })
          .columns(c => ['ID', 'coordinateX', 'coordinateY', 'defectID', 'severity'])
      );

      if (defects.length < 2) {
        return []; // Need at least 2 defects for pattern detection
      }

      try {
        // Prepare data for DBSCAN clustering
        // Each point is [x, y] in nanometer coordinates
        const points = defects.map(d => [
          parseFloat(d.coordinateX),
          parseFloat(d.coordinateY)
        ]);

        // DBSCAN parameters
        // eps: maximum distance between points in nanometers
        // minPoints: minimum points to form a cluster
        const eps = 5000; // 5 micrometers in nm
        const minPoints = 2;

        const dbscan = new DBSCAN();
        const clusters = dbscan.run(points, eps, minPoints);

        // Convert clusters to patterns
        const patterns = [];

        // Process each cluster
        clusters.forEach((cluster, clusterIdx) => {
          if (cluster.length >= minPoints) {
            // Calculate pattern statistics
            const clusterDefects = cluster.map(idx => defects[idx]);
            const xs = clusterDefects.map(d => parseFloat(d.coordinateX));
            const ys = clusterDefects.map(d => parseFloat(d.coordinateY));

            // Centroid
            const centroidX = xs.reduce((a, b) => a + b, 0) / xs.length;
            const centroidY = ys.reduce((a, b) => a + b, 0) / ys.length;

            // Average distance from centroid
            const distances = clusterDefects.map((d, i) => {
              const dx = parseFloat(d.coordinateX) - centroidX;
              const dy = parseFloat(d.coordinateY) - centroidY;
              return Math.sqrt(dx * dx + dy * dy);
            });
            const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;

            // Confidence calculation
            // Based on cluster compactness and size
            // Higher compactness (lower avgDistance) = higher confidence
            let confidence = Math.min(1.0, clusterDefects.length / 10); // Size factor
            confidence *= (1 - Math.min(1, avgDistance / 10000)); // Compactness factor
            confidence = parseFloat(confidence.toFixed(2));

            // Determine pattern type based on geometry
            const minDist = Math.min(...distances);
            const maxDist = Math.max(...distances);
            let patternType = 'Cluster';

            if (maxDist / minDist > 3) {
              patternType = 'Linear';
            } else if (cluster.length === 1) {
              patternType = 'Isolated';
            }

            // Only return patterns above confidence threshold
            if (confidence >= minConfidence) {
              patterns.push({
                patternName: `Pattern-${clusterIdx + 1}`,
                patternType: patternType,
                confidence: confidence,
                defectCount: clusterDefects.length,
                centroidX: parseFloat(centroidX.toFixed(2)),
                centroidY: parseFloat(centroidY.toFixed(2)),
                coordinates: clusterDefects.map(d => ({
                  x: parseFloat(d.coordinateX),
                  y: parseFloat(d.coordinateY)
                })),
                suspectedCause: this.analyzeCause(clusterDefects, patternType),
                requiresConfirmation: true
              });
            }
          }
        });

        return patterns.sort((a, b) => b.confidence - a.confidence);
      } catch (error) {
        console.error('Pattern detection error:', error);
        return req.error(500, `Pattern detection failed: ${error.message}`);
      }
    });

    /**
     * confirmPattern function
     * Saves a confirmed pattern to DefectPatterns entity
     */
    this.on('confirmPattern', async (req) => {
      const { patternName, maskID, suspectedCause, correlatedEquipmentID } = req.data;

      const db = cds.db;

      try {
        // Create new pattern record
        const newPattern = await db.run(
          INSERT.into('DefectPatterns').entries({
            patternName,
            patternType: 'Confirmed',
            confidence: 0.95, // Will be updated with actual confidence
            confirmed: true,
            mask_ID: maskID,
            suspectedCause,
            correlatedEquipment_ID: correlatedEquipmentID,
            analysisDate: new Date().toISOString()
          })
        );

        return {
          patternID: newPattern[0],
          patternName,
          status: 'Confirmed'
        };
      } catch (error) {
        return req.error(500, `Failed to confirm pattern: ${error.message}`);
      }
    });

    /**
     * calculateCostBenefit function
     * Compares cost-benefit of Repair, Replace, and Retire options
     */
    this.on('calculateCostBenefit', async (req) => {
      const { orderID } = req.data;

      const db = cds.db;

      // Get remediation order details
      const order = await db.run(
        SELECT.one.from('RemediationOrders')
          .where({ ID: orderID })
          .columns(c => [
            '*',
            c`mask(estimatedValue, usageCount)`,
            c`defects(*)`
          ])
      );

      if (!order) {
        return req.error(404, `Order ${orderID} not found`);
      }

      // Get mask info
      const mask = await db.run(
        SELECT.one.from('Photomasks')
          .where({ ID: order.mask_ID })
          .columns(c => ['estimatedValue', 'usageCount', 'technology'])
      );

      if (!mask) {
        return req.error(404, `Associated mask not found`);
      }

      // Cost calculations (simplified)
      const maskValue = mask.estimatedValue || 10000;
      const defectCount = order.defects ? order.defects.length : 0;
      const severityMultiplier = defectCount > 5 ? 1.5 : 1.0;

      // Repair cost
      const repairCost = (order.estimatedCost || 500) * severityMultiplier;
      const repairRisk = Math.min(1.0, 0.3 + (defectCount / 20)); // 0-1 scale

      // Replace cost (new mask + labor)
      const replacementCost = maskValue * 0.8; // Assume 20% discount for replacement
      const replacementRisk = 0.1; // Low risk with new mask

      // Retire cost
      const retirementCost = maskValue * 0.2; // Scrap value ~20%
      const retirementRisk = 0.95; // Very high risk of production impact

      // Recommendation logic
      let recommendation = 'Repair';
      let costBenefitScore = 50;

      if (repairCost > replacementCost * 0.8) {
        recommendation = 'Replace';
        costBenefitScore = 75;
      }

      if (repairRisk > 0.7 || defectCount > 10) {
        recommendation = 'Replace';
        costBenefitScore = 80;
      }

      if (maskValue < 5000 && defectCount > 5) {
        recommendation = 'Retire';
        costBenefitScore = 45;
      }

      const justification = this.generateCostBenefitJustification(
        recommendation,
        repairCost,
        replacementCost,
        repairRisk,
        replacementRisk
      );

      return {
        orderID,
        repairCost: parseFloat(repairCost.toFixed(2)),
        replacementCost: parseFloat(replacementCost.toFixed(2)),
        retirementCost: parseFloat(retirementCost.toFixed(2)),
        repairRisk: parseFloat(repairRisk.toFixed(2)),
        replacementRisk: parseFloat(replacementRisk.toFixed(2)),
        retirementRisk: parseFloat(retirementRisk.toFixed(2)),
        recommendation,
        costBenefitScore: parseFloat(costBenefitScore.toFixed(2)),
        justification
      };
    });

    /**
     * analyzeEquipmentCorrelation function
     * 24-hour window analysis by default
     */
    this.on('analyzeEquipmentCorrelation', async (req) => {
      const { equipmentID, dateFrom, dateTo } = req.data;

      const db = cds.db;

      // Get equipment
      const equipment = await db.run(
        SELECT.one.from('Equipment').where({ ID: equipmentID })
      );

      if (!equipment) {
        return req.error(404, `Equipment ${equipmentID} not found`);
      }

      // Get usage history in time window
      const usageHistory = await db.run(
        SELECT.from('EquipmentUsage')
          .where({ equipment_ID: equipmentID })
          .and('usageDate >=', dateFrom || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .and('usageDate <=', dateTo || new Date().toISOString())
      );

      // Get defects detected during this time by this equipment
      const defects = await db.run(
        SELECT.from('Defects')
          .where({ equipment_ID: equipmentID })
          .columns(c => [
            '*',
            c`defectType(code, name)`
          ])
      );

      // Calculate statistics
      const totalUsageMinutes = usageHistory.reduce((sum, u) => sum + (u.duration || 0), 0);
      const defectRate = totalUsageMinutes > 0 ? (defects.length / totalUsageMinutes * 100).toFixed(2) : 0;

      // Defect type analysis
      const defectTypeMap = new Map();
      let maxDefectType = { type: 'Unknown', count: 0 };

      defects.forEach(d => {
        const type = d.defectType_code || 'Unknown';
        const count = (defectTypeMap.get(type) || 0) + 1;
        defectTypeMap.set(type, count);

        if (count > maxDefectType.count) {
          maxDefectType = { type, count };
        }
      });

      // Trend determination
      let trend = 'Stable';
      if (defectRate > 0.5) {
        trend = 'Increasing';
      }
      if (defectRate > 1.0) {
        trend = 'Critical';
      }

      let recommendation = 'Normal operation';
      if (defects.length >= 5) {
        recommendation = 'Schedule maintenance';
      }
      if (defects.length >= 10) {
        recommendation = 'Urgent maintenance required';
      }

      const correlationStrength = Math.min(1.0, defects.length / 20);

      return {
        equipmentID,
        equipmentName: equipment.equipmentName,
        defectCount: defects.length,
        defectRate: parseFloat(defectRate),
        defectRateChange: 0, // Simplified: would need historical data
        mostCommonDefectType: maxDefectType.type,
        trend,
        recommendation,
        correlationStrength: parseFloat(correlationStrength.toFixed(2))
      };
    });

    /**
     * predictDefectRisk function
     * Predicts likelihood of future defects based on historical patterns
     */
    this.on('predictDefectRisk', async (req) => {
      const { maskID } = req.data;

      const db = cds.db;

      const mask = await db.run(
        SELECT.one.from('Photomasks').where({ ID: maskID })
      );

      if (!mask) {
        return req.error(404, `Mask ${maskID} not found`);
      }

      // Get historical defects
      const defects = await db.run(
        SELECT.from('Defects').where({ mask_ID: maskID })
      );

      // Risk factors
      const factors = [];
      let riskScore = 20; // Base score

      // Factor 1: Usage count
      const usageCount = mask.usageCount || 0;
      if (usageCount > 100) {
        factors.push({
          factor: 'High usage count',
          weight: 0.3,
          impact: 'Negative'
        });
        riskScore += 20;
      }

      // Factor 2: Recent defect trend
      const recentDefects = defects.filter(d => {
        const date = new Date(d.detectedDate);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return date > weekAgo;
      }).length;

      if (recentDefects > 3) {
        factors.push({
          factor: 'Recent defect activity',
          weight: 0.4,
          impact: 'Negative'
        });
        riskScore += 30;
      }

      // Factor 3: Mask age/lifecycle
      if (mask.lifecycleStage === 'In-Use') {
        factors.push({
          factor: 'Mask in active use',
          weight: 0.2,
          impact: 'Negative'
        });
        riskScore += 10;
      }

      // Factor 4: Critical area defects
      const criticalAreaDefects = defects.filter(d => {
        // Would need to check if defect is in critical area
        return d.severity === 'Critical';
      }).length;

      if (criticalAreaDefects > 0) {
        factors.push({
          factor: 'Previous critical defects',
          weight: 0.3,
          impact: 'Negative'
        });
        riskScore += 25;
      }

      // Cap risk score at 100
      riskScore = Math.min(100, riskScore);

      let recommendedAction = 'Continue monitoring';
      if (riskScore > 70) {
        recommendedAction = 'Schedule immediate inspection';
      } else if (riskScore > 50) {
        recommendedAction = 'Schedule preventive inspection';
      }

      return {
        maskID,
        riskScore: parseFloat(riskScore.toFixed(0)),
        factors,
        recommendedAction,
        confidenceLevel: 0.85
      };
    });

    /**
     * getDefectStatistics function
     */
    this.on('getDefectStatistics', async (req) => {
      const { monthYear } = req.data;

      const db = cds.db;

      // Parse month/year (format: YYYY-MM)
      const [year, month] = monthYear.split('-');
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Get defects for this period
      const defects = await db.run(
        SELECT.from('Defects')
          .where('detectedDate >=', startDate.toISOString())
          .and('detectedDate <', endDate.toISOString())
          .columns(c => [
            '*',
            c`defectType_code`
          ])
      );

      // Fetch defect type names
      const defectTypes = await db.run(
        SELECT.from('DefectTypes').columns(['code', 'name'])
      );
      const typeNameMap = new Map(defectTypes.map(dt => [dt.code, dt.name]));

      // Group by type
      const typeMap = new Map();
      defects.forEach(d => {
        const typeCode = d.defectType_code || 'Unknown';
        const typeName = typeNameMap.get(typeCode) || typeCode;
        if (!typeMap.has(typeName)) {
          typeMap.set(typeName, []);
        }
        typeMap.get(typeName).push(d);
      });

      const byType = Array.from(typeMap).map(([type, defectList]) => ({
        defectType: type,
        count: defectList.length,
        avgSeverity: 0 // Simplified
      }));

      // Group by severity
      const severityMap = new Map();
      defects.forEach(d => {
        const sev = d.severity || 'Unknown';
        severityMap.set(sev, (severityMap.get(sev) || 0) + 1);
      });

      const bySeverity = Array.from(severityMap).map(([severity, count]) => ({
        severity,
        count
      }));

      const totalCost = defects.reduce((sum, d) => sum + (d.estimatedImpact || 0), 0);
      const avgCost = defects.length > 0 ? totalCost / defects.length : 0;

      return {
        period: monthYear,
        totalDefects: defects.length,
        byType,
        bySeverity,
        totalCost: parseFloat(totalCost.toFixed(2)),
        avgCostPerDefect: parseFloat(avgCost.toFixed(2))
      };
    });

    /**
     * getPatternTrends function
     */
    this.on('getPatternTrends', async (req) => {
      const { monthsLookback } = req.data;
      const months = monthsLookback || 3;

      const db = cds.db;

      const patterns = await db.run(
        SELECT.from('DefectPatterns').columns(['analysisDate', 'confidence', 'confirmed'])
      );

      // Group by month
      const trendMap = new Map();
      const now = new Date();

      for (let i = 0; i < months; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!trendMap.has(yearMonth)) {
          trendMap.set(yearMonth, {
            period: yearMonth,
            patternCount: 0,
            avgConfidence: 0,
            confirmedPatterns: 0,
            pendingConfirmation: 0,
            confidenceSum: 0
          });
        }
      }

      patterns.forEach(p => {
        if (p.analysisDate) {
          const date = new Date(p.analysisDate);
          const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (trendMap.has(yearMonth)) {
            const data = trendMap.get(yearMonth);
            data.patternCount++;
            data.confidenceSum += p.confidence || 0;
            if (p.confirmed) {
              data.confirmedPatterns++;
            } else {
              data.pendingConfirmation++;
            }
            data.avgConfidence = (data.confidenceSum / data.patternCount).toFixed(2);
          }
        }
      });

      return Array.from(trendMap.values())
        .sort((a, b) => new Date(b.period) - new Date(a.period));
    });

    // Helper functions

    /**
     * Analyze suspected cause based on cluster characteristics
     */
    function analyzeCause(defects, patternType) {
      let cause = 'Unknown cause';

      if (patternType === 'Linear') {
        cause = 'Possible mask alignment issue';
      } else if (patternType === 'Cluster') {
        if (defects.length > 5) {
          cause = 'Possible equipment contamination or misalignment';
        } else {
          cause = 'Localized defect area - possible material issue';
        }
      }

      return cause;
    }

    /**
     * Generate cost-benefit justification
     */
    function generateCostBenefitJustification(recommendation, repairCost, replacementCost, repairRisk, replacementRisk) {
      const lines = [];

      lines.push(`Recommended action: ${recommendation}`);

      if (recommendation === 'Repair') {
        lines.push(
          `Repair cost ($${repairCost.toFixed(0)}) is significantly lower than replacement.`,
          `Risk of repair failure: ${(repairRisk * 100).toFixed(0)}%.`,
          'Consider repair as first option with contingency for replacement.'
        );
      } else if (recommendation === 'Replace') {
        lines.push(
          `Replacement cost ($${replacementCost.toFixed(0)}) provides new mask with minimal risk.`,
          `Repair risk (${(repairRisk * 100).toFixed(0)}%) is too high to justify attempted repair.`,
          'New mask eliminates defect-related yield loss.'
        );
      } else if (recommendation === 'Retire') {
        lines.push(
          'Mask value is low relative to defect severity.',
          'Retirement minimizes risk of further quality issues.',
          'Recommend discontinuing use of this mask.'
        );
      }

      return lines.join(' ');
    }

    await super.init();
  }
}

module.exports = AnalyticsServiceHandler;
