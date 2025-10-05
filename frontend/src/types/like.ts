export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  created_at: string;
}

export interface LikeStats {
  post_id: string;
  like_count: number;
  user_liked: boolean;
  recent_likes: string[];
}

export interface LikeToggleResponse {
  message: string;
  action: 'liked' | 'unliked';
  stats: LikeStats;
}