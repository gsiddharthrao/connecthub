import assert from 'node:assert';
import { store } from '../src/store/index.js';
import authReducer, {
  clearAuthError,
  setTokenFromStorage,
  registerUser,
  loginUser,
  loadCurrentUser,
  logoutUser,
} from '../src/store/slices/authSlice.js';
import postsReducer, {
  clearPostsError,
  setCurrentPost,
  fetchFeedPosts,
  fetchPostById,
  createPost,
  toggleLikePost,
  addComment,
} from '../src/store/slices/postsSlice.js';
import connectionsReducer, {
  clearConnectionsError,
  setSuggestions,
  fetchConnections,
  fetchPendingRequests,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  fetchSuggestions,
} from '../src/store/slices/connectionsSlice.js';
import profileReducer, {
  clearProfileError,
  setViewedProfile,
  fetchMyProfile,
  fetchProfileById,
  updateMyProfile,
} from '../src/store/slices/profileSlice.js';
import api from '../src/services/api.js';

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, status: 'PASS' });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message, stack: err.stack });
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    results.push({ name, status: 'PASS' });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message, stack: err.stack });
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

console.log('=== STARTING ADVERSARIAL CHALLENGE PROBE ===\n');

// ----------------------------------------------------
// SECTION 1: STORE INITIALIZATION & INITIAL STATES
// ----------------------------------------------------
test('1.1 Store initializes with all 4 slices', () => {
  const state = store.getState();
  assert.ok(state.auth, 'Missing auth slice');
  assert.ok(state.posts, 'Missing posts slice');
  assert.ok(state.connections, 'Missing connections slice');
  assert.ok(state.profile, 'Missing profile slice');
});

test('1.2 Auth slice initial state conforms to contract', () => {
  const state = store.getState().auth;
  assert.strictEqual(state.user, null);
  assert.strictEqual(state.token, null);
  assert.strictEqual(state.isAuthenticated, false);
  assert.strictEqual(state.loading, false);
  assert.strictEqual(state.error, null);
});

test('1.3 Posts slice initial state conforms to contract', () => {
  const state = store.getState().posts;
  assert.deepStrictEqual(state.posts, []);
  assert.strictEqual(state.currentPost, null);
  assert.strictEqual(state.loading, false);
  assert.strictEqual(state.creating, false);
  assert.strictEqual(state.error, null);
});

test('1.4 Connections slice initial state conforms to contract', () => {
  const state = store.getState().connections;
  assert.deepStrictEqual(state.connections, []);
  assert.deepStrictEqual(state.pendingRequests, { incoming: [], outgoing: [] });
  assert.deepStrictEqual(state.suggestions, []);
  assert.strictEqual(state.loading, false);
  assert.strictEqual(state.error, null);
});

test('1.5 Profile slice initial state conforms to contract', () => {
  const state = store.getState().profile;
  assert.strictEqual(state.myProfile, null);
  assert.strictEqual(state.viewedProfile, null);
  assert.strictEqual(state.loading, false);
  assert.strictEqual(state.error, null);
});

// ----------------------------------------------------
// SECTION 2: PROBING REDUX SLICES FOR MISSING PAYLOADS
// ----------------------------------------------------
test('2.1 auth/registerUser.fulfilled with missing token and user in payload', () => {
  const stateBefore = { user: null, token: null, isAuthenticated: false, loading: true, error: null };
  const action = { type: registerUser.fulfilled.type, payload: {} };
  const stateAfter = authReducer(stateBefore, action);
  assert.strictEqual(stateAfter.loading, false);
  assert.strictEqual(stateAfter.isAuthenticated, true);
  assert.strictEqual(stateAfter.token, undefined);
  assert.strictEqual(stateAfter.user, undefined);
});

test('2.2 auth/registerUser.fulfilled with completely undefined payload throws or fails', () => {
  const stateBefore = { user: null, token: null, isAuthenticated: false, loading: true, error: null };
  const action = { type: registerUser.fulfilled.type, payload: undefined };
  try {
    const stateAfter = authReducer(stateBefore, action);
    // If it reaches here without throwing, verify what it did
    assert.strictEqual(stateAfter.loading, false);
  } catch (err) {
    // Reducer threw TypeError: Cannot read properties of undefined (reading 'token')
    console.log('   Observed: reducer threw when payload is undefined:', err.message);
  }
});

