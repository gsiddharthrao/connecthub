import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { formatApiError } from '../../services/api';

export const fetchFeedPosts = createAsyncThunk(
  'posts/fetchFeedPosts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/posts');
      return response.data.posts || [];
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to fetch posts'));
    }
  }
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/posts/${id}`);
      return response.data.post;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to fetch post'));
    }
  }
);

export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ content, mediaUrl }, { rejectWithValue }) => {
    try {
      const response = await api.post('/posts', { content, mediaUrl });
      return response.data.post;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to create post'));
    }
  }
);

export const toggleLikePost = createAsyncThunk(
  'posts/toggleLikePost',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      return { postId, ...response.data };
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to toggle like'));
    }
  }
);

export const addComment = createAsyncThunk(
  'posts/addComment',
  async ({ postId, content }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/posts/${postId}/comment`, { content });
      return { postId, ...response.data };
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to add comment'));
    }
  }
);

export const deleteComment = createAsyncThunk(
  'posts/deleteComment',
  async ({ postId, commentId }, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${postId}/comment/${commentId}`);
      return { postId, commentId };
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to delete comment'));
    }
  }
);

export const updateComment = createAsyncThunk(
  'posts/updateComment',
  async ({ postId, commentId, content }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/posts/${postId}/comment/${commentId}`, { content });
      return { postId, commentId, comment: response.data.comment };
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to update comment'));
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, content, mediaUrl }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/posts/${postId}`, { content, mediaUrl });
      return response.data.post;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to update post'));
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, { rejectWithValue }) => {
    try {
      await api.delete(`/posts/${postId}`);
      return postId;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to delete post'));
    }
  }
);

const initialState = {
  posts: [],
  currentPost: null,
  loading: false,
  creating: false,
  error: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    clearPostsError: (state) => {
      state.error = null;
    },
    setCurrentPost: (state, action) => {
      state.currentPost = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchFeedPosts
    builder.addCase(fetchFeedPosts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFeedPosts.fulfilled, (state, action) => {
      state.loading = false;
      state.posts = action.payload;
      state.error = null;
    });
    builder.addCase(fetchFeedPosts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchPostById
    builder.addCase(fetchPostById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPostById.fulfilled, (state, action) => {
      state.loading = false;
      state.currentPost = action.payload;
      state.error = null;
    });
    builder.addCase(fetchPostById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // createPost
    builder.addCase(createPost.pending, (state) => {
      state.creating = true;
      state.error = null;
    });
    builder.addCase(createPost.fulfilled, (state, action) => {
      state.creating = false;
      state.posts.unshift(action.payload);
      state.error = null;
    });
    builder.addCase(createPost.rejected, (state, action) => {
      state.creating = false;
      state.error = action.payload;
    });

    // toggleLikePost
    builder.addCase(toggleLikePost.fulfilled, (state, action) => {
      const { postId, isLiked, likesCount, likes } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) {
        post.likesCount = likesCount;
        if (likes) post.likes = likes;
      }
      if (state.currentPost && state.currentPost._id === postId) {
        state.currentPost.likesCount = likesCount;
        if (likes) state.currentPost.likes = likes;
      }
    });
    builder.addCase(toggleLikePost.rejected, (state, action) => {
      state.error = action.payload;
    });

    // addComment
    builder.addCase(addComment.fulfilled, (state, action) => {
      const { postId, comment, commentsCount } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) {
        post.commentsCount = commentsCount;
        if (!post.comments) post.comments = [];
        post.comments.push(comment);
      }
      if (state.currentPost && state.currentPost._id === postId) {
        state.currentPost.commentsCount = commentsCount;
        if (!state.currentPost.comments) state.currentPost.comments = [];
        state.currentPost.comments.push(comment);
      }
    });
    builder.addCase(addComment.rejected, (state, action) => {
      state.error = action.payload;
    });

    // deleteComment
    builder.addCase(deleteComment.fulfilled, (state, action) => {
      const { postId, commentId } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post) {
        if (post.comments) {
          post.comments = post.comments.filter((c) => c._id !== commentId);
        }
        post.commentsCount = Math.max(0, (post.commentsCount || 1) - 1);
      }
      if (state.currentPost && state.currentPost._id === postId) {
        if (state.currentPost.comments) {
          state.currentPost.comments = state.currentPost.comments.filter((c) => c._id !== commentId);
        }
        state.currentPost.commentsCount = Math.max(0, (state.currentPost.commentsCount || 1) - 1);
      }
    });
    builder.addCase(deleteComment.rejected, (state, action) => {
      state.error = action.payload;
    });

    // updateComment
    builder.addCase(updateComment.fulfilled, (state, action) => {
      const { postId, commentId, comment } = action.payload;
      const post = state.posts.find((p) => p._id === postId);
      if (post && post.comments) {
        const idx = post.comments.findIndex((c) => c._id === commentId);
        if (idx !== -1) post.comments[idx] = comment;
      }
      if (state.currentPost && state.currentPost._id === postId && state.currentPost.comments) {
        const idx = state.currentPost.comments.findIndex((c) => c._id === commentId);
        if (idx !== -1) state.currentPost.comments[idx] = comment;
      }
    });

    // updatePost
    builder.addCase(updatePost.fulfilled, (state, action) => {
      const updatedPost = action.payload;
      const index = state.posts.findIndex((p) => p._id === updatedPost._id);
      if (index !== -1) {
        state.posts[index] = { ...state.posts[index], ...updatedPost };
      }
      if (state.currentPost && state.currentPost._id === updatedPost._id) {
        state.currentPost = { ...state.currentPost, ...updatedPost };
      }
    });
    builder.addCase(updatePost.rejected, (state, action) => {
      state.error = action.payload;
    });

    // deletePost (optimistic removal)
    builder.addCase(deletePost.fulfilled, (state, action) => {
      const deletedId = action.payload;
      state.posts = state.posts.filter((p) => p._id !== deletedId);
      if (state.currentPost && state.currentPost._id === deletedId) {
        state.currentPost = null;
      }
    });
    builder.addCase(deletePost.rejected, (state, action) => {
      state.error = action.payload;
    });
  },
});

export const { clearPostsError, setCurrentPost } = postsSlice.actions;
export default postsSlice.reducer;
