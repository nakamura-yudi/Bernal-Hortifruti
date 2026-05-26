import axios from 'axios';

declare global {
  interface Window {
    __APP_CONFIG__?: {
      API_BASE_URL?: string;
    };
  }
}

const isLocalDevHost =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);

const API_BASE_URL =
  window.__APP_CONFIG__?.API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (isLocalDevHost ? 'http://localhost:8000/api/v1' : undefined) ||
  '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;
    const requestUrl = String(originalRequest?.url ?? '');
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh') || requestUrl.includes('/auth/logout');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        await refreshClient.post('/auth/refresh', {});
        return api(originalRequest);
      } catch (_refreshError) {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.response?.status === 401 && !isAuthEndpoint && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: { login: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  changePassword: async (data: { current_password: string; new_password: string }) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};

// Users API
export const usersAPI = {
  list: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  updatePermissions: async (id: number, permissionNames: string[]) => {
    const response = await api.put(`/users/${id}/permissions`, { permission_names: permissionNames });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Roles API
export const rolesAPI = {
  list: async () => {
    const response = await api.get('/roles');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },
};

export const permissionsAPI = {
  list: async () => {
    const response = await api.get('/permissions');
    return response.data;
  },
};

// Produtores API
export const produtoresAPI = {
  list: async () => {
    const response = await api.get('/producers');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/producers', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/producers/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/producers/${id}`);
    return response.data;
  },
};

// Companies API
export const companiesAPI = {
  list: async () => {
    const response = await api.get('/companies');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  },
};

// Producer product prices API
export const producerProductPricesAPI = {
  list: async (params?: { producer_id?: number; product_id?: number }) => {
    const response = await api.get('/producer-product-prices', { params });
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/producer-product-prices', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/producer-product-prices/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/producer-product-prices/${id}`);
    return response.data;
  },
};

// Produtos API
export const produtosAPI = {
  list: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  listServices: async (id: number) => {
    const response = await api.get(`/products/${id}/services`);
    return response.data;
  },

  updateServices: async (id: number, serviceIds: number[]) => {
    const response = await api.put(`/products/${id}/services`, { service_ids: serviceIds });
    return response.data;
  },
};

// Freight service rates API
export const freightRatesAPI = {
  list: async () => {
    const response = await api.get('/freight-service-rates');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/freight-service-rates', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/freight-service-rates/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/freight-service-rates/${id}`);
    return response.data;
  },
};

// Services API
export const servicesAPI = {
  list: async () => {
    const response = await api.get('/services');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/services', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },
};

// Embalagens API
export const embalagensAPI = {
  list: async () => {
    const response = await api.get('/package-types');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/package-types', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/package-types/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/package-types/${id}`);
    return response.data;
  },
};

// Envios de Embalagens API
export const packageDeliveriesAPI = {
  list: async () => {
    const response = await api.get('/package-deliveries');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/package-deliveries', data);
    return response.data;
  },
};

// Estoque de Embalagens API
export const packageStockAPI = {
  list: async () => {
    const response = await api.get('/package-stock');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/package-stock', data);
    return response.data;
  },
};

// Fretes API
export const fretesAPI = {
  list: async () => {
    const response = await api.get('/fretes');
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/fretes', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/fretes/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/fretes/${id}`);
    return response.data;
  },
};

// Veículos API
export const veiculosAPI = {
  list: async () => {
    const response = await api.get('/veiculos');
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/veiculos', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/veiculos/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/veiculos/${id}`);
    return response.data;
  },
};

// Tipos de Manutenção API
export const tiposManutencaoAPI = {
  list: async () => {
    const response = await api.get('/tipos-manutencao');
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/tipos-manutencao', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/tipos-manutencao/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/tipos-manutencao/${id}`);
    return response.data;
  },
};

// Caminhoes API
export const caminhoesAPI = {
  list: async () => {
    const response = await api.get('/caminhoes');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/caminhoes', data);
    return response.data;
  },
};

// Cargas API
export const cargasAPI = {
  list: async () => {
    const response = await api.get('/cargas');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/cargas', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/cargas/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.patch(`/cargas/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/cargas/${id}`);
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  unloadingByCarga: async (cargaId: number) => {
    const response = await api.get(`/reports/unloading/${cargaId}`);
    return response.data;
  },
  paymentByCargas: async (cargaIds: number[]) => {
    const params = new URLSearchParams();
    cargaIds.forEach((id) => params.append('carga_ids', String(id)));
    const response = await api.get('/reports/payment', { params });
    return response.data;
  },
  history: async (limit = 50) => {
    const response = await api.get('/reports/history', { params: { limit } });
    return response.data;
  },
  historyById: async (reportId: number) => {
    const response = await api.get(`/reports/history/${reportId}`);
    return response.data;
  },
  deleteHistory: async (reportId: number) => {
    const response = await api.delete(`/reports/history/${reportId}`);
    return response.data;
  },
};

// Manutenções Realizadas API
export const manutencoesAPI = {
  list: async () => {
    const response = await api.get('/manutencoes');
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/manutencoes', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/manutencoes/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/manutencoes/${id}`);
    return response.data;
  },
};

// Vendas de Embalagens API
export const vendasEmbalagensAPI = {
  list: async () => {
    const response = await api.get('/vendas-embalagens');
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/vendas-embalagens', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/vendas-embalagens/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/vendas-embalagens/${id}`);
    return response.data;
  },
};
