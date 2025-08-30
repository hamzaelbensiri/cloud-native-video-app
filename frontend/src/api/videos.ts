import { api } from './client';
import type { Video } from '@/types/api';

export async function fetchVideos(skip = 0, limit = 12): Promise<Video[]> {
  // NOTE: trailing slash on collection to avoid Azure redirect/CORS preflight issues
  const { data } = await api.get<Video[]>('/videos/', { params: { skip, limit } });
  return data;
}

export async function fetchVideo(id: number): Promise<Video> {
  const { data } = await api.get<Video>(`/videos/${id}`);
  return data;
}

export type UploadPayload = {
  title: string;
  file: File;
  publisher?: string;
  producer?: string;
  genre?: string;
  age_rating?: string;
};

export async function uploadVideo(
  payload: UploadPayload,
  onProgress?: (pct: number) => void
): Promise<Video> {
  const fd = new FormData();
  fd.append('title', payload.title);
  fd.append('file', payload.file);
  if (payload.publisher) fd.append('publisher', payload.publisher);
  if (payload.producer) fd.append('producer', payload.producer);
  if (payload.genre) fd.append('genre', payload.genre);
  if (payload.age_rating) fd.append('age_rating', payload.age_rating);

  const { data } = await api.post<Video>('/videos/', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (!onProgress || !evt.total) return;
      onProgress(Math.round((evt.loaded / evt.total) * 100));
    },
  });
  return data;
}

export type VideoUpdate = Partial<
  Pick<Video, 'title' | 'publisher' | 'producer' | 'genre' | 'age_rating' | 'blob_uri'>
>;


export async function updateVideo(id: number, changes: VideoUpdate): Promise<Video> {
  const { data } = await api.put<Video>(`/videos/${id}`, changes, {
    headers: { 'Content-Type': 'application/json' },
  });
  return data;
}

export async function deleteVideo(id: number): Promise<void> {
  await api.delete(`/videos/${id}`);
}
