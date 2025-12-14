# User Guide - Photomask Defect Analytics & Remediation Tracker

## Getting Started

### Accessing the System

**URL**: `http://localhost:5173` (development) | `https://<app-name>.cfapps.<region>.hana.ondemand.com` (production)

**Supported Browsers**:
- Google Chrome 90+ (recommended)
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+

**Login**:
- Development: No login required
- Production: Use your company SSO credentials

---

## Dashboard Overview

When you first access the system, you'll see the main dashboard with:

### Key Metrics
Four cards displaying critical information:
- **Total Masks**: Number of photomasks being tracked
- **Total Defects**: Current defect count
- **Critical Alerts**: Urgent issues requiring attention
- **Pending Approvals**: Remediation orders awaiting review

### Quick Actions
- **New Defect**: Report a new defect (opens defect creation dialog)
- **View Analytics**: Navigate to analytics dashboard
- **Pending Orders**: View remediation orders requiring approval

### Recent Defects Table
Shows the 5 most recently detected defects with:
- Defect ID
- Mask ID
- Severity (Critical/Major/Minor)
- Detection date
- Quick action buttons

### Mask Status Summary
Visual progress bars showing distribution of masks by status:
- New
- In-Use
- Quarantine
- Under Repair
- Retired

---

## Core Tasks

### Task 1: Reporting a New Defect

**When to use**: After detecting a defect during inspection

**Steps**:

1. **Open Defect Form**
   - Click "New Defect" button on dashboard
   - Or navigate to Defects page and click "Add Defect"

2. **Select Photomask**
   - Choose the affected mask from dropdown
   - Dropdown shows mask ID and layer name

3. **Choose Defect Type**
   - Select from 10 predefined types:
     - Particle Contamination
     - Physical Scratch
     - Pattern Defect
     - Missing Feature
     - Substrate Crack
     - Residue Buildup
     - Film Delamination
     - Etch Defect
     - CD Variation
     - Overlay Error

4. **Enter Coordinates**
   - **X Coordinate**: Enter horizontal position in nanometers
   - **Y Coordinate**: Enter vertical position in nanometers
   - Origin point: Top-left corner of mask
   - Range: 0 to 999,999.999999 nm

5. **Enter Affected Area** (optional)
   - Enter approximate affected area in square micrometers
   - Used for impact assessment

6. **Upload Defect Image**
   - Click "Upload Image" or drag and drop
   - Supported formats: JPEG, PNG, TIFF, BMP, WebP
   - Maximum size: 1 MB
   - System will show preview and file size

7. **Submit**
   - Click "Create Defect"
   - System automatically calculates severity
   - Defect appears in defects list immediately

**What happens after submission**:
- Severity is automatically calculated based on:
  - Defect type
  - Location (whether in critical area)
  - AI confidence score
- Defect appears in dashboard and defects list
- Pattern detection system scans for patterns (every 5 seconds)
- If pattern detected with >90% confidence, alert generated for review

**Common Issues**:
- **"Image too large"**: Resize image to under 1 MB
- **"Invalid coordinates"**: Ensure coordinates are positive numbers
- **"Mask not found"**: Verify mask ID is correct

---

### Task 2: Viewing Defects on Map

**When to use**: To visualize defect spatial distribution on a mask

**Steps**:

1. **Navigate to Defects Page**
   - Click "Defects" in left sidebar
   - Map loads with all defects for all masks

2. **Interact with Map**
   - **Zoom**: Use zoom controls (+/-) or mouse wheel
   - **Pan**: Click and drag to move around
   - **Reset**: Click "Reset Zoom" to return to default view

3. **View Defect Details**
   - **Hover**: Tooltip shows basic defect info
   - **Click**: Opens detailed dialog with:
     - Defect ID and type
     - Severity level
     - Coordinates
     - Detection date
     - Defect image (if available)
     - Associated remediation order (if any)

4. **Filter by Mask** (if needed)
   - Use filter dropdown to show defects for specific mask
   - Clears when selecting "All Masks"

**Map Legend**:
- **Red markers**: Critical severity
- **Orange markers**: Major severity
- **Blue markers**: Minor severity
- **Cluster**: Multiple defects in close proximity

---

### Task 3: Creating a Remediation Order

**When to use**: When defects require repair, cleaning, or other remediation

**Steps**:

1. **Navigate to Remediation Page**
   - Click "Remediation" in sidebar

2. **Create New Order**
   - Click "New Order" button

3. **Select Affected Mask**
   - Choose mask from dropdown
   - System shows current defect count

