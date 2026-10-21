import {
  ActiveTestSessionRead,
  AuthResponse,
  CareerPath,
  ChatMessage,
  ChatThread,
  ClaimedSkillTestEligibility,
  ConfirmActionRequest,
  CreateThreadRequest,
  EducationEntry,
  Experience,
  FullProfile,
  Interest,
  ProgressDashboardResponse,
  ProgressToggleRequest,
  Project,
  ProjectProgressUpdateRequest,
  ProposedAction,
  ResumePreviewData,
  ResumeSettingsUpdate,
  SelectedPathDetail,
  SelectedPathResponse,
  Skill,
  SkillGrowthDataPoint,
  StudentProfile,
  TestResultResponse,
  User,
  UserSkill,
} from '../types';

let inMemoryToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryToken;
};

const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return 'http://localhost:8000';
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBaseUrl()}/api/v1${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (inMemoryToken) {
    headers.set('Authorization', `Bearer ${inMemoryToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Includes httpOnly cookies (refresh token)
  };

  const response = await fetch(url, config);

  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg =
      (data && (data.detail || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(response.status, typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg), data);
  }

  return data as T;
}

export const api = {
  auth: {
    register: async (payload: any): Promise<AuthResponse> => {
      const res = await request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAccessToken(res.access_token);
      return res;
    },
    login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
      const res = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAccessToken(res.access_token);
      return res;
    },
    refresh: async (): Promise<AuthResponse> => {
      const res = await request<AuthResponse>('/auth/refresh', {
        method: 'POST',
      });
      setAccessToken(res.access_token);
      return res;
    },
    logout: async (): Promise<{ message: string }> => {
      const res = await request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
      setAccessToken(null);
      return res;
    },
    me: async (): Promise<{
      user: User;
      profile: Partial<StudentProfile>;
      selected_path: CareerPath | null;
    }> => {
      return request('/auth/me');
    },
  },

  catalog: {
    getSkills: async (params?: { q?: string; category?: string }): Promise<Skill[]> => {
      const searchParams = new URLSearchParams();
      if (params?.q) searchParams.set('q', params.q);
      if (params?.category) searchParams.set('category', params.category);
      const query = searchParams.toString();
      return request<Skill[]>(`/catalog/skills${query ? `?${query}` : ''}`);
    },
    getInterests: async (): Promise<Interest[]> => {
      return request<Interest[]>('/catalog/interests');
    },
    getPaths: async (): Promise<CareerPath[]> => {
      return request<CareerPath[]>('/catalog/paths');
    },
  },

  profile: {
    get: async (): Promise<FullProfile> => {
      return request<FullProfile>('/profile');
    },
    update: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
      return request<StudentProfile>('/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    updateSkills: async (
      skills: { skill_id?: number; custom_skill_name?: string; category?: string; self_level: number }[]
    ): Promise<UserSkill[]> => {
      return request<UserSkill[]>('/profile/skills', {
        method: 'PUT',
        body: JSON.stringify(skills),
      });
    },
    updateInterests: async (interestIds: number[]): Promise<Interest[]> => {
      return request<Interest[]>('/profile/interests', {
        method: 'PUT',
        body: JSON.stringify({ interest_ids: interestIds }),
      });
    },
    addEducation: async (data: Omit<EducationEntry, 'id' | 'user_id' | 'created_at'>): Promise<EducationEntry> => {
      return request<EducationEntry>('/profile/education', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    deleteEducation: async (id: number): Promise<void> => {
      return request<void>(`/profile/education/${id}`, {
        method: 'DELETE',
      });
    },
    addProject: async (data: Omit<Project, 'id' | 'user_id' | 'created_at'>): Promise<Project> => {
      return request<Project>('/profile/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateProject: async (id: number, data: Partial<Project>): Promise<Project> => {
      return request<Project>(`/profile/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deleteProject: async (id: number): Promise<void> => {
      return request<void>(`/profile/projects/${id}`, {
        method: 'DELETE',
      });
    },
    addExperience: async (data: Omit<Experience, 'id' | 'user_id' | 'created_at'>): Promise<Experience> => {
      return request<Experience>('/profile/experiences', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateExperience: async (id: number, data: Partial<Experience>): Promise<Experience> => {
      return request<Experience>(`/profile/experiences/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    deleteExperience: async (id: number): Promise<void> => {
      return request<void>(`/profile/experiences/${id}`, {
        method: 'DELETE',
      });
    },
    getSelectedPath: async (): Promise<SelectedPathResponse> => {
      return request<SelectedPathResponse>('/profile/selected-path');
    },
    setSelectedPath: async (payload: {
      path_slug: string;
      simulation_id?: number;
    }): Promise<SelectedPathDetail> => {
      return request<SelectedPathDetail>('/profile/selected-path', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    clearSelectedPath: async (): Promise<{ message: string }> => {
      return request<{ message: string }>('/profile/selected-path', {
        method: 'DELETE',
      });
    },
  },

  simulations: {
    create: async (payload: {
      mode?: 'auto' | 'custom';
      custom_path_slugs?: string[];
    }): Promise<{ job_id: string; status: string; simulation_id?: number; error_message?: string }> => {
      return request('/simulations', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getJobStatus: async (
      jobId: string
    ): Promise<{ job_id: string; status: string; simulation_id?: number; error_message?: string }> => {
      return request(`/simulations/jobs/${jobId}`);
    },
    getHistory: async (): Promise<any[]> => {
      return request('/simulations/history');
    },
    getDetail: async (simulationId: number): Promise<any> => {
      return request(`/simulations/${simulationId}`);
    },
    resimulate: async (
      simulationId: number,
      payload: any
    ): Promise<{ job_id: string; status: string; simulation_id?: number; error_message?: string }> => {
      return request(`/simulations/${simulationId}/resimulate`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    regeneratePath: async (simulationId: number, pathSlug: string): Promise<any> => {
      return request(`/simulations/${simulationId}/regenerate-path`, {
        method: 'POST',
        body: JSON.stringify({ path_slug: pathSlug }),
      });
    },
  },

  tests: {
    getEligibility: async (): Promise<ClaimedSkillTestEligibility[]> => {
      return request<ClaimedSkillTestEligibility[]>('/tests/skills');
    },
    startTest: async (skillId: number): Promise<ActiveTestSessionRead> => {
      return request<ActiveTestSessionRead>('/tests/start', {
        method: 'POST',
        body: JSON.stringify({ skill_id: skillId }),
      });
    },
    saveAnswer: async (
      attemptId: number,
      payload: {
        question_id: number;
        selected_option_ids: string[];
        time_spent_seconds?: number;
      }
    ): Promise<{ status: string }> => {
      return request<{ status: string }>(`/tests/${attemptId}/answer`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    recordTabSwitch: async (attemptId: number): Promise<{ tab_switch_count: number }> => {
      return request<{ tab_switch_count: number }>(`/tests/${attemptId}/tab-switch`, {
        method: 'POST',
      });
    },
    submitTest: async (attemptId: number): Promise<TestResultResponse> => {
      return request<TestResultResponse>(`/tests/${attemptId}/submit`, {
        method: 'POST',
      });
    },
    getResults: async (attemptId: number): Promise<TestResultResponse> => {
      return request<TestResultResponse>(`/tests/${attemptId}/results`);
    },
  },

  resume: {
    get: async (): Promise<ResumePreviewData> => {
      return request<ResumePreviewData>('/resume');
    },
    updateSettings: async (settings: ResumeSettingsUpdate): Promise<ResumePreviewData> => {
      return request<ResumePreviewData>('/resume/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
    tailor: async (targetCareerSlug?: string): Promise<{ tailored_summary: string; target_role_title: string }> => {
      return request<{ tailored_summary: string; target_role_title: string }>('/resume/tailor', {
        method: 'POST',
        body: JSON.stringify({ target_career_slug: targetCareerSlug }),
      });
    },
    downloadPdf: async (): Promise<Blob> => {
      const url = `${getBaseUrl()}/api/v1/resume/export/pdf`;
      const headers = new Headers();
      if (inMemoryToken) {
        headers.set('Authorization', `Bearer ${inMemoryToken}`);
      }
      const res = await fetch(url, { headers, credentials: 'include' });
      if (!res.ok) {
        throw new ApiError(res.status, 'Failed to generate and download PDF');
      }
      return res.blob();
    },
    downloadMarkdown: async (): Promise<string> => {
      const url = `${getBaseUrl()}/api/v1/resume/export/markdown`;
      const headers = new Headers();
      if (inMemoryToken) {
        headers.set('Authorization', `Bearer ${inMemoryToken}`);
      }
      const res = await fetch(url, { headers, credentials: 'include' });
      if (!res.ok) {
        throw new ApiError(res.status, 'Failed to download Markdown');
      }
      return res.text();
    },
    downloadJson: async (): Promise<any> => {
      const url = `${getBaseUrl()}/api/v1/resume/export/json`;
      const headers = new Headers();
      if (inMemoryToken) {
        headers.set('Authorization', `Bearer ${inMemoryToken}`);
      }
      const res = await fetch(url, { headers, credentials: 'include' });
      if (!res.ok) {
        throw new ApiError(res.status, 'Failed to download JSON');
      }
      return res.json();
    },
  },

  progress: {
    getDashboard: async (): Promise<ProgressDashboardResponse> => {
      return request<ProgressDashboardResponse>('/progress');
    },
    toggleItem: async (payload: ProgressToggleRequest): Promise<{ message: string }> => {
      return request<{ message: string }>('/progress/toggle', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    updateProject: async (
      payload: ProjectProgressUpdateRequest
    ): Promise<{ message: string }> => {
      return request<{ message: string }>('/progress/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getSkillGrowthHistory: async (): Promise<SkillGrowthDataPoint[]> => {
      return request<SkillGrowthDataPoint[]>('/progress/history');
    },
  },

  mentor: {
    listThreads: async (): Promise<ChatThread[]> => {
      return request<ChatThread[]>('/mentor/threads');
    },
    createThread: async (payload: CreateThreadRequest): Promise<ChatThread> => {
      return request<ChatThread>('/mentor/threads', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getThread: async (threadId: number): Promise<ChatThread> => {
      return request<ChatThread>(`/mentor/threads/${threadId}`);
    },
    deleteThread: async (threadId: number): Promise<void> => {
      return request<void>(`/mentor/threads/${threadId}`, {
        method: 'DELETE',
      });
    },
    getMessages: async (threadId: number): Promise<ChatMessage[]> => {
      return request<ChatMessage[]>(`/mentor/threads/${threadId}/messages`);
    },
    confirmAction: async (
      payload: ConfirmActionRequest
    ): Promise<{ status: string; message: string; item_id: number }> => {
      return request<{ status: string; message: string; item_id: number }>(
        '/mentor/actions/confirm',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
    },
    streamMessage: async (
      threadId: number,
      content: string,
      callbacks: {
        onToken: (token: string) => void;
        onAction?: (actions: ProposedAction[]) => void;
        onDone?: (data: { message_id: number; actions: ProposedAction[] }) => void;
        onError?: (err: string) => void;
      }
    ): Promise<void> => {
      const url = `${getBaseUrl()}/api/v1/mentor/threads/${threadId}/messages`;
      const headers = new Headers({
        'Content-Type': 'application/json',
      });
      if (inMemoryToken) {
        headers.set('Authorization', `Bearer ${inMemoryToken}`);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.detail || `Request failed with status ${response.status}`;
        if (callbacks.onError) callbacks.onError(errMsg);
        return;
      }

      if (!response.body) {
        if (callbacks.onError) callbacks.onError('No response stream available');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          let eventType = 'token';
          let dataStr = '';

          const blockLines = block.split('\n');
          for (const line of blockLines) {
            if (line.startsWith('event: ')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data: ')) {
              dataStr = line.replace('data: ', '').trim();
            }
          }

          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (eventType === 'token' && parsed.token) {
              callbacks.onToken(parsed.token);
            } else if (eventType === 'action' && parsed.actions) {
              if (callbacks.onAction) callbacks.onAction(parsed.actions);
            } else if (eventType === 'done') {
              if (callbacks.onDone) callbacks.onDone(parsed);
            } else if (eventType === 'error') {
              if (callbacks.onError) callbacks.onError(parsed.error || 'AI generation error');
            }
          } catch {
            // Ignore JSON parse errors on malformed chunks
          }
        }
      }
    },
  },
};

export const apiClient = api;
