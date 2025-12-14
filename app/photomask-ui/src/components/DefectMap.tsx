import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Card,
  CardContent,
  Chip,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import * as d3 from 'd3';
import { Defect } from '../services/api';
import { severityColors } from '../styles/theme';

interface DefectMapProps {
  defects: Defect[];
  maskWidth?: number; // in nanometers
  maskHeight?: number; // in nanometers
  onDefectClick?: (defect: Defect) => void;
  interactive?: boolean;
  backgroundImageUrl?: string;
}

interface ZoomState {
  x: number;
  y: number;
  k: number;
}

/**
 * Interactive Defect Map Component
 *
 * Displays photomask defects at nanometer-precision coordinates
 * using D3.js for visualization and interaction.
 *
 * Features:
 * - Zoom and pan controls
 * - Defect clustering at high zoom levels
 * - Severity color coding
 * - Hover tooltips
 * - Click to view defect details
 */
export const DefectMap: React.FC<DefectMapProps> = ({
  defects,
  maskWidth: propMaskWidth,
  maskHeight: propMaskHeight,
  onDefectClick,
  interactive = true,
  backgroundImageUrl,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [zoom, setZoom] = useState<ZoomState>({ x: 0, y: 0, k: 1 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Auto-calculate mask dimensions from defect coordinates with padding
  const calculateMaskDimensions = useCallback(() => {
    if (!defects || defects.length === 0) {
      return {
        width: propMaskWidth || 1000000,
        height: propMaskHeight || 1000000,
      };
    }

    let maxX = 0;
    let maxY = 0;

    // Find the maximum coordinates (assuming origin at 0,0)
    defects.forEach((defect) => {
      if (defect.coordinateX !== undefined && defect.coordinateX !== null) {
        maxX = Math.max(maxX, defect.coordinateX);
      }
      if (defect.coordinateY !== undefined && defect.coordinateY !== null) {
        maxY = Math.max(maxY, defect.coordinateY);
      }
    });

    // Add 20% padding for breathing room
    const width = Math.max(maxX * 1.2, 100);
    const height = Math.max(maxY * 1.2, 100);

    return { width, height };
  }, [defects, propMaskWidth, propMaskHeight]);

  const { width: maskWidth, height: maskHeight } = calculateMaskDimensions();

  // Update container size on mount and window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial update with small delay to ensure layout has settled
    updateSize();
    const timeoutId = setTimeout(updateSize, 100);

    window.addEventListener('resize', updateSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Update size when defects data changes (layout may have adjusted)
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: rect.height,
      });
    }
  }, [defects]);

  // Main D3 visualization
  useEffect(() => {
    if (!svgRef.current || containerSize.width === 0) return;

    const width = containerSize.width;
    const height = containerSize.height;
    const margin = { top: 30, right: 40, bottom: 60, left: 70 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background-color', '#FAFAFA');

    // Create group for margins
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleLinear().domain([0, maskWidth]).range([0, plotWidth]);
    const yScale = d3.scaleLinear().domain([0, maskHeight]).range([plotHeight, 0]);

    // Add background grid
    const gridGroup = g.append('g').attr('class', 'grid').attr('opacity', 0.1);

    gridGroup
      .selectAll('.grid-line-x')
      .data(xScale.ticks(10))
      .enter()
      .append('line')
      .attr('class', 'grid-line-x')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', plotHeight)
      .attr('stroke', '#DDD')
      .attr('stroke-dasharray', '2,2');

    gridGroup
      .selectAll('.grid-line-y')
      .data(yScale.ticks(10))
      .enter()
      .append('line')
      .attr('class', 'grid-line-y')
      .attr('x1', 0)
      .attr('x2', plotWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#DDD')
      .attr('stroke-dasharray', '2,2');

    // Add background image if provided
    if (backgroundImageUrl) {
      g.append('image')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', plotWidth)
        .attr('height', plotHeight)
        .attr('href', backgroundImageUrl)
        .attr('opacity', 0.3);
    }

    // Create zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .on('zoom', (event) => {
        const transform = event.transform;
        setZoom({ x: transform.x, y: transform.y, k: transform.k });

        g.attr('transform', `translate(${margin.left + transform.x},${margin.top + transform.y}) scale(${transform.k})`);

        // Update defect sizes based on zoom
        g.selectAll<SVGCircleElement, Defect>('.defect-point').attr('r', (d) => {
          const baseRadius = getSeverityRadius(d.severity);
          return Math.max(baseRadius / transform.k, 2);
        });

        // Update grid opacity
        gridGroup.attr('opacity', Math.max(0.05, 0.1 / transform.k));
      });

    svg.call(zoomBehavior);

    // Bind defect data
    const defectGroup = g.selectAll<SVGCircleElement, Defect>('.defect-point')
      .data(defects, (d) => d.ID || d.defectID)
      .join(
        (enter) =>
          enter
            .append('circle')
            .attr('class', 'defect-point')
            .attr('cx', (d) => xScale(d.coordinateX))
            .attr('cy', (d) => yScale(d.coordinateY))
            .attr('r', (d) => getSeverityRadius(d.severity))
            .attr('fill', (d) => getColorBySeverity(d.severity))
            .attr('fill-opacity', 0.7)
            .attr('stroke', (d) => getColorBySeverity(d.severity))
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 1)
            .style('cursor', interactive ? 'pointer' : 'default')
            .on('mouseenter', function (event, d) {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('r', (d) => getSeverityRadius(d.severity) * 1.5)
                .attr('fill-opacity', 1);

              // Show tooltip
              showTooltip(event, d);
            })
            .on('mouseleave', function (d) {
              d3.select(this)
                .transition()
                .duration(200)
                .attr('r', (d) => getSeverityRadius(d.severity))
                .attr('fill-opacity', 0.7);

              hideTooltip();
            })
            .on('click', function (event, d) {
              if (interactive) {
                event.stopPropagation();
                setSelectedDefect(d);
                setDetailDialogOpen(true);
                if (onDefectClick) {
                  onDefectClick(d);
                }
              }
            }),
        (update) =>
          update
            .attr('cx', (d) => xScale(d.coordinateX))
            .attr('cy', (d) => yScale(d.coordinateY))
      );

    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat((d) => `${d / 1000}µm`);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${d / 1000}µm`);

    g.append('g')
      .attr('transform', `translate(0,${plotHeight})`)
      .call(xAxis)
      .append('text')
      .attr('x', plotWidth / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('X Coordinate (micrometers)');

    g.append('g')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -plotHeight / 2)
      .attr('y', -50)
      .attr('fill', 'black')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text('Y Coordinate (micrometers)');

  }, [defects, containerSize, maskWidth, maskHeight, backgroundImageUrl, interactive]);

  const getSeverityRadius = (severity?: string): number => {
    switch (severity) {
      case 'Critical':
        return 8;
      case 'Major':
        return 6;
      case 'Minor':
        return 4;
      default:
        return 5;
    }
  };

  const getColorBySeverity = (severity?: string): string => {
    return severityColors[severity as keyof typeof severityColors] || '#2196F3';
  };

  const showTooltip = (event: any, defect: Defect) => {
    // Tooltip implementation using D3
    d3.select('body')
      .selectAll('.defect-tooltip')
      .data([null])
      .join((enter) =>
        enter
          .append('div')
          .attr('class', 'defect-tooltip')
          .style('position', 'fixed')
          .style('padding', '8px 12px')
          .style('background-color', '#333')
          .style('color', '#FFF')
          .style('border-radius', '4px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 10}px`)
      .html(
        `<strong>${defect.defectID}</strong><br/>` +
        `Severity: ${defect.severity}<br/>` +
        `Type: ${defect.defectType_code}<br/>` +
        `X: ${defect.coordinateX.toFixed(2)} nm<br/>` +
        `Y: ${defect.coordinateY.toFixed(2)} nm`
      );
  };

  const hideTooltip = () => {
    d3.select('body').selectAll('.defect-tooltip').remove();
  };

  const handleResetZoom = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform as any,
          d3.zoomIdentity.translate(20, 20)
        );
      setZoom({ x: 0, y: 0, k: 1 });
    }
  };

  const handleCloseDialog = () => {
    setDetailDialogOpen(false);
    setTimeout(() => setSelectedDefect(null), 300);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Legend */}
      <Card>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              Severity:
            </Typography>
            {Object.entries(severityColors).map(([severity, color]) => (
              <Box key={severity} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: color,
                  }}
                />
                <Typography variant="caption">{severity}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Paper
        ref={containerRef}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#FAFAFA',
        }}
      >
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />

        {/* Zoom Controls */}
        {interactive && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              zIndex: 100,
            }}
          >
            <Tooltip title="Reset zoom">
              <IconButton
                size="small"
                onClick={handleResetZoom}
                sx={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: '#F5F5F5',
                  },
                }}
              >
                <ResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Info Text */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#666',
            pointerEvents: 'none',
          }}
        >
          Total Defects: {defects.length} | Zoom: {(zoom.k * 100).toFixed(0)}%
        </Box>
      </Paper>

      {/* Defect Detail Dialog */}
      {selectedDefect && (
        <Dialog
          open={detailDialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: getColorBySeverity(selectedDefect.severity),
                }}
              />
              {selectedDefect.defectID}
            </Box>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Severity
                </Typography>
                <Chip
                  label={selectedDefect.severity}
                  size="small"
                  sx={{
                    backgroundColor: getColorBySeverity(selectedDefect.severity),
                    color: '#FFFFFF',
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Type
                </Typography>
                <Typography variant="body2">{selectedDefect.defectType_code}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  X Coordinate
                </Typography>
                <Typography variant="body2">{selectedDefect.coordinateX.toFixed(2)} nm</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Y Coordinate
                </Typography>
                <Typography variant="body2">{selectedDefect.coordinateY.toFixed(2)} nm</Typography>
              </Box>
              {selectedDefect.aiConfidence && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    AI Confidence
                  </Typography>
                  <Typography variant="body2">{(selectedDefect.aiConfidence * 100).toFixed(1)}%</Typography>
                </Box>
              )}
              {selectedDefect.estimatedImpact && (
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Estimated Impact
                  </Typography>
                  <Typography variant="body2">${selectedDefect.estimatedImpact.toFixed(2)}</Typography>
                </Box>
              )}
            </Box>
            {selectedDefect.rootCause && (
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Root Cause
                </Typography>
                <Typography variant="body2">{selectedDefect.rootCause}</Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default DefectMap;
