const cds = require('@sap/cds');
const { v4: uuid } = require('uuid');

class CatalogServiceHandler extends cds.ApplicationService {
  async init() {
    // ========================================
    // BEFORE HANDLERS - Validation & Processing
    // ========================================

    this.before('CREATE', 'Defects', async (req) => {
      const { data } = req;

      // Validate coordinates (nanometer precision)
      if (!data.coordinateX || !data.coordinateY) {
        return req.error(400, 'Coordinates (X, Y) are required');
      }

      // Ensure coordinates are numbers
      if (typeof data.coordinateX !== 'number' || typeof data.coordinateY !== 'number') {
        return req.error(400, 'Coordinates must be numeric values (nanometers)');
      }

      // Generate defect ID if not provided
      if (!data.defectID) {
        data.defectID = `DEF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Set detected date if not provided
      if (!data.detectedDate) {
        data.detectedDate = new Date().toISOString();
      }

      // Initial severity if not provided - will be calculated
      if (!data.severity) {
        data.severity = 'Minor'; // Default, will be upgraded if needed
      }
    });

    // Validate remediation order before creation
    this.before('CREATE', 'RemediationOrders', async (req) => {
      const { data } = req;

      // Generate order number if not provided
      if (!data.orderNumber) {
        data.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Set order date if not provided
      if (!data.orderDate) {
        data.orderDate = new Date().toISOString();
      }

      // Initial status is always Draft
      data.status = 'Draft';

      // Determine if approval is required based on estimated cost
      // Auto-approve if cost < $1,000, otherwise require approval
      if (data.estimatedCost && data.estimatedCost < 1000) {
        data.requiresApproval = false;
        data.status = 'Approved'; // Auto-approve for orders < $1000
        data.approvalDate = new Date().toISOString();
      } else {
        data.requiresApproval = true;
      }
    });

    // ========================================
    // ON HANDLERS - Custom Logic
    // ========================================

    /**
     * Handle submitForApproval action
     * Auto-approves if cost < $1,000
     */
    this.on('submitForApproval', async (req) => {
      const { orderID } = req.data;

      const db = cds.db;
      const order = await db.run(
        SELECT.one.from('RemediationOrders').where({ ID: orderID })
      );

      if (!order) {
        return req.error(404, `Order ${orderID} not found`);
      }

      let newStatus = order.status;
      let autoApproved = false;

      // Check if auto-approval should be applied
      if (order.estimatedCost < 1000) {
        // Auto-approve orders < $1,000
        newStatus = 'Approved';
        autoApproved = true;
        const updateResult = await db.run(
          UPDATE('RemediationOrders', orderID).with({
            status: newStatus,
            requiresApproval: false,
            approvalDate: new Date().toISOString()
          })
        );
      } else {
        // Require manual approval for orders >= $1,000
        newStatus = 'Pending Approval';
        autoApproved = false;
        const updateResult = await db.run(
          UPDATE('RemediationOrders', orderID).with({
            status: newStatus,
            requiresApproval: true
          })
        );
      }

      return {
        orderID,
        status: newStatus,
        autoApproved,
        message: autoApproved
          ? `Order auto-approved (cost < $1,000)`
          : 'Order submitted for approval (cost >= $1,000)'
      };
    });

    /**
     * Handle approveRemediation action
     * Manual approval for orders >= $1,000
     */
    this.on('approveRemediation', async (req) => {
      const { orderID, approverNotes, approverUser } = req.data;

      const db = cds.db;
      const order = await db.run(
        SELECT.one.from('RemediationOrders').where({ ID: orderID })
      );

      if (!order) {
        return req.error(404, `Order ${orderID} not found`);
      }

      if (order.status === 'Approved') {
        return req.error(400, 'Order is already approved');
      }

      const updateResult = await db.run(
        UPDATE('RemediationOrders', orderID).with({
          status: 'Approved',
          approvalDate: new Date().toISOString(),
          approver: approverUser,
          approvalNotes: approverNotes,
          requiresApproval: false
        })
      );

      return {
        orderID,
        status: 'Approved',
        approvalDate: new Date().toISOString()
      };
    });

    /**
     * Handle rejectRemediation action
     */
    this.on('rejectRemediation', async (req) => {
      const { orderID, rejectionReason, rejectionUser } = req.data;

      const db = cds.db;
      const order = await db.run(
        SELECT.one.from('RemediationOrders').where({ ID: orderID })
      );

      if (!order) {
        return req.error(404, `Order ${orderID} not found`);
      }

      const updateResult = await db.run(
        UPDATE('RemediationOrders', orderID).with({
          status: 'Rejected',
          approvalNotes: `Rejected by ${rejectionUser}: ${rejectionReason}`,
          requiresApproval: false
        })
      );

      return {
        orderID,
        status: 'Rejected'
      };
    });

    /**
     * Handle completeRemediation action
     */
    this.on('completeRemediation', async (req) => {
      const { orderID, actualCost, completionNotes, completionUser } = req.data;

      const db = cds.db;
      const order = await db.run(
        SELECT.one.from('RemediationOrders').where({ ID: orderID })
      );

      if (!order) {
        return req.error(404, `Order ${orderID} not found`);
      }

      const updateResult = await db.run(
        UPDATE('RemediationOrders', orderID).with({
          status: 'Completed',
          actualCost: actualCost,
          actualEnd: new Date().toISOString(),
          approvalNotes: completionNotes
        })
      );

      return {
        orderID,
        status: 'Completed',
        actualCost: actualCost
      };
    });

    /**
     * getDefectsByMask function
     * Returns all defects for a specific photomask
     */
    this.on('getDefectsByMask', async (req) => {
      const { maskID } = req.data;

      const db = cds.db;
      const defects = await db.run(
        SELECT.from('Defects')
          .where({ 'mask.maskID': maskID })
          .columns(c => [
            '*',
            c`mask(maskID)`,
            c`defectType(code, name)`,
            c`equipment(equipmentID, equipmentName)`
          ])
      );

      return defects;
    });

    /**
     * getMaskHistory function
     * Returns detailed history of a photomask
     */
    this.on('getMaskHistory', async (req) => {
      const { maskID: orderID } = req.data;
      const maskID = orderID; // Fix: use the passed parameter

      const db = cds.db;

      // Get mask details
      const mask = await db.run(
        SELECT.one.from('Photomasks').where({ ID: maskID })
      );

      if (!mask) {
        return req.error(404, `Mask ${maskID} not found`);
      }

      // Get all defects for this mask
      const defects = await db.run(
        SELECT.from('Defects').where({ mask_ID: maskID })
      );

      const defectCount = defects.length;
      const criticalDefects = defects.filter(d => d.severity === 'Critical').length;
      const majorDefects = defects.filter(d => d.severity === 'Major').length;
      const minorDefects = defects.filter(d => d.severity === 'Minor').length;

      // Get remediation cost
      const remediations = await db.run(
        SELECT.from('RemediationOrders')
          .where({ mask_ID: maskID })
          .columns(c => ['actualCost', 'estimatedCost', 'status', 'orderDate'])
      );

      const totalCost = remediations.reduce((sum, r) => {
        return sum + (r.actualCost || r.estimatedCost || 0);
      }, 0);

      // Create timeline events
      const timeline = defects.map(d => ({
        date: d.detectedDate,
        eventType: 'DefectDetected',
        description: `${d.defectType} - Severity: ${d.severity}`,
        defectCount: 1
      })).sort((a, b) => new Date(a.date) - new Date(b.date));

      remediations.forEach(r => {
        timeline.push({
          date: r.orderDate,
          eventType: 'RemediationOrder',
          description: `Status: ${r.status}`,
          defectCount: 0
        });
      });

      return {
        mask,
        defectCount,
        criticalDefects,
        majorDefects,
        minorDefects,
        totalRemediationCost: totalCost,
        timeline: timeline.sort((a, b) => new Date(a.date) - new Date(b.date))
      };
    });

    /**
     * calculateDefectSeverity function
     * Determines severity based on location and AI confidence
     */
    this.on('calculateDefectSeverity', async (req) => {
      const { defectType, coordinateX, coordinateY, maskID, aiConfidence } = req.data;

      const db = cds.db;

      // Check if defect is in critical area
      const criticalAreas = await db.run(
        SELECT.from('CriticalAreas').where({ mask_ID: maskID })
      );

      let inCriticalArea = false;
      let maxCriticalityLevel = 0;

      for (const area of criticalAreas) {
        const isInArea =
          coordinateX >= area.coordinateX1 &&
          coordinateX <= area.coordinateX2 &&
          coordinateY >= area.coordinateY1 &&
          coordinateY <= area.coordinateY2;

        if (isInArea) {
          inCriticalArea = true;
          maxCriticalityLevel = Math.max(maxCriticalityLevel, area.criticalityLevel || 0);
        }
      }

      // Determine severity
      let severity = 'Minor';
      let reason = 'Default severity';

      // Use AI confidence if available
      if (aiConfidence && aiConfidence > 0.8) {
        if (aiConfidence > 0.95) {
          severity = 'Critical';
          reason = 'High AI confidence indicates critical defect';
        } else if (aiConfidence > 0.9) {
          severity = 'Major';
          reason = 'High AI confidence indicates major defect';
        } else {
          severity = 'Major';
          reason = 'AI confidence suggests major defect';
        }
      }

      // Upgrade if in critical area
      if (inCriticalArea) {
        if (severity === 'Minor') severity = 'Major';
        if (severity === 'Major' && maxCriticalityLevel >= 4) severity = 'Critical';
        reason = `Located in critical area (level ${maxCriticalityLevel})`;
      }

      return {
        severity,
        level: severity === 'Critical' ? 3 : severity === 'Major' ? 2 : 1,
        reason,
        inCriticalArea
      };
    });

    /**
     * getEquipmentDefects function
     * Returns defect data for a specific equipment (24-hour window)
     */
    this.on('getEquipmentDefects', async (req) => {
      const { equipmentID, hoursLookback } = req.data;
      const lookbackHours = hoursLookback || 24;

      const db = cds.db;

      // Get equipment
      const equipment = await db.run(
        SELECT.one.from('Equipment').where({ ID: equipmentID })
      );

      if (!equipment) {
        return req.error(404, `Equipment ${equipmentID} not found`);
      }

      // Get defects detected by this equipment in the lookback window
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - lookbackHours);

      const defects = await db.run(
        SELECT.from('Defects')
          .where({ equipment_ID: equipmentID })
          .and('detectedDate >=', cutoffDate.toISOString())
          .columns(c => ['*', c`defectType(code, name)`])
      );

      // Group by defect type
      const defectTypeMap = new Map();
      defects.forEach(d => {
        const type = d.defectType_code || 'Unknown';
        if (!defectTypeMap.has(type)) {
          defectTypeMap.set(type, 0);
        }
        defectTypeMap.set(type, defectTypeMap.get(type) + 1);
      });

      const defectTypes = Array.from(defectTypeMap).map(([type, count]) => ({
        type,
        count
      }));

      // Calculate correlation strength (simple: more defects = stronger correlation)
      const correlationStrength = Math.min(1, defects.length / 10); // 0-1 scale

      let recommendation = 'Normal';
      if (defects.length >= 5) {
        recommendation = 'Schedule maintenance';
      }
      if (defects.length >= 10) {
        recommendation = 'Urgent maintenance required';
      }

      return {
        equipmentID,
        equipmentName: equipment.equipmentName,
        defectCount: defects.length,
        defectTypes,
        correlationStrength: correlationStrength.toFixed(2),
        recommendation
      };
    });

    /**
     * getPendingApprovals function
     * Returns remediation orders awaiting approval
     */
    this.on('getPendingApprovals', async (req) => {
      const db = cds.db;

      const orders = await db.run(
        SELECT.from('RemediationOrders')
          .where({ requiresApproval: true })
          .and('status !=', 'Completed')
          .columns([
            'ID',
            'orderNumber',
            'mask_ID',
            'estimatedCost',
            'orderDate',
            'remediationType_code'
          ])
          .orderBy('orderDate')
      );

      // Fetch mask and remediation type details for each order
      const results = await Promise.all(orders.map(async (order) => {
        const mask = await db.run(
          SELECT.one.from('Photomasks').where({ ID: order.mask_ID }).columns('maskID')
        );
        const remediationType = await db.run(
          SELECT.one.from('RemediationTypes').where({ code: order.remediationType_code }).columns('name')
        );

        return {
          orderID: order.ID,
          orderNumber: order.orderNumber,
          maskID: mask?.maskID || '',
          estimatedCost: order.estimatedCost,
          submittedDate: order.orderDate,
          remediationType: remediationType?.name || ''
        };
      }));

      return results;
    });

    /**
     * getMaskCostSummary function
     * Returns cost impact analysis for a mask
     */
    this.on('getMaskCostSummary', async (req) => {
      const { maskID: orderID } = req.data;
      const maskID = orderID; // Fix: use the passed parameter

      const db = cds.db;

      const mask = await db.run(
        SELECT.one.from('Photomasks').where({ ID: maskID })
      );

      if (!mask) {
        return req.error(404, `Mask ${maskID} not found`);
      }

      // Get all defects and their impact
      const defects = await db.run(
        SELECT.from('Defects').where({ mask_ID: maskID })
      );

      const totalDefectImpact = defects.reduce((sum, d) => {
        return sum + (d.estimatedImpact || 0);
      }, 0);

      // Get remediation costs
      const remediations = await db.run(
        SELECT.from('RemediationOrders')
          .where({ mask_ID: maskID })
          .columns(c => ['actualCost', 'estimatedCost', 'status'])
      );

      const totalRemediationCost = remediations.reduce((sum, r) => {
        return sum + (r.actualCost || r.estimatedCost || 0);
      }, 0);

      const netValue = (mask.estimatedValue || 0) - totalDefectImpact;

      // Determine trend
      let costTrend = 'Stable';
      if (totalDefectImpact > (mask.estimatedValue || 0) * 0.2) {
        costTrend = 'Increasing';
      }
      if (totalRemediationCost > totalDefectImpact) {
        costTrend = 'High remediation cost';
      }

      return {
        maskID: mask.ID,
        estimatedValue: mask.estimatedValue,
        totalDefectImpact,
        totalRemediationCost,
        netValue,
        costTrend
      };
    });

    await super.init();
  }
}

module.exports = CatalogServiceHandler;
