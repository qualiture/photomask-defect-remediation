import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
} from '@mui/material';
import { useCreateDefect } from '../hooks/useDefects';
import { usePhotomasks } from '../hooks/usePhotomasks';
import ImageUpload from './ImageUpload';

interface DefectFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  maskID?: string; // If provided, mask is pre-selected
}

export default function DefectForm({
  open,
  onClose,
  onSuccess,
  maskID: initialMaskID,
}: DefectFormProps) {
  const { data: masks = [] } = usePhotomasks();
  const createDefectMutation = useCreateDefect();

  // Form state
  const [maskID, setMaskID] = useState(initialMaskID || '');
  const [defectType, setDefectType] = useState('');
  const [coordinateX, setCoordinateX] = useState('');
  const [coordinateY, setCoordinateY] = useState('');
  const [affectedArea, setAffectedArea] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Common defect types
  const defectTypes = [
    'Dust Particle',
    'Scratch',
    'Crack',
    'Contamination',
    'Deposition Error',
    'Pattern Distortion',
    'Misalignment',
    'Resist Loss',
    'Foreign Material',
    'Other',
  ];

  // Get selected mask dimensions for coordinate validation
  const selectedMask = useMemo(() => {
    return masks.find((m) => m.ID === maskID);
  }, [masks, maskID]);

  const validateForm = (): boolean => {
    setFormError(null);

    if (!maskID) {
      setFormError('Please select a photomask');
      return false;
    }

    if (!defectType) {
      setFormError('Please select a defect type');
      return false;
    }

    const x = parseFloat(coordinateX);
    const y = parseFloat(coordinateY);

    if (isNaN(x) || isNaN(y)) {
      setFormError('Please enter valid coordinates (nanometers)');
      return false;
    }

    if (x < 0 || y < 0) {
      setFormError('Coordinates must be positive values');
      return false;
    }

    if (!imageFile) {
      setFormError('Please upload a defect image');
      return false;
    }

    const area = parseFloat(affectedArea);
    if (affectedArea && (isNaN(area) || area <= 0)) {
      setFormError('Affected area must be a positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('maskID', maskID);
      formData.append('defectType', defectType);
      formData.append('coordinateX', coordinateX);
      formData.append('coordinateY', coordinateY);
      formData.append('affectedArea', affectedArea || '0');
      formData.append('image', imageFile!);

      await createDefectMutation.mutateAsync(formData as any);

      // Reset form on success
      setMaskID(initialMaskID || '');
      setDefectType('');
      setCoordinateX('');
      setCoordinateY('');
      setAffectedArea('');
      setImageFile(null);
      setImagePreview(null);
      setFormError(null);

      onSuccess?.();
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to create defect. Please try again.'
      );
    }
  };

  const handleClose = () => {
    setFormError(null);
    onClose();
  };

  const handleImageSelect = (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Report New Defect</DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Mask Selection */}
          <FormControl fullWidth>
            <InputLabel>Photomask</InputLabel>
            <Select
              value={maskID}
              onChange={(e) => setMaskID(e.target.value)}
              label="Photomask"
              disabled={!!initialMaskID}
            >
              <MenuItem value="">
                <em>Select a mask</em>
              </MenuItem>
              {masks.map((mask) => (
                <MenuItem key={mask.ID} value={mask.ID}>
                  {mask.maskID} - {mask.layer} ({mask.technology})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Defect Type Selection */}
          <FormControl fullWidth>
            <InputLabel>Defect Type</InputLabel>
            <Select
              value={defectType}
              onChange={(e) => setDefectType(e.target.value)}
              label="Defect Type"
            >
              <MenuItem value="">
                <em>Select defect type</em>
              </MenuItem>
              {defectTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Coordinates Grid */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
            Defect Location
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="X Coordinate (nm)"
                type="number"
                inputProps={{ step: 0.1, min: 0 }}
                value={coordinateX}
                onChange={(e) => setCoordinateX(e.target.value)}
                helperText="Nanometers from left"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Y Coordinate (nm)"
                type="number"
                inputProps={{ step: 0.1, min: 0 }}
                value={coordinateY}
                onChange={(e) => setCoordinateY(e.target.value)}
                helperText="Nanometers from top"
              />
            </Grid>
          </Grid>

          {/* Affected Area */}
          <TextField
            fullWidth
            label="Affected Area (μm²)"
            type="number"
            inputProps={{ step: 0.01, min: 0 }}
            value={affectedArea}
            onChange={(e) => setAffectedArea(e.target.value)}
            helperText="Optional - estimate of affected area in square micrometers"
          />

          {/* Image Upload */}
          <Box sx={{ mt: 1 }}>
            <ImageUpload
              onImageSelect={handleImageSelect}
              maxSize={1024 * 1024} // 1MB
              accept="image/*"
              label="Defect Image (Required)"
            />
          </Box>

          {/* Severity Info */}
          <Alert severity="info">
            Severity will be automatically calculated based on the defect type, location, and
            image analysis.
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createDefectMutation.isPending}
        >
          {createDefectMutation.isPending ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Creating...
            </>
          ) : (
            'Create Defect'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
