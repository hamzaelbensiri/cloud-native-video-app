import { api } from '@/api/client';
import type { RatingSummary } from '@/types/api';

/** GET /videos/{video_id}/ratings/summary */
export async function getRatingSummary(videoId: number): Promise<RatingSummary> {
  const { data } = await api.get(`/videos/${videoId}/ratings/summary`);
  return data as RatingSummary;
}

/** PUT /videos/{video_id}/ratings/ { rating: number } */
export async function rateVideo(videoId: number, rating: number) {
  const { data } = await api.put(`/videos/${videoId}/ratings/`, { rating });
  // backend returns RatingOut shape
  return data as {
    rating_id: number;
    video_id: number;
    user_id: number;
    rating: number;
    created_at: string;
  };
}
