import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Stack,
  LinearProgress,
  Chip,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RemediationOrder } from '../../services/api';

interface CostBenefitAnalysisProps {
  order: RemediationOrder;
}

/**
 * Cost-Benefit Analysis Component
 * Displays comparison of three remediation strategies: Repair, Replace, Retire
 * Shows cost breakdown, risks, and AI recommendation
 */
export const CostBenefitAnalysis: React.FC<CostBenefitAnalysisProps> = ({ order }) => {
  // Mock cost-benefit calculation based on estimated cost
  // In production, this would come from the backend analytics service
  const analysis = useMemo(() => {
    const baseCost = order.estimatedCost || 5000;

    return {
      repair: {
        label: 'Repair',
        cost: baseCost * 0.7, // Repair costs 70% of replacement
        risk: 25, // 25% risk of failure
        riskFactors: ['Repeated failures likely', 'Short-term fix', 'Re-testing required'],
        timeframe: '3-5 days',
        recommended: baseCost > 10000, // Recommend repair for high-cost items
      },
      replace: {
        label: 'Replace',
        cost: baseCost * 1.2, // Full replacement with new mask
        risk: 10, // 10% risk with new equipment
        riskFactors: ['Full replacement warranty', 'Production delay', 'Validation required'],
        timeframe: '7-10 days',
        recommended: baseCost > 2000 && baseCost <= 10000, // Sweet spot for replacement
      },
      retire: {
        label: 'Retire',
        cost: baseCost * 0.3, // Salvage/retire value
        risk: 0, // No risk of further defects
        riskFactors: ['End of lifecycle', 'No further use', 'Immediate decommission'],
        timeframe: '1-2 days',
        recommended: baseCost <= 2000, // Retire for low-value masks
      },
    };
  }, [order.estimatedCost]);

  // Calculate score (0-100) for each option
  const scoreAnalysis = useMemo(() => {
    const scoreOption = (option: typeof analysis.repair) => {
      const costScore = (10000 / option.cost) * 25; // Cost efficiency (max 25 points)
      const riskScore = (100 - option.risk) * 0.5; // Risk mitigation (max 50 points)
      const timeScore = option.timeframe === '1-2 days' ? 25 : option.timeframe === '3-5 days' ? 15 : 10; // Time (max 25 points)
      return Math.min(100, costScore + riskScore + timeScore);
    };

    return {
      repair: scoreOption(analysis.repair),
      replace: scoreOption(analysis.replace),
      retire: scoreOption(analysis.retire),
    };
  }, [analysis]);

  // Chart data
  const chartData = [
    {
      name: 'Repair',
      cost: analysis.repair.cost,
      risk: analysis.repair.risk,
      score: scoreAnalysis.repair,
    },
    {
      name: 'Replace',
      cost: analysis.replace.cost,
      risk: analysis.replace.risk,
      score: scoreAnalysis.replace,
    },
    {
      name: 'Retire',
      cost: analysis.retire.cost,
      risk: analysis.retire.risk,
      score: scoreAnalysis.retire,
    },
  ];

  // Determine recommendation
  const recommendation = order.recommendation || (
    analysis.repair.recommended
      ? 'Repair'
      : analysis.replace.recommended
      ? 'Replace'
      : 'Retire'
  );

  const recommendedOption =
    recommendation === 'Repair'
      ? analysis.repair
      : recommendation === 'Replace'
      ? analysis.replace
      : analysis.retire;

  const recommendedScore =
    recommendation === 'Repair'
      ? scoreAnalysis.repair
      : recommendation === 'Replace'
      ? scoreAnalysis.replace
      : scoreAnalysis.retire;

  const getRiskColor = (risk: number) => {
    if (risk > 30) return '#F44336'; // Red
    if (risk > 15) return '#FF9800'; // Orange
    return '#4CAF50'; // Green
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return '#4CAF50'; // Green
    if (score >= 50) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Cost-Benefit Analysis
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Comparing three remediation strategies for mask {order.mask_ID}
        </Typography>
      </Box>

      {/* Recommendation Alert */}
      <Alert
        severity={recommendedScore >= 75 ? 'success' : recommendedScore >= 50 ? 'warning' : 'error'}
        sx={{ mb: 3 }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Recommended Action: <strong>{recommendation}</strong>
        </Typography>
        <Typography variant="caption" color="inherit">
          {order.justification || `Based on cost analysis and risk assessment, ${recommendation.toLowerCase()} is the optimal strategy for this mask.`}
        </Typography>
      </Alert>

      {/* Cost Comparison Chart */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Cost & Risk Comparison"
          subheader="Estimated costs and failure risk for each remediation strategy"
        />
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'Risk (%)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                formatter={(value: any) => {
                  if (typeof value === 'number') return `$${value.toFixed(0)}`;
                  return value;
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="cost" fill="#2196F3" name="Estimated Cost" />
              <Bar yAxisId="right" dataKey="risk" fill="#FF9800" name="Risk %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Detailed Comparison" />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Strategy</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Estimated Cost</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Risk Level</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Timeframe</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { name: 'Repair', option: analysis.repair, score: scoreAnalysis.repair },
                  { name: 'Replace', option: analysis.replace, score: scoreAnalysis.replace },
                  { name: 'Retire', option: analysis.retire, score: scoreAnalysis.retire },
                ].map((row) => (
                  <TableRow
                    key={row.name}
                    sx={{
                      backgroundColor: row.name === recommendation ? '#E3F2FD' : 'transparent',
                      border: row.name === recommendation ? '2px solid #2196F3' : 'none',
                    }}
                  >
                    <TableCell sx={{ fontWeight: row.name === recommendation ? 600 : 400 }}>
                      {row.name}
                      {row.name === recommendation && (
                        <Chip
                          label="Recommended"
                          size="small"
                          color="primary"
                          variant="filled"
                          sx={{ ml: 1, height: 24 }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ${row.option.cost.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: getRiskColor(row.option.risk),
                          }}
                        />
                        <Typography variant="body2">{row.option.risk}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{row.option.timeframe}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: getScoreColor(row.score),
                          }}
                        >
                          {row.score.toFixed(0)}/100
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={row.score}
                          sx={{
                            mt: 0.5,
                            backgroundColor: '#E0E0E0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getScoreColor(row.score),
                            },
                          }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Option Details Cards */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Strategy Details
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {[
          { name: 'Repair', option: analysis.repair, score: scoreAnalysis.repair },
          { name: 'Replace', option: analysis.replace, score: scoreAnalysis.replace },
          { name: 'Retire', option: analysis.retire, score: scoreAnalysis.retire },
        ].map((item) => (
          <Grid item xs={12} md={4} key={item.name}>
            <Card
              variant={item.name === recommendation ? 'elevation' : 'outlined'}
              sx={{
                height: '100%',
                border: item.name === recommendation ? '2px solid #2196F3' : '1px solid #BDBDBD',
                backgroundColor: item.name === recommendation ? '#E3F2FD' : 'transparent',
              }}
            >
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {item.name}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={item.score}
                    sx={{
                      backgroundColor: '#E0E0E0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getScoreColor(item.score),
                      },
                    }}
                  />
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                    Score: {item.score.toFixed(0)}/100
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Cost
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ${item.option.cost.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Failure Risk
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getRiskColor(item.option.risk),
                        }}
                      />
                      <Typography variant="body2">{item.option.risk}%</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      Timeframe
                    </Typography>
                    <Typography variant="body2">{item.option.timeframe}</Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                      Risk Factors
                    </Typography>
                    <Stack spacing={0.5}>
                      {item.option.riskFactors.map((factor, idx) => (
                        <Typography key={idx} variant="caption" color="textSecondary">
                          • {factor}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CostBenefitAnalysis;