4. **Choose Remediation Type**
   - **Spot Repair**: Fix individual defects
   - **Cleaning**: Remove contamination
   - **Pellicle Replacement**: Replace protective cover
   - **Coating**: Reapply protective layer
   - **Comprehensive Repair**: Full refurbishment
   - **Vendor Repair**: Send to external vendor
   - **Replacement**: Replace entire mask
   - **Retirement**: Retire mask permanently

5. **Set Priority**
   - Urgent, High, Normal, or Low

6. **Enter Cost Estimate**
   - Estimated cost in USD
   - **Important**: Orders <$1,000 are auto-approved
   - Orders ≥$1,000 require manager approval

7. **Set Timeline** (optional)
   - Planned start date
   - Planned end date

8. **Review Cost-Benefit Analysis**
   - System automatically shows:
     - Repair cost and risk
     - Replacement cost and risk
     - Retirement cost and risk
     - Recommendation (Repair/Replace/Retire)
     - Recommendation score (0-10)
     - Detailed justification

9. **Submit Order**
   - Click "Create Order"
   - **If cost <$1,000**:
     - Order auto-approved immediately
     - Status: "Auto-Approved"
     - Can proceed to work immediately
   - **If cost ≥$1,000**:
     - Order status: "Pending Approval"
     - Manager receives notification
     - Wait for approval before proceeding

**Order Status Flow**:
```
Draft → Pending Approval (if ≥$1,000) → Approved → In-Progress → Completed
                ↓
              Rejected
```

---

### Task 4: Approving Remediation Orders (Managers)

**When to use**: When an order ≥$1,000 requires your approval

**Steps**:

1. **Navigate to Remediation Page**
   - Pending approvals shown at top in highlighted section

2. **Review Order Details**
   - Click "Review" button on pending order
   - Review dialog shows:
     - Order number and mask ID
     - Remediation type
     - Estimated cost
     - Cost-benefit recommendation
     - Recommendation score and justification

3. **Make Decision**
   - **To Approve**:
     - Add optional notes (e.g., "Approved after budget review")
     - Click "Approve"
     - Order status changes to "Approved"
     - Technician receives notification
   - **To Reject**:
     - Add rejection reason (required)
     - Click "Reject"
     - Order status changes to "Rejected"
     - Requester receives notification with reason

4. **Track Approved Orders**
   - Approved orders appear in main orders table
   - Filter by status: "Approved"

**Approval Criteria** (typical):
- Cost-benefit score >7.0: Usually approve
- Score 5.0-7.0: Review carefully, may need discussion
- Score <5.0: Consider rejection or alternative approach
- Always review justification text

---

### Task 5: Completing a Remediation Order (Technicians)

**When to use**: After finishing remediation work

**Steps**:

1. **Find Your Order**
   - Navigate to Remediation page
   - Filter by status: "Approved" or "In-Progress"

2. **Start Work** (if not started)
   - Click "Start Work" button
   - Status changes to "In-Progress"
   - Actual start date recorded

3. **Perform Remediation**
   - Follow standard procedures for remediation type
   - Document any issues or deviations

4. **Complete Order**
   - Click "Complete" button on order
   - Enter actual cost (required)
   - Add completion notes:
     - Work performed
     - Any issues encountered
     - Test results
     - Mask returned to production or quarantine

5. **Submit Completion**
   - Click "Submit"
   - Status changes to "Completed"
   - Actual end date recorded
   - Mask status updated (e.g., back to "In-Use")

**Post-Completion**:
- System calculates cost variance (estimated vs. actual)
- If defects persist, new defect reports may be needed
- Historical record maintained for auditing

---

### Task 6: Reviewing Pattern Detections

**When to use**: When system alerts you to a detected defect pattern

**Steps**:

1. **Check Alerts**
   - Dashboard shows critical alerts count
   - Click to view details

2. **Review Pattern Details**
   - System shows:
     - Pattern type (Cluster, Linear, Radial)
     - Confidence level (0.90-1.00)
     - Number of defects in pattern
     - Suspected cause
     - Defects involved (coordinates)
     - Visual representation on map

3. **Analyze Root Cause**
   - Review suspected cause
   - Check equipment correlation:
     - Which equipment was used before defects appeared?
     - Is there a pattern in equipment usage?
     - Correlation strength (0.0-1.0)

