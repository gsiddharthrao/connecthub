import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { formatApiError } from '../../services/api';

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password, headline }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        headline,
      });
      if (typeof window !== 'undefined' && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Registration failed'));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (typeof window !== 'undefined' && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Login failed'));
    }
  }
);

export const demoLoginUser = createAsyncThunk(
  'auth/demoLoginUser',
  async (_, { rejectWithValue }) => {
    try {
      // 1. Try dedicated demo login endpoint
      const response = await api.post('/auth/demo');
      if (typeof window !== 'undefined' && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (err) {
      // If network unreachable, fail with informative hint
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        return rejectWithValue(formatApiError(err, 'ConnectHub server is unreachable.'));
      }

      // 2. Fallback to normal login with demo credentials
      try {
        const fallbackRes = await api.post('/auth/login', {
          email: 'sarah.chen@techcorp.io',
          password: 'Password123!',
        });
        if (typeof window !== 'undefined' && fallbackRes.data.token) {
          localStorage.setItem('token', fallbackRes.data.token);
        }
        return fallbackRes.data;
      } catch (fallbackErr) {
        return rejectWithValue(formatApiError(fallbackErr, 'Demo login failed'));
      }
    }
  }
);

export const loadCurrentUser = createAsyncThunk(
  'auth/loadCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (err) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return rejectWithValue(formatApiError(err, 'Failed to load user'));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    return true;
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setTokenFromStorage: (state, action) => {
      state.token = action.payload;
    },
    updateAuthUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // registerUser
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
    });

    // loginUser
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
    });

    // demoLoginUser
    builder.addCase(demoLoginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(demoLoginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
    });
    builder.addCase(demoLoginUser.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.error = action.payload;
    });

    // loadCurrentUser
    builder.addCase(loadCurrentUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      if (typeof window !== 'undefined') {
        state.token = localStorage.getItem('token');
      }
      state.error = null;
    });
    builder.addCase(loadCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      // Do not treat initial missing session as a fatal error banner
      state.error = null;
    });

    // logoutUser
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    });
  },
});

export const { clearAuthError, setTokenFromStorage, updateAuthUser } = authSlice.actions;
export default authSlice.reducer;
