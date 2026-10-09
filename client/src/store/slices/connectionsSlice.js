import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { formatApiError } from '../../services/api';

export const fetchConnections = createAsyncThunk(
  'connections/fetchConnections',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/connections');
      return response.data.connections || [];
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to fetch connections'));
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'connections/fetchPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/connections/pending');
      return {
        incoming: response.data.incoming || [],
        outgoing: response.data.outgoing || [],
      };
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to fetch pending requests'));
    }
  }
);

export const sendConnectionRequest = createAsyncThunk(
  'connections/sendConnectionRequest',
  async (recipientId, { rejectWithValue }) => {
    try {
      const response = await api.post('/connections/request', { recipientId });
      return {
        connection: response.data.connection,
        recipientId,
      };
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to send connection request'));
    }
  }
);

export const acceptConnectionRequest = createAsyncThunk(
  'connections/acceptConnectionRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/connections/${requestId}/accept`);
      return {
        requestId,
        connection: response.data.connection,
      };
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to accept connection request'));
    }
  }
);

export const rejectConnectionRequest = createAsyncThunk(
  'connections/rejectConnectionRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await api.post(`/connections/${requestId}/reject`);
      return { requestId };
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to reject connection request'));
    }
  }
);

export const fetchSuggestions = createAsyncThunk(
  'connections/fetchSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/profiles?limit=10');
      return response.data.profiles || [];
    } catch (err) {
      return rejectWithValue(formatApiError(err, 'Failed to fetch suggestions'));
    }
  }
);

const initialState = {
  connections: [],
  pendingRequests: {
    incoming: [],
    outgoing: [],
  },
  suggestions: [],
  loading: false,
  error: null,
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    clearConnectionsError: (state) => {
      state.error = null;
    },
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchConnections
    builder.addCase(fetchConnections.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchConnections.fulfilled, (state, action) => {
      state.loading = false;
      state.connections = action.payload;
      state.error = null;
    });
    builder.addCase(fetchConnections.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // fetchPendingRequests
    builder.addCase(fetchPendingRequests.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPendingRequests.fulfilled, (state, action) => {
      state.loading = false;
      state.pendingRequests = action.payload;
      state.error = null;
    });
    builder.addCase(fetchPendingRequests.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // sendConnectionRequest
    builder.addCase(sendConnectionRequest.fulfilled, (state, action) => {
      const { connection, recipientId } = action.payload || {};
      if (connection) {
        state.pendingRequests.outgoing.push(connection);
      }
      // Remove from suggestions if present
      if (recipientId) {
        state.suggestions = state.suggestions.filter(
          (s) => s.user?._id !== recipientId && s._id !== recipientId
        );
      }
    });
    builder.addCase(sendConnectionRequest.rejected, (state, action) => {
      state.error = action.payload;
    });

    // acceptConnectionRequest
    builder.addCase(acceptConnectionRequest.fulfilled, (state, action) => {
      const { requestId, connection } = action.payload || {};
      if (requestId) {
        state.pendingRequests.incoming = state.pendingRequests.incoming.filter(
          (req) => req._id !== requestId
        );
      }
      if (connection) {
        state.connections.push(connection);
      }
    });
    builder.addCase(acceptConnectionRequest.rejected, (state, action) => {
      state.error = action.payload;
    });

    // rejectConnectionRequest
    builder.addCase(rejectConnectionRequest.fulfilled, (state, action) => {
      const { requestId } = action.payload || {};
      if (requestId) {
        state.pendingRequests.incoming = state.pendingRequests.incoming.filter(
          (req) => req._id !== requestId
        );
      }
    });
    builder.addCase(rejectConnectionRequest.rejected, (state, action) => {
      state.error = action.payload;
    });

    // fetchSuggestions
    builder.addCase(fetchSuggestions.fulfilled, (state, action) => {
      state.suggestions = action.payload || [];
    });
    builder.addCase(fetchSuggestions.rejected, (state, action) => {
      state.error = action.payload;
    });
  },
});

export const { clearConnectionsError, setSuggestions } = connectionsSlice.actions;
export default connectionsSlice.reducer;