4. **Confirm or Reject Pattern**
   - **To Confirm**:
     - Click "Confirm Pattern"
     - Optionally update suspected cause
     - Optionally link to correlated equipment
     - Pattern saved to database
     - Root cause investigation initiated
   - **To Reject**:
     - Click "Reject"
     - Pattern marked as false positive
     - Defects remain unlinked

5. **Take Action** (if confirmed)
   - If equipment-related:
     - Schedule equipment maintenance
     - System may generate maintenance alert
   - If process-related:
     - Investigate process parameters
     - Review handling procedures
   - If contamination:
     - Check cleanroom conditions
     - Review cleaning procedures

**Pattern Types Explained**:
- **Cluster**: Defects concentrated in one area
  - Common cause: Localized contamination
- **Linear**: Defects in a line
  - Common cause: Scratch, handling damage
- **Radial**: Defects radiating from center
  - Common cause: Equipment misalignment

---

### Task 7: Checking Equipment Status

**When to use**: Regular monitoring or when investigating defect correlation

**Steps**:

1. **Navigate to Equipment Page**
   - Click "Equipment" in sidebar

2. **Review Equipment Metrics**
   - **Total Equipment**: All registered units
   - **In Use**: Currently processing masks
   - **Idle**: Available but not in use
   - **Maintenance**: Under maintenance
   - **Failed**: Out of service

3. **View Equipment Details**
   - Table view shows all equipment with:
     - Equipment ID and name
     - Type (Stepper, Scanner, Inspector, Cleaner)
     - Manufacturer and model
     - Status
     - Location
     - Last maintenance date
     - Next maintenance date

4. **Check Maintenance Schedule**
   - **Green indicator**: Maintenance not due for 30+ days
   - **Yellow indicator**: Maintenance due within 30 days
   - **Red indicator**: Maintenance overdue

5. **Review Equipment Defects** (if needed)
   - Click equipment name to view details
   - Shows defects linked to this equipment
   - Correlation analysis (24-hour window)
   - Defect rate trends

6. **Schedule Maintenance** (if needed)
   - Based on maintenance indicators
   - Based on defect correlation alerts
   - Update next maintenance date

---

### Task 8: Viewing Analytics

**When to use**: Regular reporting, trend analysis, management review

**Steps**:

1. **Navigate to Analytics Page**
   - Click "Analytics" in sidebar

2. **Review Key Metrics**
   - **Total Defects**: Overall count
   - **Critical Defects**: Requiring immediate action
   - **Major Defects**: Requiring action soon
   - **Top Defect Type**: Most common defect category

3. **Analyze Defect Type Distribution**
   - Bar chart shows top 8 defect types
   - Percentage of total for each type
   - Helps identify recurring issues

4. **Review Severity Distribution**
   - Critical vs. Major vs. Minor breakdown
   - Percentage calculations
   - Color-coded visualization

5. **Interpret Insights**
   - System provides analysis notes:
     - Pattern detection info (>0.9 threshold)
     - Equipment correlation window (24 hours)
     - Cost-benefit recommendation criteria

6. **Export Data** (future feature)
   - Download reports as PDF or Excel
   - Schedule automated reports

---

## Navigation Tips

### Sidebar Navigation
- **Dashboard**: Home page with overview
- **Defects**: Defect map and defect list
- **Photomasks**: Mask inventory and status
- **Equipment**: Equipment status and maintenance
- **Remediation**: Remediation orders and approvals
- **Analytics**: Reports and trend analysis

### Keyboard Shortcuts (future feature)
- `D`: Go to Dashboard
- `M`: Go to Defect Map
- `N`: New Defect (opens form)
- `A`: Go to Analytics
- `Esc`: Close dialog

### Quick Filters
Most pages have quick filter options:
- **By Status**: Filter by current status
- **By Date Range**: Last 7 days, 30 days, custom
- **By Severity**: Critical, Major, Minor (defects only)

---

## Troubleshooting

### Issue: Cannot Upload Image

**Symptoms**: Error message "Image too large" or "Invalid file type"

**Solutions**:
1. Check file size (must be ≤1 MB)
   - Right-click file → Properties → Size
   - If too large, resize using image editor
2. Check file format
   - Must be: JPEG, PNG, TIFF, BMP, or WebP
   - If PDF or other format, convert to JPEG first
3. Clear browser cache and try again

---

### Issue: Defect Severity Not Calculated

**Symptoms**: Severity field is blank or shows "Unknown"

**Solutions**:
1. Ensure all required fields are filled:
   - Defect type
   - Coordinates (X, Y)
   - Mask ID
