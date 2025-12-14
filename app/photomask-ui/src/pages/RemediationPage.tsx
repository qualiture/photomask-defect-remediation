import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Drawer,
} from '@mui/material';
import { useRemediationOrders, usePendingApprovals, useApproveRemediation } from '../hooks/useRemediation';
import RemediationOrderDetail from '../components/remediation/RemediationOrderDetail';
import { RemediationOrder } from '../services/api';

export default function RemediationPage() {
  const { data: orders = [], isLoading, error, refetch } = useRemediationOrders();
  const { data: pendingApprovals = [] } = usePendingApprovals();
  const approveRemediation = useApproveRemediation();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

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

  const stats = useMemo(() => {
    return {
      total: orders.length,
      draft: orders.filter((o) => o.status === 'Draft').length,
      pending: orders.filter((o) => o.status === 'Pending Approval').length,
      approved: orders.filter((o) => o.status === 'Approved').length,
      completed: orders.filter((o) => o.status === 'Completed').length,
    };
  }, [orders]);

  const totalCost = useMemo(() => {
    return orders
      .filter((o) => o.estimatedCost)
      .reduce((sum, o) => sum + (o.estimatedCost || 0), 0);
  }, [orders]);

  const selectedOrder = selectedOrderId ? orders.find((o) => o.ID === selectedOrderId) : null;

  const handleApprove = async () => {
    if (!selectedOrderId) return;

    try {
      await approveRemediation.mutateAsync({
        orderID: selectedOrderId,
        notes: approvalNotes,
      });
      setApprovalDialogOpen(false);
      setSelectedOrderId(null);
      setApprovalNotes('');
      refetch();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleOpenDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailDrawerOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDrawerOpen(false);
    setSelectedOrderId(null);
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Remediation
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage remediation orders and approval workflow
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load remediation data. Please check if the backend is running.
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Orders */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Approval */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Approval
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#FF9800' }}>
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Approved */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#2196F3' }}>
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#4CAF50' }}>
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Cost */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Cost
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                ${totalCost.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Remediation Orders Table */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Remediation Orders" />
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : orders.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Order Number</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Mask</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Cost</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Recommendation</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.ID} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.mask_ID}</TableCell>
                      <TableCell>{order.remediationType_code}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          size="small"
                          color={getStatusColor(order.status)}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        ${(order.estimatedCost || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.recommendation}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleOpenDetail(order.ID!)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary">No remediation orders found</Typography>
          )}
        </CardContent>
      </Card>

      {/* Pending Approvals Section */}
      {stats.pending > 0 && (
        <Card>
          <CardHeader
            title={`Pending Approvals (${stats.pending})`}
            subheader="Orders awaiting approval"
          />
          <CardContent>
            <Grid container spacing={2}>
              {orders
                .filter((o) => o.status === 'Pending Approval')
                .map((order) => (
                  <Grid item xs={12} md={6} key={order.ID}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {order.orderNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Cost Benefit Score: {order.costBenefitScore?.toFixed(2)} / 10
                          </Typography>
                        </Box>

                        <Stack spacing={1} sx={{ mb: 2 }}>
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Estimated Cost
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              ${(order.estimatedCost || 0).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Recommendation
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                label={order.recommendation}
                                size="small"
                                color={
                                  order.recommendation === 'Repair'
                                    ? 'success'
                                    : order.recommendation === 'Replace'
                                    ? 'warning'
                                    : 'error'
                                }
                                variant="filled"
                              />
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              Justification
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {order.justification}
                            </Typography>
                          </Box>
                        </Stack>

                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          onClick={() => handleOpenDetail(order.ID!)}
                        >
                          Review & Approve
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailDrawerOpen}
        onClose={handleCloseDetail}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 600, md: 800 },
            maxWidth: '100%',
            overflow: 'auto',
          },
        }}
      >
        {selectedOrder && (
          <Box sx={{ p: 3 }}>
            <RemediationOrderDetail
              order={selectedOrder}
              onClose={handleCloseDetail}
              onOrderUpdated={() => {
                refetch();
                handleCloseDetail();
              }}
            />
          </Box>
        )}
      </Drawer>

      {/* Approval Dialog - Kept for backward compatibility */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Remediation Order</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Approval Notes (Optional)"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Add any notes for the approval..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            disabled={approveRemediation.isPending}
          >
            {approveRemediation.isPending ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
