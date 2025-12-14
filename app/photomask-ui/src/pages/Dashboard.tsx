import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Stack,
} from '@mui/material';
import { useDefects } from '../hooks/useDefects';
import { usePhotomasks } from '../hooks/usePhotomasks';
import { useCriticalDefects } from '../hooks/useDefects';
import DefectForm from '../components/DefectForm';

export default function Dashboard() {
  const [defectFormOpen, setDefectFormOpen] = useState(false);
  const { data: allDefects, isLoading: defectsLoading, error: defectsError, refetch: refetchDefects } = useDefects();
  const { data: allMasks, isLoading: masksLoading } = usePhotomasks();
  const { data: criticalDefects, isLoading: criticalLoading } = useCriticalDefects();

  const getMaskStats = () => {
    if (!allMasks) return { total: 0, active: 0, quarantine: 0, retired: 0 };
    return {
      total: allMasks.length,
      active: allMasks.filter((m) => m.lifecycleStage === 'In-Use').length,
      quarantine: allMasks.filter((m) => m.lifecycleStage === 'Quarantine').length,
      retired: allMasks.filter((m) => m.lifecycleStage === 'Retired').length,
    };
  };

  const getDefectStats = () => {
    if (!allDefects) return { total: 0, critical: 0, major: 0, minor: 0 };
    return {
      total: allDefects.length,
      critical: allDefects.filter((d) => d.severity === 'Critical').length,
      major: allDefects.filter((d) => d.severity === 'Major').length,
      minor: allDefects.filter((d) => d.severity === 'Minor').length,
    };
  };

  const maskStats = getMaskStats();
  const defectStats = getDefectStats();

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Overview of photomask defects and remediation status
        </Typography>
      </Box>

      {/* Alerts */}
      {defectsError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load defects data. Please check if the backend is running on http://localhost:4004
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Photomasks */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              {masksLoading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography color="textSecondary" gutterBottom>
                    Total Photomasks
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                    {maskStats.total}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Chip
                      label={`${maskStats.active} Active`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${maskStats.quarantine} Quarantine`}
                      size="small"
                      variant="outlined"
                      color="warning"
                    />
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Total Defects */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              {defectsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography color="textSecondary" gutterBottom>
                    Total Defects
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                    {defectStats.total}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    <Chip
                      label={`${defectStats.critical} Critical`}
                      size="small"
                      color="error"
                      variant="filled"
                    />
                    <Chip
                      label={`${defectStats.major} Major`}
                      size="small"
                      color="warning"
                      variant="filled"
                    />
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Critical Defects Alert */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: defectStats.critical > 0 ? '#FFEBEE' : '#F1F8E9' }}>
            <CardContent>
              {criticalLoading ? (
                <CircularProgress size={24} />
              ) : (
                <>
                  <Typography color="textSecondary" gutterBottom>
                    Critical Defects
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      mb: 2,
                      fontWeight: 700,
                      color: defectStats.critical > 0 ? '#D32F2F' : '#4CAF50',
                    }}
                  >
                    {defectStats.critical}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {defectStats.critical > 0
                      ? 'Immediate action required'
                      : 'No critical defects'}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography color="textSecondary" gutterBottom>
                Quick Actions
              </Typography>
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={() => setDefectFormOpen(true)}
              >
                New Defect
              </Button>
              <Button variant="outlined" size="small" fullWidth>
                New Remediation
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Defects Table */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Recent Defects" />
            <CardContent>
              {defectsLoading ? (
                <CircularProgress />
              ) : allDefects && allDefects.length > 0 ? (
                <Box
                  sx={{
                    overflowX: 'auto',
                    '& table': {
                      width: '100%',
                      borderCollapse: 'collapse',
                    },
                    '& th': {
                      textAlign: 'left',
                      padding: '12px',
                      borderBottom: '1px solid #EEE',
                      fontWeight: 600,
                      fontSize: '12px',
                      backgroundColor: '#F5F5F5',
                    },
                    '& td': {
                      padding: '12px',
                      borderBottom: '1px solid #EEE',
                      fontSize: '13px',
                    },
                    '& tr:hover': {
                      backgroundColor: '#FAFAFA',
                    },
                  }}
                >
                  <table>
                    <thead>
                      <tr>
                        <th>Defect ID</th>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Coordinates</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allDefects.slice(0, 5).map((defect) => (
                        <tr key={defect.ID}>
                          <td>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {defect.defectID}
                            </Typography>
                          </td>
                          <td>{defect.defectType_code}</td>
                          <td>
                            <Chip
                              label={defect.severity}
                              size="small"
                              color={
                                defect.severity === 'Critical'
                                  ? 'error'
                                  : defect.severity === 'Major'
                                  ? 'warning'
                                  : 'default'
                              }
                              variant="filled"
                            />
                          </td>
                          <td>
                            <Typography variant="caption" color="textSecondary">
                              ({defect.coordinateX.toFixed(0)}, {defect.coordinateY.toFixed(0)})
                            </Typography>
                          </td>
                          <td>
                            {new Date(defect.detectedDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Typography color="textSecondary">No defects found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Status Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Mask Status Summary" />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {masksLoading ? (
                <CircularProgress />
              ) : (
                <>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">In-Use</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {maskStats.active}/{maskStats.total}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        backgroundColor: '#EEE',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          backgroundColor: '#4CAF50',
                          width: `${maskStats.total > 0 ? (maskStats.active / maskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Quarantine</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {maskStats.quarantine}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        backgroundColor: '#EEE',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          backgroundColor: '#FF9800',
                          width: `${maskStats.total > 0 ? (maskStats.quarantine / maskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Retired</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {maskStats.retired}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        height: 8,
                        backgroundColor: '#EEE',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          backgroundColor: '#9E9E9E',
                          width: `${maskStats.total > 0 ? (maskStats.retired / maskStats.total) * 100 : 0}%`,
                        }}
                      />
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Defect Form Dialog */}
      <DefectForm
        open={defectFormOpen}
        onClose={() => setDefectFormOpen(false)}
        onSuccess={() => {
          refetchDefects();
          setDefectFormOpen(false);
        }}
      />
    </Box>
  );
}
