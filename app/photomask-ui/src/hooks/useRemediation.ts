import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remediationAPI } from '../services/api';
import { RemediationOrder } from '../services/api';

// Query hooks
export const useRemediationOrders = () => {
  return useQuery({
    queryKey: ['remediation'],
    queryFn: async () => {
      const response = await remediationAPI.getAll();
      return response.data.value || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRemediationOrder = (orderID: string) => {
  return useQuery({
    queryKey: ['remediation', orderID],
    queryFn: () => remediationAPI.getById(orderID),
    enabled: !!orderID,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const usePendingApprovals = () => {
  return useQuery({
    queryKey: ['remediation', 'pending-approvals'],
    queryFn: async () => {
      const response = await remediationAPI.getPendingApprovals();
      return response.data.value || [];
    },
    staleTime: 60 * 1000, // 1 minute (approval requests need frequent refresh)
    gcTime: 5 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreateRemediationOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<RemediationOrder>) => remediationAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
    },
  });
};

export const useUpdateRemediationOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RemediationOrder> }) =>
      remediationAPI.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
      queryClient.invalidateQueries({ queryKey: ['remediation', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['remediation', 'pending-approvals'] });
    },
  });
};

export const useDeleteRemediationOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => remediationAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
    },
  });
};

export const useSubmitForApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderID: string) => remediationAPI.submitForApproval(orderID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
      queryClient.invalidateQueries({ queryKey: ['remediation', 'pending-approvals'] });
    },
  });
};

export const useApproveRemediation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderID, notes }: { orderID: string; notes?: string }) =>
      remediationAPI.approve(orderID, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
      queryClient.invalidateQueries({ queryKey: ['remediation', 'pending-approvals'] });
    },
  });
};

export const useRejectRemediation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderID, notes }: { orderID: string; notes?: string }) =>
      remediationAPI.reject(orderID, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
      queryClient.invalidateQueries({ queryKey: ['remediation', 'pending-approvals'] });
    },
  });
};

export const useCompleteRemediation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderID, actualCost, notes }: { orderID: string; actualCost?: number; notes?: string }) =>
      remediationAPI.complete(orderID, actualCost, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation'] });
    },
  });
};

// Filtered queries
export const usePendingRemediations = () => {
  const { data, ...rest } = useRemediationOrders();
  return {
    data: data?.filter((r) => r.status === 'Pending Approval'),
    ...rest,
  };
};

export const useApprovedRemediations = () => {
  const { data, ...rest } = useRemediationOrders();
  return {
    data: data?.filter((r) => r.status === 'Approved'),
    ...rest,
  };
};

export const useCompletedRemediations = () => {
  const { data, ...rest } = useRemediationOrders();
  return {
    data: data?.filter((r) => r.status === 'Completed'),
    ...rest,
  };
};