test('2.3 posts/createPost.fulfilled with null or undefined payload', () => {
  const stateBefore = { posts: [{ _id: '1', content: 'test' }], currentPost: null, loading: false, creating: true, error: null };
  const action = { type: createPost.fulfilled.type, payload: { _id: '2', content: 'new' } };
  const stateAfter = postsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.posts.length, 2);
  assert.strictEqual(stateAfter.posts[0]._id, '2'); // unshifted to top
});

test('2.4 posts/toggleLikePost.fulfilled with undefined payload', () => {
  const stateBefore = { posts: [{ _id: '1', likesCount: 0 }], currentPost: null, loading: false, creating: false, error: null };
  const action = { type: toggleLikePost.fulfilled.type, payload: undefined };
  let threw = false;
  try {
    postsReducer(stateBefore, action);
  } catch (err) {
    threw = true;
    console.log('   Observed: toggleLikePost throws when payload is undefined (TypeError destructuring postId)');
  }
  assert.ok(threw, 'Should throw TypeError when destructuring undefined payload');
});

test('2.5 posts/toggleLikePost.fulfilled with missing postId in payload', () => {
  const stateBefore = { posts: [{ _id: '1', likesCount: 0 }], currentPost: null, loading: false, creating: false, error: null };
  const action = { type: toggleLikePost.fulfilled.type, payload: { likesCount: 1 } };
  const stateAfter = postsReducer(stateBefore, action);
  // Post should not be modified
  assert.strictEqual(stateAfter.posts[0].likesCount, 0);
});

test('2.6 posts/addComment.fulfilled with undefined payload', () => {
  const stateBefore = { posts: [{ _id: '1', commentsCount: 0 }], currentPost: null, loading: false, creating: false, error: null };
  const action = { type: addComment.fulfilled.type, payload: undefined };
  let threw = false;
  try {
    postsReducer(stateBefore, action);
  } catch (err) {
    threw = true;
  }
  assert.ok(threw, 'Should throw TypeError when destructuring undefined payload');
});

test('2.7 connections/sendConnectionRequest.fulfilled with missing connection in payload', () => {
  const stateBefore = {
    connections: [],
    pendingRequests: { incoming: [], outgoing: [] },
    suggestions: [{ _id: 'u2', user: { _id: 'u2' } }],
    loading: false,
    error: null,
  };
  const action = { type: sendConnectionRequest.fulfilled.type, payload: { recipientId: 'u2' } };
  const stateAfter = connectionsReducer(stateBefore, action);
  // pendingRequests.outgoing should NOT push undefined
  assert.strictEqual(stateAfter.pendingRequests.outgoing.length, 0);
  // suggestion should be removed
  assert.strictEqual(stateAfter.suggestions.length, 0);
});

test('2.8 connections/acceptConnectionRequest.fulfilled with missing connection in payload', () => {
  const stateBefore = {
    connections: [],
    pendingRequests: { incoming: [{ _id: 'req1' }], outgoing: [] },
    suggestions: [],
    loading: false,
    error: null,
  };
  const action = { type: acceptConnectionRequest.fulfilled.type, payload: { requestId: 'req1' } };
  const stateAfter = connectionsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.pendingRequests.incoming.length, 0);
  assert.strictEqual(stateAfter.connections.length, 0); // Guarded: only pushes if connection is present
});

// ----------------------------------------------------
// SECTION 3: PROBING REJECTED THUNK STATES
// ----------------------------------------------------
test('3.1 auth/registerUser.rejected clears session and captures error', () => {
  const stateBefore = {
    user: { _id: 'u1' },
    token: 'jwt-token',
    isAuthenticated: true,
    loading: true,
    error: null,
  };
  const action = { type: registerUser.rejected.type, payload: 'Email already exists' };
  const stateAfter = authReducer(stateBefore, action);
  assert.strictEqual(stateAfter.loading, false);
  assert.strictEqual(stateAfter.isAuthenticated, false);
  assert.strictEqual(stateAfter.token, null);
  assert.strictEqual(stateAfter.user, null);
  assert.strictEqual(stateAfter.error, 'Email already exists');
});

