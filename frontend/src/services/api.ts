import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

// Projects
export const fetchProjects = () => api.get('/projects').then(res => res.data);
export const createProject = (name: string) => api.post('/projects', { name }).then(res => res.data);

// Assets & Scripts
export const uploadAsset = (projectId: number, formData: FormData) => 
  api.post(`/projects/${projectId}/assets`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);

export const uploadScript = (projectId: number, content: string) => {
  const formData = new FormData();
  formData.append('content', content);
  return api.post(`/projects/${projectId}/script`, formData).then(res => res.data);
};

// Jobs
export const startJob = (projectId: number, videoAssetId: number, scriptId: number, options: any) => 
  api.post(`/projects/${projectId}/process`, {
    video_asset_id: videoAssetId,
    script_id: scriptId,
    options
  }).then(res => res.data);

export const getJobStatus = (jobId: number) => api.get(`/jobs/${jobId}`).then(res => res.data);

// Clips & Edits
export const fetchProjectClips = (projectId: number) => api.get(`/projects/${projectId}/clips`).then(res => res.data);
export const fetchClipDetails = (clipId: number) => api.get(`/clips/${clipId}`).then(res => res.data);
export const submitClipEdits = (clipId: number, operations: any[]) => api.post(`/clips/${clipId}/edits`, { operations }).then(res => res.data);
export const adaptClipPlatform = (clipId: number, platform: string) => api.post(`/clips/${clipId}/platforms`, { platform }).then(res => res.data);
