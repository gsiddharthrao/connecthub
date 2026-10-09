const request = require('supertest');
const app = require('../src/app');
const Post = require('../src/models/Post');

describe('Posts & Social Interactions REST API Endpoints', () => {
  let tokenAuthor;
  let userAuthor;
  let tokenReader;
  let userReader;

  beforeEach(async () => {
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Author User',
      email: 'author@post.test',
      password: 'password123',
    });
    tokenAuthor = resA.body.token;
    userAuthor = resA.body.user;

    const resB = await request(app).post('/api/auth/register').send({
      name: 'Reader User',
      email: 'reader@post.test',
      password: 'password123',
    });
    tokenReader = resB.body.token;
    userReader = resB.body.user;
  });

  describe('POST /api/posts & GET /api/posts', () => {
    it('should create a new post when authenticated', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({
          content: 'Hello ConnectHub! This is my first architectural post.',
          image: 'https://example.com/banner.png',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.post).toBeDefined();
      expect(res.body.post.content).toBe('Hello ConnectHub! This is my first architectural post.');
      expect(res.body.post.likesCount).toBe(0);
      expect(res.body.post.commentsCount).toBe(0);
      expect(res.body.post.user._id).toBe(userAuthor._id);
    });

    it('should reject post creation with empty content (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/content is required/i);
    });

    it('should reject post creation when unauthenticated (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .send({ content: 'Unauthenticated post attempt' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should list all posts in reverse chronological order', async () => {
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Post #1' });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Post #2' });

      const res = await request(app).get('/api/posts');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.posts[0].content).toBe('Post #2');
      expect(res.body.posts[1].content).toBe('Post #1');
    });
  });

  describe('Atomic Likes Toggle', () => {
    let postId;

    beforeEach(async () => {
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Post to be liked' });
      postId = postRes.body.post._id;
    });

    it('should atomically like a post and increment likesCount to 1', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenReader}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isLiked).toBe(true);
      expect(res.body.likesCount).toBe(1);
      expect(res.body.likes).toContain(userReader._id);
    });

    it('should atomically toggle (unlike) when clicked a second time', async () => {
      // First like
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenReader}`);

      // Second like (toggle off)
      const res = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenReader}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isLiked).toBe(false);
      expect(res.body.likesCount).toBe(0);
      expect(res.body.likes).not.toContain(userReader._id);
    });

    it('should return 401 when liking without authentication', async () => {
      const res = await request(app).post(`/api/posts/${postId}/like`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Comments on Posts', () => {
    let postId;

    beforeEach(async () => {
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Discuss this architectural topic' });
      postId = postRes.body.post._id;
    });

    it('should add a comment and atomically increment commentsCount', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenReader}`)
        .send({ content: 'Insightful discussion point!' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.comment.content).toBe('Insightful discussion point!');
      expect(res.body.commentsCount).toBe(1);

      // Verify post reflects commentsCount
      const postRes = await request(app).get(`/api/posts/${postId}`);
      expect(postRes.body.post.commentsCount).toBe(1);
    });

    it('should reject comment with empty content (400 Bad Request)', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenReader}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should list comments for a post in chronological order', async () => {
      await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenReader}`)
        .send({ content: 'First comment' });

      await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Second response' });

      const res = await request(app).get(`/api/posts/${postId}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.comments[0].content).toBe('First comment');
      expect(res.body.comments[1].content).toBe('Second response');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Post to delete' });
      postId = postRes.body.post._id;
    });

    it('should allow author to delete their own post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenAuthor}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/post deleted/i);

      // Confirm it cannot be fetched
      const getRes = await request(app).get(`/api/posts/${postId}`);
      expect(getRes.status).toBe(404);
    });

    it('should forbid non-author from deleting the post (403 Forbidden)', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenReader}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should soft-delete post (retains record in DB with isDeleted=true, hidden from API)', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenAuthor}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify hidden from public getPostById
      const getRes = await request(app).get(`/api/posts/${postId}`);
      expect(getRes.status).toBe(404);

      // Verify hidden from feed
      const feedRes = await request(app).get('/api/posts');
      const foundInFeed = feedRes.body.posts.some((p) => p._id === postId);
      expect(foundInFeed).toBe(false);

      // Verify record still exists in DB with soft-delete metadata
      const rawPost = await Post.findById(postId);
      expect(rawPost).not.toBeNull();
      expect(rawPost.isDeleted).toBe(true);
      expect(rawPost.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('PUT /api/posts/:id (Edit Own Post)', () => {
    let postId;

    beforeEach(async () => {
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Original post content' });
      postId = postRes.body.post._id;
    });

    it('should allow author to update post content and media', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({
          content: 'Updated post content by author',
          mediaUrl: 'https://example.com/updated.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.post.content).toBe('Updated post content by author');
      expect(res.body.post.mediaUrl).toBe('https://example.com/updated.jpg');

      // Verify in DB
      const updatedPost = await Post.findById(postId);
      expect(updatedPost.content).toBe('Updated post content by author');
    });

    it('should forbid non-author from updating post (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenReader}`)
        .send({ content: 'Malicious modification attempt' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should reject update with empty content (400 Bad Request)', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/content cannot be empty/i);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ content: 'Unauthenticated edit' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 if post does not exist', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/posts/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Edit non-existent' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Comment Deletion & Counter Refinements', () => {
    let postId;
    let commentId;
    let tokenThird;

    beforeEach(async () => {
      const resC = await request(app).post('/api/auth/register').send({
        name: 'Third User',
        email: 'third@post.test',
        password: 'password123',
      });
      tokenThird = resC.body.token;

      // Author creates post
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Post with comment to delete' });
      postId = postRes.body.post._id;

      // Reader comments on Author's post
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenReader}`)
        .send({ content: 'Reader comment on Author post' });
      commentId = commentRes.body.comment._id;
    });

    it('should allow comment author to delete their comment and decrement commentsCount', async () => {
      const delRes = await request(app)
        .delete(`/api/posts/${postId}/comment/${commentId}`)
        .set('Authorization', `Bearer ${tokenReader}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const postRes = await request(app).get(`/api/posts/${postId}`);
      expect(postRes.body.post.commentsCount).toBe(0);
    });

    it('should allow post author to moderate and delete a comment written by another user', async () => {
      const delRes = await request(app)
        .delete(`/api/posts/${postId}/comment/${commentId}`)
        .set('Authorization', `Bearer ${tokenAuthor}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const postRes = await request(app).get(`/api/posts/${postId}`);
      expect(postRes.body.post.commentsCount).toBe(0);
    });

    it('should forbid a third-party from deleting the comment (403 Forbidden)', async () => {
      const delRes = await request(app)
        .delete(`/api/posts/${postId}/comment/${commentId}`)
        .set('Authorization', `Bearer ${tokenThird}`);

      expect(delRes.status).toBe(403);
      expect(delRes.body.success).toBe(false);
      expect(delRes.body.message).toMatch(/not authorized/i);
    });

    it('should accurately decrement commentsCount via /api/posts/comments/:commentId', async () => {
      const delRes = await request(app)
        .delete(`/api/posts/comments/${commentId}`)
        .set('Authorization', `Bearer ${tokenReader}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const postRes = await request(app).get(`/api/posts/${postId}`);
      expect(postRes.body.post.commentsCount).toBe(0);
    });

    it('should reject comment deletion if URL post ID does not match comment post (400 ValidationError)', async () => {
      // Create another post
      const otherPost = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Unrelated post' });
      const otherPostId = otherPost.body.post._id;

      const delRes = await request(app)
        .delete(`/api/posts/${otherPostId}/comment/${commentId}`)
        .set('Authorization', `Bearer ${tokenReader}`);

      expect(delRes.status).toBe(400);
      expect(delRes.body.error).toBe('ValidationError');
    });

    it('should prevent likesCount inflation under rapid same-user like requests', async () => {
      // Create fresh post
      const postRes = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAuthor}`)
        .send({ content: 'Post for like concurrency test' });
      const testPostId = postRes.body.post._id;

      // Fire 4 rapid likes from reader
      const responses = await Promise.all([
        request(app).post(`/api/posts/${testPostId}/like`).set('Authorization', `Bearer ${tokenReader}`),
        request(app).post(`/api/posts/${testPostId}/like`).set('Authorization', `Bearer ${tokenReader}`),
        request(app).post(`/api/posts/${testPostId}/like`).set('Authorization', `Bearer ${tokenReader}`),
        request(app).post(`/api/posts/${testPostId}/like`).set('Authorization', `Bearer ${tokenReader}`),
      ]);

      // All rapid requests must return 200 OK without race errors
      responses.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      const updated = await request(app).get(`/api/posts/${testPostId}`);
      // likesCount must not exceed 1 (since only 1 unique user interacted)
      expect(updated.body.post.likesCount).toBeLessThanOrEqual(1);
      expect(updated.body.post.likesCount).toBeGreaterThanOrEqual(0);
      expect([0, 1]).toContain(updated.body.post.likesCount);
      // likesCount must strictly match likes array length (preventing inflation/desync)
      expect(updated.body.post.likesCount).toBe(updated.body.post.likes.length);

      // Verify post remains fully operable: if toggled to 0, a follow-up like sets count to 1
      if (updated.body.post.likesCount === 0) {
        const followUp = await request(app)
          .post(`/api/posts/${testPostId}/like`)
          .set('Authorization', `Bearer ${tokenReader}`);
        expect(followUp.status).toBe(200);
        expect(followUp.body.isLiked).toBe(true);
        expect(followUp.body.likesCount).toBe(1);
      }
    });
  });
});