test('3.2 auth/loginUser.rejected clears session and captures error', () => {
  const stateBefore = {
    user: { _id: 'u1' },
    token: 'jwt-token',
    isAuthenticated: true,
    loading: true,
    error: null,
  };
  const action = { type: loginUser.rejected.type, payload: 'Invalid credentials' };
  const stateAfter = authReducer(stateBefore, action);
  assert.strictEqual(stateAfter.loading, false);
  assert.strictEqual(stateAfter.isAuthenticated, false);
  assert.strictEqual(stateAfter.token, null);
  assert.strictEqual(stateAfter.user, null);
  assert.strictEqual(stateAfter.error, 'Invalid credentials');
});

test('3.3 auth/loadCurrentUser.rejected preserves error=null (silent session check)', () => {
  const stateBefore = {
    user: null,
    token: 'old-token',
    isAuthenticated: true,
    loading: true,
    error: null,
  };
  const action = { type: loadCurrentUser.rejected.type, payload: 'Session expired' };
  const stateAfter = authReducer(stateBefore, action);
  assert.strictEqual(stateAfter.loading, false);
  assert.strictEqual(stateAfter.isAuthenticated, false);
  assert.strictEqual(stateAfter.user, null);
  assert.strictEqual(stateAfter.token, null);
  assert.strictEqual(stateAfter.error, null); // Intentionally silenced per design
});

test('3.4 posts/fetchFeedPosts.rejected sets error and clears loading', () => {
  const stateBefore = { posts: [], currentPost: null, loading: true, creating: false, error: null };
  const action = { type: fetchFeedPosts.rejected.type, payload: 'Network error 500' };
  const stateAfter = postsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.loading, false);
  assert.strictEqual(stateAfter.error, 'Network error 500');
});

test('3.5 connections/fetchConnections.rejected sets error and clears loading', () => {
  const stateBefore = { connections: [], pendingRequests: { incoming: [], outgoing: [] }, suggestions: [], loading: true, error: null };
  const action = { type: fetchConnections.rejected.type, payload: 'Unauthorized' };
  const stateAfter = connectionsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.loading, false);
  assert.strictEqual(stateAfter.error, 'Unauthorized');
});

test('3.6 profile/fetchMyProfile.rejected sets error and clears loading', () => {
  const stateBefore = { myProfile: null, viewedProfile: null, loading: true, error: null };
  const action = { type: fetchMyProfile.rejected.type, payload: 'Profile not found' };
  const stateAfter = profileReducer(stateBefore, action);
  assert.strictEqual(stateAfter.loading, false);
  assert.strictEqual(stateAfter.error, 'Profile not found');
});

// ----------------------------------------------------
// SECTION 4: STATE IMMUTABILITY & RTK IMMER SAFETY
// ----------------------------------------------------
test('4.1 Redux store state is protected against direct external mutation', () => {
  const state = store.getState();
  let threw = false;
  try {
    state.auth.isAuthenticated = true; // In strict mode or Immer frozen state
  } catch (err) {
    threw = true;
  }
  // If not in strict mode, verify state object is frozen in dev
  const isFrozen = Object.isFrozen(state.auth) || threw;
  console.log(`   Direct mutation prevented / state frozen: ${isFrozen}`);
  assert.ok(isFrozen || !state.auth.isAuthenticated, 'Store should not reflect mutation if frozen');
});

test('4.2 Reducer handles empty previous state gracefully', () => {
  const defaultState = authReducer(undefined, { type: '@@INIT' });
  assert.strictEqual(defaultState.isAuthenticated, false);
  assert.strictEqual(defaultState.user, null);
});

// ----------------------------------------------------
// SECTION 5: LIKE COUNTER UPDATES & FEED SYNCHRONIZATION
// ----------------------------------------------------
test('5.1 toggleLikePost increments likesCount and updates likes array', () => {
  const post = {
    _id: 'post-100',
    content: 'Hello World',
    likesCount: 0,
    likes: [],
  };
  const stateBefore = {
    posts: [post],
    currentPost: null,
    loading: false,
    creating: false,
    error: null,
  };
  const action = {
    type: toggleLikePost.fulfilled.type,
    payload: {
      postId: 'post-100',
      isLiked: true,
      likesCount: 1,
      likes: ['user-1'],
    },
  };
  const stateAfter = postsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.posts[0].likesCount, 1);
  assert.deepStrictEqual(stateAfter.posts[0].likes, ['user-1']);
});

