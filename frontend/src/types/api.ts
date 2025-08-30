export type Role = 'consumer' | 'creator' | 'admin';

export interface User {
  user_id: number;
  email: string;
  username: string;
  display_name?: string | null;
  role: Role;
}

export interface TokenWithUser {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

export interface Video {
  video_id: number;
  title: string;
  publisher?: string | null;
  producer?: string | null;
  genre?: string | null;
  age_rating?: string | null;
  blob_uri?: string | null;
  upload_date: string;
  creator_id: number;
}

export interface Comment {
  comment_id: number;
  video_id: number;
  user_id: number;
  comment_text: string;
  created_at: string;
}

export interface RatingSummary {
  video_id: number;
  average: number;
  count: number;
}
