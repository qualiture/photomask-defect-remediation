import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { RemediationOrder } from '../../services/api';
import { useApproveRemediation, useRejectRemediation, useCompleteRemediation } from '../../hooks/useRemediation';
import CostBenefitAnalysis from './CostBenefitAnalysis';

interface RemediationOrderDetailProps {
  order: RemediationOrder;
  isLoading?: boolean;
  onClose?: () => void;
  onOrderUpdated?: () => void;
}

/**
 * Remediation Order Detail Component
 * Displays full order details with workflow actions and cost-benefit analysis
 */
export const RemediationOrderDetail: React.FC<RemediationOrderDetailProps> = ({
  order,
  isLoading = false,
  onClose,
  onOrderUpdated,
}) => {
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);

  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actualCost, setActualCost] = useState(order.actualCost?.toString() || '');
  const [completionNotes, setCompletionNotes] = useState('');

  const approveRemediation = useApproveRemediation();
  const rejectRemediation = useRejectRemediation();
  const completeRemediation = useCompleteRemediation();

  // Workflow step mapping
  const steps = ['Draft', 'Pending Approval', 'Approved', 'In-Progress', 'Completed'];
  const currentStepIndex = steps.indexOf(order.status || 'Draft');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'default';
      case 'Pending Approval':
        return 'warning';
      case 'Approved':
        return 'info';
      case 'In-Progress':
        return 'info';
      case 'Completed':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleApprove = async () => {
    if (!order.ID) return;
    try {
      await approveRemediation.mutateAsync({
        orderID: order.ID,
        notes: approvalNotes,
      });
      setApprovalDialogOpen(false);
      setApprovalNotes('');
      onOrderUpdated?.();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async () => {
    if (!order.ID) return;
    try {
      await rejectRemediation.mutateAsync({
        orderID: order.ID,
        notes: rejectionReason,
      });
      setRejectionDialogOpen(false);
      setRejectionReason('');
      onOrderUpdated?.();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const handleComplete = async () => {
    if (!order.ID) return;
    try {
      await completeRemediation.mutateAsync({
        orderID: order.ID,
        notes: completionNotes,
      });
      setCompletionDialogOpen(false);
      setCompletionNotes('');
      setActualCost('');
      onOrderUpdated?.();
    } catch (error) {
      console.error('Failed to complete:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const isAutoApproved = order.requiresApproval === false && order.status === 'Approved';

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {order.orderNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Mask: {order.mask_ID}
            </Typography>
          </Box>
          <Chip label={order.status} color={getStatusColor(order.status)} variant="filled" />
        </Box>

        {/* Auto-Approval Alert */}
        {isAutoApproved && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              This order was <strong>automatically approved</strong> because the estimated cost is less than $1,000.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Workflow Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Workflow Status
          </Typography>
          <Stepper activeStep={currentStepIndex} alternativeLabel>
            {steps.map((label) => (
              <Step key={label} completed={steps.indexOf(label) < currentStepIndex}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Estimated Cost
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ${(order.estimatedCost || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Actual Cost
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {order.actualCost ? `$${(order.actualCost || 0).toLocaleString()}` : 'Pending'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Recommendation
              </Typography>
              <Chip
                label={order.recommendation || 'Pending'}
                color={
                  order.recommendation === 'Repair'
                    ? 'success'
                    : order.recommendation === 'Replace'
                    ? 'warning'
                    : 'error'
                }
                variant="filled"
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Cost-Benefit Score
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {order.costBenefitScore?.toFixed(1) || 'N/A'} / 10
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cost-Benefit Analysis */}
      <CostBenefitAnalysis order={order} />

      {/* Order Details */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Order Details" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Remediation Type
                </Typography>
                <Typography variant="body2">{order.remediationType_code || 'N/A'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Priority
                </Typography>
                <Typography variant="body2">{order.priority || 'Normal'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Order Date
                </Typography>
                <Typography variant="body2">
                  {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  Approval Required
                </Typography>
                <Typography variant="body2">
                  {order.requiresApproval ? 'Yes (cost ≥ $1,000)' : 'No (auto-approved)'}
                </Typography>
              </Box>
            </Grid>

            {order.plannedStart && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Planned Start
                  </Typography>
                  <Typography variant="body2">
                    {new Date(order.plannedStart).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
            )}

            {order.plannedEnd && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Planned End
                  </Typography>
                  <Typography variant="body2">
                    {new Date(order.plannedEnd).toLocaleDateString()}
                  </Typography>
                </Box>
              </Grid>
            )}

            {order.justification && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Justification
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                    {order.justification}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Actions" />
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
            {order.status === 'Pending Approval' && order.requiresApproval && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => setApprovalDialogOpen(true)}
                  disabled={approveRemediation.isPending}
                >
                  {approveRemediation.isPending ? 'Approving...' : 'Approve'}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setRejectionDialogOpen(true)}
                  disabled={rejectRemediation.isPending}
                >
                  {rejectRemediation.isPending ? 'Rejecting...' : 'Reject'}
                </Button>
              </>
            )}

            {(order.status === 'Approved' || order.status === 'In-Progress') && (
              <Button
                variant="contained"
                onClick={() => setCompletionDialogOpen(true)}
                disabled={completeRemediation.isPending}
              >
                {completeRemediation.isPending ? 'Completing...' : 'Mark as Completed'}
              </Button>
            )}

            {onClose && (
              <Button variant="outlined" onClick={onClose} sx={{ ml: 'auto' }}>
                Close
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Remediation Order</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This order requires approval because the estimated cost is ${order.estimatedCost?.toLocaleString()}.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Approval Notes (Optional)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes for the approval..."
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApprove} variant="contained" disabled={approveRemediation.isPending}>
            {approveRemediation.isPending ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onClose={() => setRejectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Remediation Order</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Rejecting this order will require the mask to be reassessed.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Explain why this order is being rejected..."
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={rejectRemediation.isPending || !rejectionReason}
          >
            {rejectRemediation.isPending ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={completionDialogOpen} onClose={() => setCompletionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Remediation Order</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            type="number"
            label="Actual Cost"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value)}
            placeholder="Enter actual cost incurred"
            margin="normal"
            InputProps={{ startAdornment: '$' }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Completion Notes"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            placeholder="Describe what was done and any observations..."
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCompletionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleComplete} variant="contained" disabled={completeRemediation.isPending}>
            {completeRemediation.isPending ? 'Completing...' : 'Complete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RemediationOrderDetail;