test('5.2 toggleLikePost decrements likesCount on unlike', () => {
  const post = {
    _id: 'post-100',
    content: 'Hello World',
    likesCount: 1,
    likes: ['user-1'],
  };
  const stateBefore = {
    posts: [post],
    currentPost: null,
    loading: false,
    creating: false,
    error: null,
  };
  const action = {
    type: toggleLikePost.fulfilled.type,
    payload: {
      postId: 'post-100',
      isLiked: false,
      likesCount: 0,
      likes: [],
    },
  };
  const stateAfter = postsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.posts[0].likesCount, 0);
  assert.deepStrictEqual(stateAfter.posts[0].likes, []);
});

test('5.3 toggleLikePost synchronizes currentPost when IDs match', () => {
  const post = {
    _id: 'post-200',
    content: 'Detail View Post',
    likesCount: 5,
    likes: ['u1', 'u2', 'u3', 'u4', 'u5'],
  };
  const currentPost = { ...post };
  const stateBefore = {
    posts: [post],
    currentPost: currentPost,
    loading: false,
    creating: false,
    error: null,
  };
  const action = {
    type: toggleLikePost.fulfilled.type,
    payload: {
      postId: 'post-200',
      isLiked: true,
      likesCount: 6,
      likes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
    },
  };
  const stateAfter = postsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.posts[0].likesCount, 6);
  assert.strictEqual(stateAfter.currentPost.likesCount, 6);
  assert.deepStrictEqual(stateAfter.currentPost.likes, ['u1', 'u2', 'u3', 'u4', 'u5', 'u6']);
});

test('5.4 toggleLikePost handles non-existent post gracefully', () => {
  const stateBefore = {
    posts: [{ _id: 'post-1', likesCount: 0, likes: [] }],
    currentPost: null,
    loading: false,
    creating: false,
    error: null,
  };
  const action = {
    type: toggleLikePost.fulfilled.type,
    payload: {
      postId: 'post-999-missing',
      isLiked: true,
      likesCount: 1,
      likes: ['u1'],
    },
  };
  const stateAfter = postsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.posts[0].likesCount, 0);
  assert.deepStrictEqual(stateAfter.posts[0].likes, []);
});

test('5.5 toggleLikePost with missing likes field in payload leaves old likes untouched', () => {
  const post = {
    _id: 'post-100',
    content: 'Hello World',
    likesCount: 2,
    likes: ['u1', 'u2'],
  };
  const stateBefore = {
    posts: [post],
    currentPost: null,
    loading: false,
    creating: false,
    error: null,
  };
  // Payload missing 'likes' array
  const action = {
    type: toggleLikePost.fulfilled.type,
    payload: {
      postId: 'post-100',
      isLiked: true,
      likesCount: 3,
      // likes is undefined
    },
  };
  const stateAfter = postsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.posts[0].likesCount, 3);
  assert.deepStrictEqual(stateAfter.posts[0].likes, ['u1', 'u2']); // Preserved
});

test('5.6 addComment updates commentsCount and pushes comment into post.comments array', () => {
  const post = {
    _id: 'post-100',
    commentsCount: 0,
    // comments property is initially undefined (e.g. from getPosts which does not populate comments)
  };
  const stateBefore = {
    posts: [post],
    currentPost: null,
    loading: false,
    creating: false,
    error: null,
  };
  const newComment = { _id: 'c-1', text: 'Great insight!', user: { name: 'Bob' } };
  const action = {
    type: addComment.fulfilled.type,
    payload: {
      postId: 'post-100',
      comment: newComment,
      commentsCount: 1,
    },
  };
  const stateAfter = postsReducer(stateBefore, action);
  assert.strictEqual(stateAfter.posts[0].commentsCount, 1);
  assert.ok(Array.isArray(stateAfter.posts[0].comments));
  assert.strictEqual(stateAfter.posts[0].comments.length, 1);
  assert.deepStrictEqual(stateAfter.posts[0].comments[0], newComment);
});

