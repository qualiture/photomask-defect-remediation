import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { defectAPI, Defect } from '../services/api';

const DEFECTS_QUERY_KEY = 'defects';

/**
 * Fetch all defects with optional filtering
 */
export const useDefects = (params?: any) => {
  return useQuery({
    queryKey: [DEFECTS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await defectAPI.getAll(params);
      return response.data.value;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Fetch a single defect by ID
 */
export const useDefect = (id: string | null) => {
  return useQuery({
    queryKey: [DEFECTS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null;
      const response = await defectAPI.getById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Fetch defects by mask ID
 */
export const useDefectsByMask = (maskID: string | null) => {
  return useQuery({
    queryKey: [DEFECTS_QUERY_KEY, 'byMask', maskID],
    queryFn: async () => {
      if (!maskID) return [];
      const response = await defectAPI.getByMask(maskID);
      return response.data;
    },
    enabled: !!maskID,
    staleTime: 1000 * 30, // 30 seconds (more frequent updates for mask details)
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Create a new defect
 */
export const useCreateDefect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Defect>) => {
      const response = await defectAPI.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEFECTS_QUERY_KEY] });
    },
  });
};

/**
 * Update an existing defect
 */
export const useUpdateDefect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Defect> }) => {
      const response = await defectAPI.update(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [DEFECTS_QUERY_KEY] });
      if (data?.ID) {
        queryClient.setQueryData([DEFECTS_QUERY_KEY, data.ID], data);
      }
    },
  });
};

/**
 * Delete a defect
 */
export const useDeleteDefect = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await defectAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DEFECTS_QUERY_KEY] });
    },
  });
};

/**
 * Calculate defect severity based on location and AI confidence
 */
export const useCalculateSeverity = () => {
  return useMutation({
    mutationFn: async (data: {
      defectType: string;
      coordinateX: number;
      coordinateY: number;
      maskID: string;
      aiConfidence: number;
    }) => {
      const response = await defectAPI.calculateSeverity(data);
      return response.data;
    },
  });
};

/**
 * Fetch defects with filtering by severity (Critical)
 */
export const useCriticalDefects = () => {
  return useQuery({
    queryKey: [DEFECTS_QUERY_KEY, 'critical'],
    queryFn: async () => {
      const response = await defectAPI.getAll({
        $filter: "severity eq 'Critical'",
        $orderby: 'detectedDate desc',
      });
      return response.data.value;
    },
    staleTime: 1000 * 30, // More frequent updates for critical defects
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Fetch recent defects
 */
export const useRecentDefects = (limit: number = 10) => {
  return useQuery({
    queryKey: [DEFECTS_QUERY_KEY, 'recent', limit],
    queryFn: async () => {
      const response = await defectAPI.getAll({
        $orderby: 'detectedDate desc',
        $top: limit,
      });
      return response.data.value;
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
};
