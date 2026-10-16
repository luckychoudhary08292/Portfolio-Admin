import {
  CertificateItem,
  ProjectItem,
  SkillCategoryItem,
  SkillLibraryItem,
  ProfileData,
  ExperienceItem,
  InquiryItem,
  SubscriberItem,
  DbStatusInfo,
  StatsOverview,
  AuthUser,
} from '../types.ts';

const API_BASE = '/api';
const AUTH_TOKEN_KEY = 'portfolio_jwt_token';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // localStorage might be unavailable
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // localStorage might be unavailable
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) errMsg = data.error;
    } catch {
      // not json
    }
    throw new Error(errMsg);
  }
  return res.json();
}

function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

export const api = {
  // Authentication
  login: async (email?: string, password?: string, isGuest = false) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, isGuest }),
    });
    const data = await handleResponse<{
      success: boolean;
      token: string;
      user: AuthUser;
    }>(res);

    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  getMe: async () => {
    const res = await authFetch(`${API_BASE}/auth/me`);
    return handleResponse<{ success: boolean; user: AuthUser }>(res);
  },

  logout: () => {
    removeAuthToken();
  },

  // DB & System
  getStatus: () => authFetch(`${API_BASE}/status`).then((r) => handleResponse<DbStatusInfo>(r)),
  getStats: () => authFetch(`${API_BASE}/stats`).then((r) => handleResponse<StatsOverview>(r)),
  reconnect: (uri?: string) =>
    authFetch(`${API_BASE}/reconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri }),
    }).then((r) => handleResponse<any>(r)),
  seedSamples: (force = false) =>
    authFetch(`${API_BASE}/seed-samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    }).then((r) => handleResponse<any>(r)),
  exportAll: () => authFetch(`${API_BASE}/export-all`).then((r) => handleResponse<any>(r)),

  // Certificates
  getCertificates: () =>
    authFetch(`${API_BASE}/certificates`).then((r) => handleResponse<CertificateItem[]>(r)),
  getCertificateCategories: () =>
    authFetch(`${API_BASE}/certificates/categories`).then((r) =>
      handleResponse<{ name: string; count: number }[]>(r)
    ),
  createCertificateCategory: (name: string) =>
    authFetch(`${API_BASE}/certificates/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then((r) => handleResponse<{ success: boolean; category: any }>(r)),
  deleteCertificateCategory: (name: string) =>
    authFetch(`${API_BASE}/certificates/categories/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }).then((r) => handleResponse<{ success: boolean; message: string }>(r)),
  createCertificate: (data: Partial<CertificateItem>) =>
    authFetch(`${API_BASE}/certificates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<CertificateItem>(r)),
  updateCertificate: (id: string, data: Partial<CertificateItem>) =>
    authFetch(`${API_BASE}/certificates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<CertificateItem>(r)),
  deleteCertificate: (id: string) =>
    authFetch(`${API_BASE}/certificates/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ success: boolean; message: string }>(r)
    ),

  // Projects
  getProjects: () => authFetch(`${API_BASE}/projects`).then((r) => handleResponse<ProjectItem[]>(r)),
  createProject: (data: Partial<ProjectItem>) =>
    authFetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<ProjectItem>(r)),
  updateProject: (id: string, data: Partial<ProjectItem>) =>
    authFetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<ProjectItem>(r)),
  deleteProject: (id: string) =>
    authFetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ success: boolean; message: string }>(r)
    ),

  // Skills
  getSkills: () =>
    authFetch(`${API_BASE}/skills`).then((r) => handleResponse<SkillCategoryItem[]>(r)),
  createSkillCategory: (data: Partial<SkillCategoryItem>) =>
    authFetch(`${API_BASE}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<SkillCategoryItem>(r)),
  updateSkillCategory: (id: string, data: Partial<SkillCategoryItem>) =>
    authFetch(`${API_BASE}/skills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<SkillCategoryItem>(r)),
  deleteSkillCategory: (id: string) =>
    authFetch(`${API_BASE}/skills/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ success: boolean; message: string }>(r)
    ),

  // Skill Library Catalog
  getSkillLibrary: (params?: { category?: string; search?: string; popular?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.popular) query.set('popular', 'true');
    const qs = query.toString() ? `?${query.toString()}` : '';
    return authFetch(`${API_BASE}/skill-library${qs}`).then((r) =>
      handleResponse<SkillLibraryItem[]>(r)
    );
  },
  createSkillLibraryItem: (data: Partial<SkillLibraryItem>) =>
    authFetch(`${API_BASE}/skill-library`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<SkillLibraryItem>(r)),
  updateSkillLibraryItem: (id: string, data: Partial<SkillLibraryItem>) =>
    authFetch(`${API_BASE}/skill-library/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<SkillLibraryItem>(r)),
  deleteSkillLibraryItem: (id: string) =>
    authFetch(`${API_BASE}/skill-library/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ success: boolean; message: string }>(r)
    ),
  seedSkillLibrary: (force = false) =>
    authFetch(`${API_BASE}/skill-library/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    }).then((r) => handleResponse<any>(r)),

  // Profile
  getProfile: () => authFetch(`${API_BASE}/profile`).then((r) => handleResponse<ProfileData>(r)),
  updateProfile: (data: Partial<ProfileData>) =>
    authFetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<ProfileData>(r)),

  // Experiences
  getExperiences: () =>
    authFetch(`${API_BASE}/experiences`).then((r) => handleResponse<ExperienceItem[]>(r)),
  createExperience: (data: Partial<ExperienceItem>) =>
    authFetch(`${API_BASE}/experiences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<ExperienceItem>(r)),
  updateExperience: (id: string, data: Partial<ExperienceItem>) =>
    authFetch(`${API_BASE}/experiences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<ExperienceItem>(r)),
  deleteExperience: (id: string) =>
    authFetch(`${API_BASE}/experiences/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ success: boolean; message: string }>(r)
    ),

  // Inquiries
  getInquiries: () =>
    authFetch(`${API_BASE}/inquiries`).then((r) => handleResponse<InquiryItem[]>(r)),
  createInquiry: (data: Partial<InquiryItem>) =>
    authFetch(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => handleResponse<InquiryItem>(r)),
  updateInquiryStatus: (id: string, status: 'new' | 'read' | 'replied' | 'archived') =>
    authFetch(`${API_BASE}/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((r) => handleResponse<InquiryItem>(r)),
  deleteInquiry: (id: string) =>
    authFetch(`${API_BASE}/inquiries/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ success: boolean; message: string }>(r)
    ),

  // Subscribers
  getSubscribers: () =>
    authFetch(`${API_BASE}/subscribers`).then((r) => handleResponse<SubscriberItem[]>(r)),
  createSubscriber: (email: string) =>
    authFetch(`${API_BASE}/subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).then((r) => handleResponse<SubscriberItem>(r)),
  deleteSubscriber: (id: string) =>
    authFetch(`${API_BASE}/subscribers/${id}`, { method: 'DELETE' }).then((r) =>
      handleResponse<{ success: boolean; message: string }>(r)
    ),
};