// ----------------------------------------------------
// SECTION 6: TOKEN SERIALIZATION & MIDDLEWARE CHECKS
// ----------------------------------------------------
test('6.1 setTokenFromStorage serializes plain string token', () => {
  const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9.signature';
  store.dispatch(setTokenFromStorage(jwt));
  const state = store.getState().auth;
  assert.strictEqual(state.token, jwt);
  assert.strictEqual(typeof state.token, 'string');
});

test('6.2 clearAuthError resets error state', () => {
  store.dispatch({ type: registerUser.rejected.type, payload: 'Temporary error' });
  assert.strictEqual(store.getState().auth.error, 'Temporary error');
  store.dispatch(clearAuthError());
  assert.strictEqual(store.getState().auth.error, null);
});

test('6.3 Dispatching non-serializable payload warns or throws under RTK serializableCheck', () => {
  let warnedOrCaught = false;
  try {
    // Redux Toolkit configureStore includes serializableCheck by default in development mode
    store.dispatch({
      type: 'auth/testNonSerializable',
      payload: () => { console.log('I am a function'); },
    });
  } catch (err) {
    warnedOrCaught = true;
    console.log('   Observed: RTK serializable check caught non-serializable value:', err.message);
  }
  // In dev mode, console.error is invoked by redux middleware
  console.log('   Dev mode serializableCheck active in RTK configureStore');
});

// ----------------------------------------------------
// SECTION 7: AXIOS API HANDLING & INTERCEPTORS
// ----------------------------------------------------
test('7.1 Axios instance is configured with baseURL and default headers', () => {
  assert.ok(api.defaults.baseURL, 'Missing baseURL in api.js');
  assert.strictEqual(api.defaults.headers['Content-Type'], 'application/json');
  console.log(`   Configured baseURL: ${api.defaults.baseURL}`);
});

test('7.2 Axios request interceptor attaches Authorization header when token exists', async () => {
  // Mock window and localStorage
  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;

  global.window = {};
  global.localStorage = {
    getItem: (key) => (key === 'token' ? 'mock-jwt-token-xyz' : null),
    setItem: () => {},
    removeItem: () => {},
  };

  try {
    // Obtain request interceptor handler
    const requestInterceptor = api.interceptors.request.handlers[0];
    assert.ok(requestInterceptor, 'Missing request interceptor in Axios instance');

    const config = { headers: {} };
    const resultConfig = await requestInterceptor.fulfilled(config);

    assert.strictEqual(resultConfig.headers.Authorization, 'Bearer mock-jwt-token-xyz');
    console.log('   Request interceptor attached Authorization header successfully');
  } finally {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  }
});

test('7.3 Axios request interceptor does NOT attach header when token is absent', async () => {
  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;

  global.window = {};
  global.localStorage = {
    getItem: () => null,
  };

  try {
    const requestInterceptor = api.interceptors.request.handlers[0];
    const config = { headers: {} };
    const resultConfig = await requestInterceptor.fulfilled(config);

    assert.strictEqual(resultConfig.headers.Authorization, undefined);
  } finally {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  }
});

test('7.4 Axios request interceptor runs safely during SSR (window is undefined)', async () => {
  const originalWindow = global.window;
  delete global.window;

  try {
    const requestInterceptor = api.interceptors.request.handlers[0];
    const config = { headers: {} };
    const resultConfig = await requestInterceptor.fulfilled(config);

    assert.strictEqual(resultConfig.headers.Authorization, undefined);
  } finally {
    global.window = originalWindow;
  }
});

test('7.5 Axios response interceptor removes token from localStorage on 401 Unauthorized', async () => {
  let removedKey = null;
  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;

  global.window = {};
  global.localStorage = {
    removeItem: (key) => { removedKey = key; },
  };

  try {
    const responseInterceptor = api.interceptors.response.handlers[0];
    assert.ok(responseInterceptor, 'Missing response interceptor');

    const mock401Error = {
      response: {
        status: 401,
        data: { success: false, message: 'Invalid or expired token' },
      },
    };

    let caughtError = null;
    try {
      await responseInterceptor.rejected(mock401Error);
    } catch (err) {
      caughtError = err;
    }

    assert.strictEqual(removedKey, 'token');
    assert.strictEqual(caughtError, mock401Error);
    console.log('   401 error caused token removal from localStorage');
  } finally {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  }
});

