import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photomaskAPI, Photomask } from '../services/api';

const PHOTOMASKS_QUERY_KEY = 'photomasks';

/**
 * Fetch all photomasks with optional filtering
 */
export const usePhotomasks = (params?: any) => {
  return useQuery({
    queryKey: [PHOTOMASKS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await photomaskAPI.getAll(params);
      return response.data.value;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Fetch a single photomask by ID
 */
export const usePhotomask = (id: string | null) => {
  return useQuery({
    queryKey: [PHOTOMASKS_QUERY_KEY, id],
    queryFn: async () => {
      if (!id) return null;
      const response = await photomaskAPI.getById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Fetch photomask history (timeline, defect count, cost impact)
 */
export const usePhotomaskHistory = (maskID: string | null) => {
  return useQuery({
    queryKey: [PHOTOMASKS_QUERY_KEY, 'history', maskID],
    queryFn: async () => {
      if (!maskID) return null;
      const response = await photomaskAPI.getHistory(maskID);
      return response.data;
    },
    enabled: !!maskID,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Fetch photomask cost summary
 */
export const usePhotomaskCostSummary = (maskID: string | null) => {
  return useQuery({
    queryKey: [PHOTOMASKS_QUERY_KEY, 'costSummary', maskID],
    queryFn: async () => {
      if (!maskID) return null;
      const response = await photomaskAPI.getCostSummary(maskID);
      return response.data;
    },
    enabled: !!maskID,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Create a new photomask
 */
export const useCreatePhotomask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Photomask>) => {
      const response = await photomaskAPI.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PHOTOMASKS_QUERY_KEY] });
    },
  });
};

/**
 * Update an existing photomask
 */
export const useUpdatePhotomask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Photomask> }) => {
      const response = await photomaskAPI.update(id, data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [PHOTOMASKS_QUERY_KEY] });
      if (data?.ID) {
        queryClient.setQueryData([PHOTOMASKS_QUERY_KEY, data.ID], data);
      }
    },
  });
};

/**
 * Delete a photomask
 */
export const useDeletePhotomask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await photomaskAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PHOTOMASKS_QUERY_KEY] });
    },
  });
};

/**
 * Fetch photomasks in active use
 */
export const useActiveMasks = () => {
  return useQuery({
    queryKey: [PHOTOMASKS_QUERY_KEY, 'active'],
    queryFn: async () => {
      const response = await photomaskAPI.getAll({
        $filter: "lifecycleStage eq 'In-Use'",
        $orderby: 'maskID asc',
      });
      return response.data.value;
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};

/**
 * Fetch quarantined photomasks
 */
export const useQuarantinedMasks = () => {
  return useQuery({
    queryKey: [PHOTOMASKS_QUERY_KEY, 'quarantined'],
    queryFn: async () => {
      const response = await photomaskAPI.getAll({
        $filter: "lifecycleStage eq 'Quarantine'",
        $orderby: 'maskID asc',
      });
      return response.data.value;
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
  });
};
