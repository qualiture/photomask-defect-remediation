import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';

// Pattern detection
export const useDetectPatterns = (maskID: string, threshold: number = 0.9) => {
  return useQuery({
    queryKey: ['analytics', 'patterns', maskID, threshold],
    queryFn: async () => {
      const response = await analyticsAPI.detectPatterns(maskID, threshold);
      return response.data.value || response.data;
    },
    enabled: !!maskID,
    staleTime: 30 * 1000, // 30 seconds (pattern detection updates frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 1000, // 5-second polling as per requirements
  });
};

// Cost-benefit analysis
export const useCalculateCostBenefit = (orderID: string) => {
  return useQuery({
    queryKey: ['analytics', 'cost-benefit', orderID],
    queryFn: async () => {
      const response = await analyticsAPI.calculateCostBenefit(orderID);
      return response.data;
    },
    enabled: !!orderID,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
  });
};

// Equipment correlation (24-hour window)
export const useAnalyzeEquipmentCorrelation = (equipmentID: string) => {
  return useQuery({
    queryKey: ['analytics', 'equipment-correlation', equipmentID],
    queryFn: async () => {
      const response = await analyticsAPI.analyzeEquipmentCorrelation(equipmentID, '', '');
      return response.data;
    },
    enabled: !!equipmentID,
    staleTime: 60 * 1000, // 1 minute (equipment correlation more stable)
    gcTime: 5 * 60 * 1000,
  });
};

// Defect risk prediction
export const usePredictDefectRisk = (maskID: string) => {
  return useQuery({
    queryKey: ['analytics', 'risk-prediction', maskID],
    queryFn: async () => {
      const response = await analyticsAPI.predictDefectRisk(maskID);
      return response.data;
    },
    enabled: !!maskID,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// Defect statistics
export const useDefectStatistics = (maskID?: string) => {
  return useQuery({
    queryKey: ['analytics', 'statistics', maskID || 'all'],
    queryFn: async () => {
      const response = await analyticsAPI.getDefectStatistics();
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// Pattern trends over time
export const usePatternTrends = (timeRange: 'week' | 'month' | 'year' = 'month') => {
  return useQuery({
    queryKey: ['analytics', 'trends', timeRange],
    queryFn: async () => {
      const response = await analyticsAPI.getPatternTrends(timeRange);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};

// Global defect trends
export const useGlobalDefectTrends = () => {
  return useQuery({
    queryKey: ['analytics', 'global-trends'],
    queryFn: async () => {
      const response = await analyticsAPI.getPatternTrends('month');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
};

// Summary statistics
export const useSummaryStatistics = () => {
  return useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const response = await analyticsAPI.getDefectStatistics();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  });
};
