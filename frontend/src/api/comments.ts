import { api } from '@/api/client';
import type { Comment } from '@/types/api';

/** GET /videos/{videoId}/comments/ */
export async function listComments(videoId: number): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(`/videos/${videoId}/comments/`);
  return data;
}

/** POST /videos/{videoId}/comments/  body: { comment_text } */
export async function addComment(videoId: number, comment_text: string): Promise<Comment> {
  const { data } = await api.post<Comment>(
    `/videos/${videoId}/comments/`,
    { comment_text },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

/** PUT /videos/{videoId}/comments/{commentId}  body: { comment_text } */
export async function updateComment(
  videoId: number,
  commentId: number,
  comment_text: string
): Promise<Comment> {
  const { data } = await api.put<Comment>(
    `/videos/${videoId}/comments/${commentId}`,
    { comment_text },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
}

/** DELETE /videos/{videoId}/comments/{commentId} */
export async function deleteComment(videoId: number, commentId: number): Promise<void> {
  await api.delete(`/videos/${videoId}/comments/${commentId}`);
}