2. Wait a few seconds (calculation is asynchronous)
3. Refresh page if severity doesn't appear within 10 seconds
4. Contact support if issue persists

---

### Issue: Remediation Order Not Auto-Approved

**Symptoms**: Order <$1,000 shows "Pending Approval"

**Solutions**:
1. Verify estimated cost is truly <$1,000.00
2. Check for decimal errors (e.g., 1,000.00 requires approval)
3. If cost is $999.99 but still pending:
   - Contact system administrator
   - May be configuration issue

---

### Issue: Pattern Detection Not Running

**Symptoms**: Expected pattern not detected after 5+ minutes

**Solutions**:
1. Verify at least 3 defects exist on the mask
   - Pattern detection requires minimum 3 defects
2. Check defect proximity
   - Defects must be within ~10 micrometers (10,000 nm)
3. Review confidence threshold
   - Default is 90% (0.9)
   - Lower confidence patterns not shown
4. Manually trigger detection via Analytics page (future feature)

---

### Issue: Cannot See Defects on Map

**Symptoms**: Map shows "No defects found" or map is blank

**Solutions**:
1. Check filter settings
   - Clear any active filters
   - Select "All Masks"
2. Verify defects exist in database
   - Go to Dashboard → Recent Defects
   - If no defects shown, none are registered
3. Check browser console for errors (F12)
4. Try different browser
5. Clear browser cache and refresh

---

## Best Practices

### Defect Reporting
1. **Report immediately**: Don't wait until end of shift
2. **Accurate coordinates**: Double-check measurements
3. **Clear images**: Ensure good lighting and focus
4. **Descriptive notes**: Add context in notes field

### Remediation Orders
1. **Realistic estimates**: Avoid under-estimating costs
2. **Detailed notes**: Document justification for remediation choice
3. **Timely updates**: Update status as work progresses
4. **Accurate actual costs**: Record true costs for future analysis

### Pattern Review
1. **Prompt review**: Review patterns within 24 hours of detection
2. **Thorough investigation**: Don't rush root cause analysis
3. **Equipment checks**: Always verify equipment correlation
4. **Documentation**: Record findings in pattern notes

### Equipment Maintenance
1. **Proactive scheduling**: Don't wait for overdue alerts
2. **Post-maintenance verification**: Check defect rates after maintenance
3. **Documentation**: Record maintenance activities
4. **Correlation monitoring**: Watch for defect rate changes

---

## FAQs

### General

**Q: Can I delete a defect?**
A: No, defects cannot be deleted once created (audit trail). Contact administrator if incorrect defect was registered.

**Q: Can I edit a defect after creation?**
A: Yes, you can update most fields except defect ID and coordinates. Click defect in list and select "Edit".

**Q: How often does pattern detection run?**
A: Every 5 seconds (polling interval). Patterns with >90% confidence are flagged immediately.

**Q: What happens to rejected remediation orders?**
A: They remain in the system for audit trail but cannot be reactivated. Create a new order if needed.

### Remediation

**Q: Can I change the auto-approval threshold?**
A: No, the $1,000 threshold is fixed in this version. Contact your manager for exceptions.

**Q: What if actual cost exceeds estimate by a lot?**
A: System records variance for reporting. If >20% variance, add explanation in completion notes.

**Q: Can I cancel an order in progress?**
A: Yes, managers can cancel orders. Status changes to "Cancelled" and work should stop immediately.

### Equipment

**Q: How do I add new equipment?**
A: Only administrators can add equipment. Submit request via IT service desk.

**Q: What does "correlation strength" mean?**
A: A value from 0.0-1.0 indicating how strongly defects are linked to specific equipment. >0.8 is high correlation.

**Q: Can I manually schedule maintenance?**
A: Equipment page shows recommended dates. Actual scheduling is done in your CMMS (Computerized Maintenance Management System).

---

## Getting Help

### In-App Help
- Click "?" icon in top-right corner
- Tooltip help on hover over fields
- Context-sensitive help panels (future feature)

### Support Contacts
- **Technical Issues**: IT Support Desk (ext. 5555)
- **Process Questions**: Quality Engineering Manager
- **Training**: Contact HR for training schedule
- **Feature Requests**: Submit via change management portal

### Training Resources
- **New User Training**: 2-hour session (monthly)
- **Advanced Training**: Quarterly workshops
- **Quick Reference Cards**: Available on intranet
- **Video Tutorials**: Coming in Phase 3

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Maintained By**: User Experience Team
**Review Cycle**: Quarterly
**Target Audience**: End users (technicians, engineers, managers)
