import React from 'react';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { useDefects } from '../hooks/useDefects';
import DefectMap from '../components/DefectMap';

export default function DefectsPage() {
  const { data: defects, isLoading, error } = useDefects();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          Defects
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage photomask defects with interactive visualization
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Card>
          <CardContent sx={{ color: 'error.main' }}>
            Failed to load defects. Please check the backend connection.
          </CardContent>
        </Card>
      ) : defects ? (
        <Box sx={{ flex: 1, width: '100%', minHeight: 600, display: 'flex', flexDirection: 'column' }}>
          <DefectMap
            defects={defects}
            maskWidth={1000000}
            maskHeight={1000000}
            interactive={true}
          />
        </Box>
      ) : (
        <Typography>No defects found</Typography>
      )}
    </Box>
  );
}
