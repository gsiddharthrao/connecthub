import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { formatApiError } from '../../services/api';

export const fetchMyProfile = createAsyncThunk(
  'profile/fetchMyProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/profiles/me');
      return response.data.profile;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to fetch my profile'));
    }
  }
);

export const fetchProfileById = createAsyncThunk(
  'profile/fetchProfileById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/profiles/${id}`);
      return response.data.profile;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to fetch profile'));
    }
  }
);

export const updateMyProfile = createAsyncThunk(
  'profile/updateMyProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.put('/profiles/me', profileData);
      return response.data.profile;
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to update profile'));
    }
  }
);

const initialState = {
  myProfile: null,
  viewedProfile: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
    setViewedProfile: (state, action) => {
      state.viewedProfile = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchMyProfile
    builder.addCase(fetchMyProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMyProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.myProfile = action.payload;
      state.error = null;
    });
    builder.addCase(fetchMyProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchProfileById
    builder.addCase(fetchProfileById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfileById.fulfilled, (state, action) => {
      state.loading = false;
      state.viewedProfile = action.payload;
      state.error = null;
    });
    builder.addCase(fetchProfileById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // updateMyProfile
    builder.addCase(updateMyProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateMyProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.myProfile = action.payload;
      state.error = null;
    });
    builder.addCase(updateMyProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearProfileError, setViewedProfile } = profileSlice.actions;
export default profileSlice.reducer;
