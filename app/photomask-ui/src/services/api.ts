import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4004';
const CATALOG_URL = `${API_BASE_URL}/catalog`;
const ANALYTICS_URL = `${API_BASE_URL}/analytics`;

// Custom params serializer that uses %20 for spaces instead of +
const paramsSerializer = (params: any) => {
  const searchParams = new URLSearchParams();

  for (const key in params) {
    if (params.hasOwnProperty(key)) {
      const value = params[key];
      if (value !== null && value !== undefined) {
        searchParams.append(key, value);
      }
    }
  }

  // Replace + with %20 for proper OData compatibility
  return searchParams.toString().replace(/\+/g, '%20');
};

// Create axios instances
const catalogClient: AxiosInstance = axios.create({
  baseURL: CATALOG_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer,
});

const analyticsClient: AxiosInstance = axios.create({
  baseURL: ANALYTICS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer,
});

// ========================================
// PHOTOMASK API
// ========================================

export interface Photomask {
  ID?: string;
  maskID: string;
  layer?: string;
  technology?: string;
  manufacturer?: string;
  receivedDate?: string;
  status_code?: string;
  lifecycleStage?: string;
  usageCount?: number;
  estimatedValue?: number;
  layoutImageURL?: string;
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export const photomaskAPI = {
  getAll: (params?: any) =>
    catalogClient.get<{ value: Photomask[] }>('/Photomasks', { params }),

  getById: (id: string) =>
    catalogClient.get<Photomask>(`/Photomasks('${id}')`),

  create: (data: Partial<Photomask>) =>
    catalogClient.post<Photomask>('/Photomasks', data),

  update: (id: string, data: Partial<Photomask>) =>
    catalogClient.patch<Photomask>(`/Photomasks('${id}')`, data),

  delete: (id: string) =>
    catalogClient.delete(`/Photomasks('${id}')`),

  getHistory: (maskID: string) =>
    catalogClient.post('/getMaskHistory', { maskID }),

  getCostSummary: (maskID: string) =>
    catalogClient.post('/getMaskCostSummary', { maskID }),
};

// ========================================
// DEFECT API
// ========================================

export interface Defect {
  ID?: string;
  defectID: string;
  detectedDate: string;
  detectionMethod?: string;
  defectType_code?: string;
  severity: string;
  priority?: number;
  coordinateX: number;
  coordinateY: number;
  zone?: string;
  affectedArea?: number;
  imageData?: Blob;
  imageType?: string;
  imageThumbnail?: Blob;
  imageURL?: string;
  rootCause?: string;
  patternGroup?: string;
  aiConfidence?: number;
  impactsYield?: boolean;
  estimatedImpact?: number;
  mask_ID?: string;
  equipment_ID?: string;
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export const defectAPI = {
  getAll: (params?: any) =>
    catalogClient.get<{ value: Defect[] }>('/Defects', { params }),

  getById: (id: string) =>
    catalogClient.get<Defect>(`/Defects('${id}')`),

  create: (data: Partial<Defect>) =>
    catalogClient.post<Defect>('/Defects', data),

  update: (id: string, data: Partial<Defect>) =>
    catalogClient.patch<Defect>(`/Defects('${id}')`, data),

  delete: (id: string) =>
    catalogClient.delete(`/Defects('${id}')`),

  getByMask: (maskID: string) =>
    catalogClient.post('/getDefectsByMask', { maskID }),

  calculateSeverity: (data: any) =>
    catalogClient.post('/calculateDefectSeverity', data),
};

// ========================================
// EQUIPMENT API
// ========================================

export interface Equipment {
  ID?: string;
  equipmentID: string;
  equipmentName?: string;
  equipmentType?: string;
  manufacturer?: string;
  model?: string;
  location?: string;
  status?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export const equipmentAPI = {
  getAll: (params?: any) =>
    catalogClient.get<{ value: Equipment[] }>('/Equipment', { params }),

  getById: (id: string) =>
    catalogClient.get<Equipment>(`/Equipment('${id}')`),

  create: (data: Partial<Equipment>) =>
    catalogClient.post<Equipment>('/Equipment', data),

  update: (id: string, data: Partial<Equipment>) =>
    catalogClient.patch<Equipment>(`/Equipment('${id}')`, data),

  delete: (id: string) =>
    catalogClient.delete(`/Equipment('${id}')`),

  getDefects: (equipmentID: string, hoursLookback: number = 24) =>
    catalogClient.post('/getEquipmentDefects', { equipmentID, hoursLookback }),
};

// ========================================
// REMEDIATION API
// ========================================

export interface RemediationOrder {
  ID?: string;
  orderNumber: string;
  orderDate: string;
  mask_ID?: string;
  remediationType_code?: string;
  priority?: string;
  status?: string;
  estimatedCost?: number;
  actualCost?: number;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  requiresApproval?: boolean;
  recommendation?: string;
  costBenefitScore?: number;
  createdAt?: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export const remediationAPI = {
  getAll: (params?: any) =>
    catalogClient.get<{ value: RemediationOrder[] }>('/RemediationOrders', { params }),

  getById: (id: string) =>
    catalogClient.get<RemediationOrder>(`/RemediationOrders('${id}')`),

  create: (data: Partial<RemediationOrder>) =>
    catalogClient.post<RemediationOrder>('/RemediationOrders', data),

  update: (id: string, data: Partial<RemediationOrder>) =>
    catalogClient.patch<RemediationOrder>(`/RemediationOrders('${id}')`, data),

  submitForApproval: (orderID: string) =>
    catalogClient.post('/submitForApproval', { orderID }),

  approve: (orderID: string, approverNotes?: string) =>
    catalogClient.post('/approveRemediation', { orderID, approverNotes }),

  reject: (orderID: string, rejectionReason?: string) =>
    catalogClient.post('/rejectRemediation', { orderID, rejectionReason }),

  complete: (orderID: string, actualCost?: number, completionNotes?: string) =>
    catalogClient.post('/completeRemediation', { orderID, actualCost, completionNotes }),

  getPendingApprovals: () =>
    catalogClient.get('/getPendingApprovals'),
};

// ========================================
// ANALYTICS API
// ========================================

export interface DefectPattern {
  patternName: string;
  patternType: string;
  confidence: number;
  defectCount: number;
  centroidX: number;
  centroidY: number;
  coordinates: Array<{ x: number; y: number }>;
  suspectedCause: string;
  requiresConfirmation: boolean;
}

export interface CostBenefitResult {
  orderID: string;
  repairCost: number;
  replacementCost: number;
  retirementCost: number;
  repairRisk: number;
  replacementRisk: number;
  retirementRisk: number;
  recommendation: string;
  costBenefitScore: number;
  justification: string;
}

export const analyticsAPI = {
  detectPatterns: (maskID: string, confidence_threshold: number = 0.9) =>
    analyticsClient.post<{ value: DefectPattern[] }>('/detectPatterns', {
      maskID,
      confidence_threshold,
    }),

  confirmPattern: (patternName: string, maskID: string, suspectedCause: string, correlatedEquipmentID?: string) =>
    analyticsClient.post('/confirmPattern', {
      patternName,
      maskID,
      suspectedCause,
      correlatedEquipmentID,
    }),

  calculateCostBenefit: (orderID: string) =>
    analyticsClient.post<CostBenefitResult>('/calculateCostBenefit', { orderID }),

  analyzeEquipmentCorrelation: (equipmentID: string, dateFrom: string, dateTo: string) =>
    analyticsClient.post('/analyzeEquipmentCorrelation', {
      equipmentID,
      dateFrom,
      dateTo,
    }),

  predictDefectRisk: (maskID: string) =>
    analyticsClient.post('/predictDefectRisk', { maskID }),

  getDefectStatistics: () => {
    // Get statistics for current month
    const now = new Date();
    const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return analyticsClient.get('/getDefectStatistics', { params: { monthYear } });
  },

  getPatternTrends: (timeRange: 'week' | 'month' | 'year' = 'month') => {
    // Convert timeRange to monthsLookback
    const monthsMap = { week: 1, month: 3, year: 12 };
    const monthsLookback = monthsMap[timeRange];
    return analyticsClient.get('/getPatternTrends', { params: { monthsLookback } });
  },
};

// ========================================
// CODE LIST API
// ========================================

export interface CodeList<T = any> {
  code: string;
  name?: string;
  [key: string]: T;
}

export const codeListAPI = {
  getMaskStatuses: () =>
    catalogClient.get<{ value: CodeList[] }>('/MaskStatuses'),

  getDefectTypes: () =>
    catalogClient.get<{ value: CodeList[] }>('/DefectTypes'),

  getRemediationTypes: () =>
    catalogClient.get<{ value: CodeList[] }>('/RemediationTypes'),

  getSeverities: () =>
    catalogClient.get<{ value: CodeList[] }>('/Severities'),
};

export default {
  photomaskAPI,
  defectAPI,
  equipmentAPI,
  remediationAPI,
  analyticsAPI,
  codeListAPI,
};
