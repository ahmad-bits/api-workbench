export interface SavedApi {
  id: string;
  user_id: number;
  name: string;
  url: string;
  category?: string;
  has_api_key: boolean;
  api_key_masked?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedApiCreate {
  name: string;
  url: string;
  category?: string;
  api_key?: string;
}

export interface SavedApiUpdate {
  name?: string;
  url?: string;
  category?: string;
  api_key?: string;
}

export interface SavedApiOpenResponse {
  id: string;
  name: string;
  url: string;
  category?: string;
  api_key?: string | null;
  has_api_key: boolean;
}

export interface WorkspaceCategory {
  id: string;
  name: string;
  description: string;
  iconTheme: 'purple' | 'emerald' | 'amber' | 'blue' | 'rose' | 'indigo';
  isDefault?: boolean;
}
