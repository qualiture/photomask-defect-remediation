import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Card,
  CardMedia,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  maxSize?: number; // bytes, default 1MB
  accept?: string; // file types, default image/*
  label?: string;
}

export default function ImageUpload({
  onImageSelect,
  maxSize = 1024 * 1024, // 1MB default
  accept = 'image/*',
  label = 'Upload Defect Image',
}: ImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (fileToValidate: File): boolean => {
    setError(null);

    // Check file type
    if (!fileToValidate.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, TIFF, BMP, WebP, etc.)');
      return false;
    }

    // Check file size
    if (fileToValidate.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      setError(
        `File size exceeds ${maxSizeMB}MB limit. Current size: ${(fileToValidate.size / (1024 * 1024)).toFixed(2)}MB`
      );
      return false;
    }

    return true;
  };

  const processFile = (fileToProcess: File) => {
    if (!validateFile(fileToProcess)) {
      return;
    }

    setUploading(true);
    setFile(fileToProcess);

    // Create preview using FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setUploading(false);
      onImageSelect(fileToProcess, result);
    };
    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setUploading(false);
    };
    reader.readAsDataURL(fileToProcess);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFile(droppedFiles[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {label}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!preview ? (
        <Paper
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'divider',
            backgroundColor: dragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'action.hover',
            },
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          <CloudUploadIcon
            sx={{
              fontSize: 48,
              color: dragActive ? 'primary.main' : 'action.disabled',
              mb: 1,
              transition: 'color 0.3s ease',
            }}
          />

          <Typography variant="h6" sx={{ mb: 1 }}>
            Drag and drop your image here
          </Typography>
          <Typography variant="body2" color="textSecondary">
            or click to browse your computer
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            Supported formats: JPEG, PNG, TIFF, BMP, WebP • Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
          </Typography>

          {uploading && <LinearProgress sx={{ mt: 2 }} />}
        </Paper>
      ) : (
        <Box>
          <Card sx={{ mb: 2 }}>
            <CardMedia
              component="img"
              height="300"
              image={preview}
              alt="Defect preview"
              sx={{
                objectFit: 'contain',
                backgroundColor: '#f5f5f5',
              }}
            />
          </Card>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              backgroundColor: 'action.hover',
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {file?.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {(file!.size / (1024 * 1024)).toFixed(2)}MB
              </Typography>
            </Box>
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClick}
                sx={{ mr: 1 }}
              >
                Change
              </Button>
              <IconButton
                size="small"
                color="error"
                onClick={handleRemoveImage}
                title="Remove image"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>

          {uploading && <LinearProgress />}
        </Box>
      )}
    </Box>
  );
}
