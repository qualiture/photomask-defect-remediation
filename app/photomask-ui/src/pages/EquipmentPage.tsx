import React, { useMemo } from 'react';
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
  Paper,
  Stack,
} from '@mui/material';
import { useEquipment, useEquipmentDefects } from '../hooks/useEquipment';

export default function EquipmentPage() {
  const { data: equipment = [], isLoading, error } = useEquipment();

  // Ensure equipment is always an array
  const equipmentArray = Array.isArray(equipment) ? equipment : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Maintenance':
        return 'warning';
      case 'Failed':
        return 'error';
      case 'Idle':
        return 'default';
      case 'In Use':
        return 'success';
      default:
        return 'default';
    }
  };

  const getLastMaintenanceStatus = (lastMaintenance: string, nextMaintenance: string) => {
    const today = new Date();
    const nextDate = new Date(nextMaintenance);
    const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { label: 'Overdue', color: 'error' };
    } else if (daysUntil < 7) {
      return { label: `${daysUntil}d left`, color: 'warning' };
    } else {
      return { label: 'On schedule', color: 'success' };
    }
  };

  const stats = useMemo(() => {
    return {
      total: equipmentArray.length,
      active: equipmentArray.filter((e) => e.status === 'In Use').length,
      idle: equipmentArray.filter((e) => e.status === 'Idle').length,
      maintenance: equipmentArray.filter((e) => e.status === 'In Maintenance').length,
      failed: equipmentArray.filter((e) => e.status === 'Failed').length,
    };
  }, [equipmentArray]);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Equipment
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Monitor equipment status and defect correlation
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load equipment data. Please check if the backend is running.
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Equipment */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Equipment
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* In Use */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                In Use
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#4CAF50' }}>
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Idle */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Idle
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                {stats.idle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* In Maintenance */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Maintenance
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#FF9800' }}>
                {stats.maintenance}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Failed */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: '#D32F2F' }}>
                {stats.failed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Equipment Table */}
      <Card>
        <CardHeader title="Equipment List" />
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : equipmentArray.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Equipment ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Manufacturer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Maintenance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipmentArray.map((item) => {
                    const maintenanceStatus = getLastMaintenanceStatus(
                      item.lastMaintenance || '',
                      item.nextMaintenance || ''
                    );
                    return (
                      <TableRow key={item.ID} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.equipmentID}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.equipmentName}</TableCell>
                        <TableCell>{item.equipmentType}</TableCell>
                        <TableCell>{item.manufacturer}</TableCell>
                        <TableCell>
                          <Chip
                            label={item.status}
                            size="small"
                            color={getStatusColor(item.status)}
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell>
                          <Chip
                            label={maintenanceStatus.label}
                            size="small"
                            color={maintenanceStatus.color}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary">No equipment found</Typography>
          )}
        </CardContent>
      </Card>

      {/* Equipment Details Grid */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {equipmentArray.slice(0, 6).map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.ID}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {item.equipmentName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {item.equipmentID}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.status}
                    size="small"
                    color={getStatusColor(item.status)}
                    variant="filled"
                  />
                </Box>

                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Type
                    </Typography>
                    <Typography variant="body2">{item.equipmentType}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Manufacturer
                    </Typography>
                    <Typography variant="body2">{item.manufacturer}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Location
                    </Typography>
                    <Typography variant="body2">{item.location}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Last Maintenance
                    </Typography>
                    <Typography variant="body2">
                      {item.lastMaintenance
                        ? new Date(item.lastMaintenance).toLocaleDateString()
                        : 'Never'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Next Maintenance
                    </Typography>
                    <Typography variant="body2">
                      {item.nextMaintenance
                        ? new Date(item.nextMaintenance).toLocaleDateString()
                        : 'Not scheduled'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