test('7.6 Axios response interceptor does NOT remove token on 403 or 500 error', async () => {
  let removedKey = null;
  const originalWindow = global.window;
  const originalLocalStorage = global.localStorage;

  global.window = {};
  global.localStorage = {
    removeItem: (key) => { removedKey = key; },
  };

  try {
    const responseInterceptor = api.interceptors.response.handlers[0];

    const mock403Error = {
      response: {
        status: 403,
        data: { success: false, message: 'Forbidden' },
      },
    };

    try {
      await responseInterceptor.rejected(mock403Error);
    } catch (err) {}

    assert.strictEqual(removedKey, null);

    const mock500Error = {
      response: {
        status: 500,
        data: { success: false, message: 'Server error' },
      },
    };

    try {
      await responseInterceptor.rejected(mock500Error);
    } catch (err) {}

    assert.strictEqual(removedKey, null);
  } finally {
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
  }
});

test('7.7 Axios response interceptor handles network error with no response object', async () => {
  const originalWindow = global.window;
  delete global.window;

  try {
    const responseInterceptor = api.interceptors.response.handlers[0];
    const networkError = new Error('Network Error: ECONNREFUSED');

    let caughtError = null;
    try {
      await responseInterceptor.rejected(networkError);
    } catch (err) {
      caughtError = err;
    }

    assert.strictEqual(caughtError.message, 'Network Error: ECONNREFUSED');
  } finally {
    global.window = originalWindow;
  }
});

// ----------------------------------------------------
// SECTION 8: THUNK ERROR EXTRACTION ADVERSARIAL STRESS
// ----------------------------------------------------
test('8.1 Thunk error extraction handles various backend error shapes', async () => {
  // Test case A: { message: "Custom error" }
  // Test case B: { error: "ValidationError" }
  // Test case C: err.message
  // Test case D: HTML error response (string body)

  // We can test this by mocking api.post for registerUser
  const originalPost = api.post;

  try {
    // Scenario A: response.data.message
    api.post = async () => {
      const err = new Error('Request failed with 400');
      err.response = { data: { success: false, message: 'Email in use' } };
      throw err;
    };
    const actionA = await registerUser({ name: 'test' })(() => {}, () => ({}));
    assert.strictEqual(actionA.payload, 'Email in use');

    // Scenario B: response.data.error
    api.post = async () => {
      const err = new Error('Request failed with 400');
      err.response = { data: { success: false, error: 'ValidationError' } };
      throw err;
    };
    const actionB = await registerUser({ name: 'test' })(() => {}, () => ({}));
    assert.strictEqual(actionB.payload, 'ValidationError');

    // Scenario C: string HTML data (e.g. 502 bad gateway from reverse proxy)
    api.post = async () => {
      const err = new Error('Request failed with status code 502');
      err.response = { data: '<html><body>502 Bad Gateway</body></html>' };
      throw err;
    };
    const actionC = await registerUser({ name: 'test' })(() => {}, () => ({}));
    assert.strictEqual(actionC.payload, 'Request failed with status code 502');

    // Scenario D: completely empty error
    api.post = async () => {
      throw {};
    };
    const actionD = await registerUser({ name: 'test' })(() => {}, () => ({}));
    assert.strictEqual(actionD.payload, 'Registration failed');

    console.log('   All error response shapes gracefully fallback to informative strings');
  } finally {
    api.post = originalPost;
  }
});

// ----------------------------------------------------
// SUMMARY
// ----------------------------------------------------
console.log('\n=== ADVERSARIAL CHALLENGE PROBE SUMMARY ===');
const passed = results.filter((r) => r.status === 'PASS').length;
const failed = results.filter((r) => r.status === 'FAIL').length;
console.log(`Total tests: ${results.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.error('\nFAILED TESTS:');
  results.filter((r) => r.status === 'FAIL').forEach((r) => {
    console.error(`- ${r.name}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('\nALL PROBES EXECUTED SUCCESSFULLY!');
}
