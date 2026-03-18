import api from './api';

export interface Comment {
  _id: string;
  user: { _id: string; username: string };
  text: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  author: { _id: string; username: string };
  content: string;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  comments: Comment[];
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPosts {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const postService = {
  createPost: async (content: string): Promise<Post> => {
    const res = await api.post('/posts', { content });
    return res.data.data.post;
  },

  getPosts: async (params: {
    page?: number;
    limit?: number;
    username?: string;
  } = {}): Promise<PaginatedPosts> => {
    const res = await api.get('/posts', { params });
    return res.data.data;
  },

  likePost: async (postId: string): Promise<{ liked: boolean; likesCount: number }> => {
    const res = await api.post(`/posts/${postId}/like`);
    return res.data.data;
  },

  addComment: async (postId: string, text: string): Promise<Comment> => {
    const res = await api.post(`/posts/${postId}/comment`, { text });
    return res.data.data.comment;
  },
};
