export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  user_full_name?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CommentCreate {
  post_id: string;
  content: string;
}

export interface CommentUpdate {
  content: string;
}

export interface CommentStats {
  post_id: string;
  comment_count: number;
}