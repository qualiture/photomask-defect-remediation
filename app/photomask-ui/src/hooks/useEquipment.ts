import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentAPI } from '../services/api';
import { Equipment } from '../services/api';

// Query hooks
export const useEquipment = () => {
  return useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const response = await equipmentAPI.getAll();
      return response.data.value || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useEquipmentById = (equipmentID: string) => {
  return useQuery({
    queryKey: ['equipment', equipmentID],
    queryFn: () => equipmentAPI.getById(equipmentID),
    enabled: !!equipmentID,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useEquipmentDefects = (equipmentID: string) => {
  return useQuery({
    queryKey: ['equipment', equipmentID, 'defects'],
    queryFn: () => equipmentAPI.getDefects(equipmentID),
    enabled: !!equipmentID,
    staleTime: 60 * 1000, // 1 minute (more frequent updates for defect correlation)
    gcTime: 5 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Equipment>) => equipmentAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Equipment> }) =>
      equipmentAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.id] });
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

// Filtered queries
export const useActiveEquipment = () => {
  const { data, ...rest } = useEquipment();
  return {
    data: data?.filter((e) => e.status !== 'Retired'),
    ...rest,
  };
};

export const useMalfunctioningEquipment = () => {
  const { data, ...rest } = useEquipment();
  return {
    data: data?.filter((e) => e.status === 'In Maintenance' || e.status === 'Failed'),
    ...rest,
  };
};
