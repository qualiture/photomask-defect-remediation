import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Chip } from '@mui/material';
import { usePhotomasks } from '../hooks/usePhotomasks';

export default function PhotomasksPage() {
  const { data: masks, isLoading } = usePhotomasks();

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Photomasks
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage photomask lifecycle and track history
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {masks?.map((mask) => (
            <Grid item xs={12} sm={6} md={4} key={mask.ID}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {mask.maskID}
                  </Typography>
                  <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label={mask.layer} size="small" variant="outlined" />
                    <Chip label={mask.technology} size="small" variant="outlined" />
                    <Chip
                      label={mask.lifecycleStage}
                      size="small"
                      color={mask.lifecycleStage === 'In-Use' ? 'success' : 'default'}
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '12px' }}>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Uses
                      </Typography>
                      <Typography variant="body2">{mask.usageCount}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Value
                      </Typography>
                      <Typography variant="body2">${mask.estimatedValue}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
