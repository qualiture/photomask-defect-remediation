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
  Stack,
} from '@mui/material';
import { useSummaryStatistics, useGlobalDefectTrends } from '../hooks/useAnalytics';
import { useDefects } from '../hooks/useDefects';

export default function AnalyticsPage() {
  const { data: defects = [], isLoading: defectsLoading } = useDefects();
  const { data: stats, isLoading: statsLoading } = useSummaryStatistics();
  const { data: trends } = useGlobalDefectTrends();

  const analysis = useMemo(() => {
    if (!defects || defects.length === 0) {
      return {
        totalDefects: 0,
        byType: {},
        bySeverity: { Critical: 0, Major: 0, Minor: 0 },
        averageDetectionTime: 0,
        topDefectType: 'N/A',
      };
    }

    const byType: Record<string, number> = {};
    const bySeverity = { Critical: 0, Major: 0, Minor: 0 };

    defects.forEach((defect) => {
      byType[defect.defectType_code] = (byType[defect.defectType_code] || 0) + 1;
      if (defect.severity in bySeverity) {
        bySeverity[defect.severity as keyof typeof bySeverity]++;
      }
    });

    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalDefects: defects.length,
      byType,
      bySeverity,
      topDefectType: topType,
      criticalPercentage: ((bySeverity.Critical / defects.length) * 100).toFixed(1),
    };
  }, [defects]);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Analytics
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Defect trends, patterns, and statistical analysis
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                    {analysis.totalDefects}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Across all photomasks
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Critical Count */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: analysis.bySeverity.Critical > 0 ? '#FFEBEE' : '#F1F8E9' }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Critical Defects
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: analysis.bySeverity.Critical > 0 ? '#D32F2F' : '#4CAF50',
                }}
              >
                {analysis.bySeverity.Critical}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {analysis.criticalPercentage}% of total
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Major Defects */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Major Defects
              </Typography>
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, color: '#FF9800' }}>
                {analysis.bySeverity.Major}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Need remediation planning
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Defect Type */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Top Defect Type
              </Typography>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {analysis.topDefectType}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {analysis.byType[analysis.topDefectType] || 0} occurrences
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Defect Type Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Defect Type Distribution" />
            <CardContent>
              {defectsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={2}>
                  {Object.entries(analysis.byType)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([type, count]) => (
                      <Box key={type}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{type}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {count}
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
                              backgroundColor: '#2196F3',
                              width: `${(count / analysis.totalDefects) * 100}%`,
                            }}
                          />
                        </Box>
                      </Box>
                    ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Severity Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Severity Distribution" />
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: '#D32F2F',
                          borderRadius: '2px',
                        }}
                      />
                      <Typography variant="body2">Critical</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analysis.bySeverity.Critical}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 24,
                      backgroundColor: '#EEE',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        backgroundColor: '#D32F2F',
                        width: `${(analysis.bySeverity.Critical / analysis.totalDefects) * 100}%`,
                        display: 'flex',
                        alignItems: 'center',
                        pl: 1,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {analysis.totalDefects > 0 &&
                        ((analysis.bySeverity.Critical / analysis.totalDefects) * 100).toFixed(1)}
                      %
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: '#FF9800',
                          borderRadius: '2px',
                        }}
                      />
                      <Typography variant="body2">Major</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analysis.bySeverity.Major}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 24,
                      backgroundColor: '#EEE',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        backgroundColor: '#FF9800',
                        width: `${(analysis.bySeverity.Major / analysis.totalDefects) * 100}%`,
                        display: 'flex',
                        alignItems: 'center',
                        pl: 1,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {analysis.totalDefects > 0 &&
                        ((analysis.bySeverity.Major / analysis.totalDefects) * 100).toFixed(1)}
                      %
                    </Box>
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          backgroundColor: '#2196F3',
                          borderRadius: '2px',
                        }}
                      />
                      <Typography variant="body2">Minor</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {analysis.bySeverity.Minor}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 24,
                      backgroundColor: '#EEE',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        backgroundColor: '#2196F3',
                        width: `${(analysis.bySeverity.Minor / analysis.totalDefects) * 100}%`,
                        display: 'flex',
                        alignItems: 'center',
                        pl: 1,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {analysis.totalDefects > 0 &&
                        ((analysis.bySeverity.Minor / analysis.totalDefects) * 100).toFixed(1)}
                      %
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Analysis Tips */}
      <Card>
        <CardHeader title="Analysis Insights" />
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Pattern detection runs automatically with &gt;0.9 confidence threshold. Check the Defects page
              for interactive visualization with pattern highlights.
            </Alert>
            <Alert severity="info">
              Equipment correlation analysis examines a 24-hour window. Use the Equipment page to view
              defect history for each equipment unit.
            </Alert>
            <Alert severity="success">
              Cost-benefit analysis automatically recommends Repair, Replace, or Retire actions based on
              defect severity and mask value. View recommendations on the Remediation page.
            </Alert>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
