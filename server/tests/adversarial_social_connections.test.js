const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Post = require('../src/models/Post');
const Connection = require('../src/models/Connection');
const Comment = require('../src/models/Comment');

describe('Adversarial & Stress Testing: Social & Connection Logic', () => {
  let userAlice, tokenAlice;
  let userBob, tokenBob;
  let userCharlie, tokenCharlie;

  const nonExistentId = new mongoose.Types.ObjectId().toString();
  const invalidId = 'invalid-mongo-id-xyz-999';

  beforeEach(async () => {
    // Register 3 users
    const resA = await request(app).post('/api/auth/register').send({
      name: 'Alice Challenger',
      email: 'alice.adv@test.com',
      password: 'Password123!',
    });
    tokenAlice = resA.body.token;
    userAlice = resA.body.user;

    const resB = await request(app).post('/api/auth/register').send({
      name: 'Bob Challenger',
      email: 'bob.adv@test.com',
      password: 'Password123!',
    });
    tokenBob = resB.body.token;
    userBob = resB.body.user;

    const resC = await request(app).post('/api/auth/register').send({
      name: 'Charlie Challenger',
      email: 'charlie.adv@test.com',
      password: 'Password123!',
    });
    tokenCharlie = resC.body.token;
    userCharlie = resC.body.user;
  });

  describe('1. Connection Logic Edge Cases', () => {
    it('1.1 should reject self-connection requests with 400 ValidationError', async () => {
      const res = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userAlice._id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('ValidationError');
      expect(res.body.message).toMatch(/cannot send connection request to yourself/i);
    });

    it('1.2 should reject duplicate connection requests in same direction (A -> B twice)', async () => {
      const res1 = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });
      expect(res1.status).toBe(201);

      const res2 = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      expect(res2.status).toBe(400);
      expect(res2.body.success).toBe(false);
      expect(res2.body.message).toMatch(/already pending/i);
    });

    it('1.3 should reject reverse connection request when already pending (B -> A while A -> B pending)', async () => {
      await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      // Bob tries to send to Alice while Alice's request is pending
      const res = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ recipientId: userAlice._id });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already pending/i);
    });

    it('1.4 should reject new request when already connected (A -> B and B -> A after acceptance)', async () => {
      const reqRes = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      const connectionId = reqRes.body.connection._id;

      // Bob accepts
      await request(app)
        .post(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenBob}`);

      // Alice tries again
      const resA = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      expect(resA.status).toBe(400);
      expect(resA.body.message).toMatch(/already connected/i);

      // Bob tries to request Alice
      const resB = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ recipientId: userAlice._id });

      expect(resB.status).toBe(400);
      expect(resB.body.message).toMatch(/already connected/i);
    });

    it('1.5 should reject accepting an already-accepted connection request with 400', async () => {
      const reqRes = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      const connectionId = reqRes.body.connection._id;

      // Bob accepts first time
      const accept1 = await request(app)
        .post(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenBob}`);
      expect(accept1.status).toBe(200);

      // Bob attempts to accept second time
      const accept2 = await request(app)
        .post(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(accept2.status).toBe(400);
      expect(accept2.body.success).toBe(false);
      expect(accept2.body.message).toMatch(/already accepted/i);
    });

    it('1.6 should forbid requester (Alice) or third-party (Charlie) from accepting request', async () => {
      const reqRes = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      const connectionId = reqRes.body.connection._id;

      // Alice attempts to accept her own request
      const resAlice = await request(app)
        .post(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(resAlice.status).toBe(403);
      expect(resAlice.body.message).toMatch(/not authorized/i);

      // Charlie attempts to accept Alice's request to Bob
      const resCharlie = await request(app)
        .post(`/api/connections/${connectionId}/accept`)
        .set('Authorization', `Bearer ${tokenCharlie}`);
      expect(resCharlie.status).toBe(403);
      expect(resCharlie.body.message).toMatch(/not authorized/i);
    });

    it('1.7 should handle rejection and allow re-requesting', async () => {
      const reqRes = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      const connectionId = reqRes.body.connection._id;

      // Bob rejects
      const rejRes = await request(app)
        .post(`/api/connections/${connectionId}/reject`)
        .set('Authorization', `Bearer ${tokenBob}`);
      expect(rejRes.status).toBe(200);
      expect(rejRes.body.success).toBe(true);

      // Verify connection in DB is rejected
      const connInDb = await Connection.findById(connectionId);
      expect(connInDb.status).toBe('rejected');

      // Re-requesting after rejection: Alice sends to Bob again
      const reReqRes = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      expect(reReqRes.status).toBe(201);
      expect(reReqRes.body.connection.status).toBe('pending');
    });

    it('1.8 should forbid non-recipient from rejecting connection request', async () => {
      const reqRes = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: userBob._id });

      const connectionId = reqRes.body.connection._id;

      // Alice (requester) cannot reject
      const resAlice = await request(app)
        .post(`/api/connections/${connectionId}/reject`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(resAlice.status).toBe(403);

      // Charlie (unrelated) cannot reject
      const resCharlie = await request(app)
        .post(`/api/connections/${connectionId}/reject`)
        .set('Authorization', `Bearer ${tokenCharlie}`);
      expect(resCharlie.status).toBe(403);
    });
  });

  describe('2. Post and Comment Authorization & Deletion Edge Cases', () => {
    let postId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Alice original security post' });
      postId = res.body.post._id;
    });

    it('2.1 should forbid non-author from deleting post (403 Forbidden)', async () => {
      const resBob = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(resBob.status).toBe(403);
      expect(resBob.body.success).toBe(false);
      expect(resBob.body.message).toMatch(/not authorized/i);

      // Ensure post still exists
      const postStillThere = await Post.findById(postId);
      expect(postStillThere).not.toBeNull();
    });

    it('2.2 should forbid non-author from deleting another user comment', async () => {
      // Bob comments on Alice's post
      const commRes = await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ content: 'Bob comment on Alice post' });

      const commentId = commRes.body.comment._id;

      // Charlie attempts to delete Bob's comment
      const resCharlie = await request(app)
        .delete(`/api/posts/${postId}/comment/${commentId}`)
        .set('Authorization', `Bearer ${tokenCharlie}`);

      expect(resCharlie.status).toBe(403);
      expect(resCharlie.body.success).toBe(false);
      expect(resCharlie.body.message).toMatch(/not authorized/i);

      // Ensure comment still exists
      const commentStillThere = await Comment.findById(commentId);
      expect(commentStillThere).not.toBeNull();
    });

    it('2.3 should decrement commentsCount when comment author deletes comment', async () => {
      // Bob comments on Alice's post
      const commRes = await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ content: 'Bob will delete this comment' });

      const commentId = commRes.body.comment._id;

      let post = await Post.findById(postId);
      expect(post.commentsCount).toBe(1);

      // Bob deletes his comment
      const delRes = await request(app)
        .delete(`/api/posts/${postId}/comment/${commentId}`)
        .set('Authorization', `Bearer ${tokenBob}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      post = await Post.findById(postId);
      expect(post.commentsCount).toBe(0);
    });

    it('2.4 should cascade delete comments when post author deletes post', async () => {
      // Bob and Charlie comment on post
      await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenBob}`)
        .send({ content: 'Bob comment' });

      await request(app)
        .post(`/api/posts/${postId}/comment`)
        .set('Authorization', `Bearer ${tokenCharlie}`)
        .send({ content: 'Charlie comment' });

      const commentsBefore = await Comment.find({ post: postId });
      expect(commentsBefore.length).toBe(2);

      // Alice deletes her post
      const delRes = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(delRes.status).toBe(200);

      // Comments must be cleaned up
      const commentsAfter = await Comment.find({ post: postId });
      expect(commentsAfter.length).toBe(0);
    });
  });

  describe('3. Non-Existent & Malformed ObjectId Robustness', () => {
    it('3.1 non-existent valid ObjectId should return 404 cleanly across all endpoints', async () => {
      // GET post
      const getPost = await request(app).get(`/api/posts/${nonExistentId}`);
      expect(getPost.status).toBe(404);
      expect(getPost.body.error).toBe('NotFoundError');

      // DELETE post
      const delPost = await request(app)
        .delete(`/api/posts/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(delPost.status).toBe(404);

      // Like non-existent post
      const likePost = await request(app)
        .post(`/api/posts/${nonExistentId}/like`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(likePost.status).toBe(404);

      // Comment on non-existent post
      const commentPost = await request(app)
        .post(`/api/posts/${nonExistentId}/comment`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Hello void' });
      expect(commentPost.status).toBe(404);

      // Connection request to non-existent recipient
      const connReq = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: nonExistentId });
      expect(connReq.status).toBe(404);
      expect(connReq.body.message).toMatch(/recipient user not found/i);

      // Accept non-existent connection
      const acceptConn = await request(app)
        .post(`/api/connections/${nonExistentId}/accept`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(acceptConn.status).toBe(404);

      // Reject non-existent connection
      const rejectConn = await request(app)
        .post(`/api/connections/${nonExistentId}/reject`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(rejectConn.status).toBe(404);
    });

    it('3.2 malformed ObjectId should return 400 CastError cleanly across all endpoints', async () => {
      // GET post
      const getPost = await request(app).get(`/api/posts/${invalidId}`);
      expect(getPost.status).toBe(400);
      expect(getPost.body.error).toBe('CastError');

      // DELETE post
      const delPost = await request(app)
        .delete(`/api/posts/${invalidId}`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(delPost.status).toBe(400);

      // Like post
      const likePost = await request(app)
        .post(`/api/posts/${invalidId}/like`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(likePost.status).toBe(400);

      // Comment on post
      const commentPost = await request(app)
        .post(`/api/posts/${invalidId}/comment`)
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'test' });
      expect(commentPost.status).toBe(400);

      // Connection request
      const connReq = await request(app)
        .post('/api/connections/request')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ recipientId: invalidId });
      expect(connReq.status).toBe(400);
      expect(connReq.body.error).toBe('CastError');

      // Accept connection
      const acceptConn = await request(app)
        .post(`/api/connections/${invalidId}/accept`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(acceptConn.status).toBe(400);

      // Reject connection
      const rejectConn = await request(app)
        .post(`/api/connections/${invalidId}/reject`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(rejectConn.status).toBe(400);

      // Connection status check
      const statusConn = await request(app)
        .get(`/api/connections/status/${invalidId}`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(statusConn.status).toBe(400);
    });
  });

  describe('4. Atomic Likes Toggle & Non-Negative Counter Invariant', () => {
    let postId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${tokenAlice}`)
        .send({ content: 'Atomic Counter Challenge Post' });
      postId = res.body.post._id;
    });

    it('4.1 should maintain accurate likesCount across multiple users liking and unliking', async () => {
      // Initial state
      let post = await Post.findById(postId);
      expect(post.likesCount).toBe(0);
      expect(post.likes.length).toBe(0);

      // Alice likes
      const likeA = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(likeA.body.isLiked).toBe(true);
      expect(likeA.body.likesCount).toBe(1);

      // Bob likes
      const likeB = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenBob}`);
      expect(likeB.body.isLiked).toBe(true);
      expect(likeB.body.likesCount).toBe(2);

      // Charlie likes
      const likeC = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenCharlie}`);
      expect(likeC.body.isLiked).toBe(true);
      expect(likeC.body.likesCount).toBe(3);

      // Verify DB consistency
      post = await Post.findById(postId);
      expect(post.likesCount).toBe(3);
      expect(post.likes.length).toBe(3);

      // Bob unlikes
      const unlikeB = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenBob}`);
      expect(unlikeB.body.isLiked).toBe(false);
      expect(unlikeB.body.likesCount).toBe(2);

      // Alice unlikes
      const unlikeA = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenAlice}`);
      expect(unlikeA.body.isLiked).toBe(false);
      expect(unlikeA.body.likesCount).toBe(1);

      // Charlie unlikes
      const unlikeC = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenCharlie}`);
      expect(unlikeC.body.isLiked).toBe(false);
      expect(unlikeC.body.likesCount).toBe(0);

      // Verify DB non-negative 0
      post = await Post.findById(postId);
      expect(post.likesCount).toBe(0);
      expect(post.likes.length).toBe(0);
    });

    it('4.2 should never allow likesCount to become negative under repeated toggle operations', async () => {
      // Verify initial is 0
      let post = await Post.findById(postId);
      expect(post.likesCount).toBe(0);

      // Simulate a direct edge case: post has likesCount 0, user attempts toggle
      // Toggle on
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      // Toggle off
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${tokenAlice}`);

      post = await Post.findById(postId);
      expect(post.likesCount).toBe(0);
      expect(post.likesCount).toBeGreaterThanOrEqual(0);

      // Even if manually forced to 0 or decremented, likesCount never goes negative
      expect(post.likesCount).toBe(0);
    });

    it('4.3 concurrency stress: concurrent likes from distinct users must produce consistent counts', async () => {
      // Alice, Bob, and Charlie hit like concurrently
      const results = await Promise.all([
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenAlice}`),
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenBob}`),
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenCharlie}`),
      ]);

      // All 3 should return 200
      results.forEach((r) => {
        expect(r.status).toBe(200);
        expect(r.body.success).toBe(true);
      });

      // After settling, DB likes array and likesCount must match and be exactly 3
      const post = await Post.findById(postId);
      expect(post.likes.length).toBe(3);
      expect(post.likesCount).toBe(3);
      expect(post.likesCount).toBeGreaterThanOrEqual(0);
    });

    it('4.4 concurrency stress: concurrent unlikes from distinct users must cleanly settle without negative counts', async () => {
      // First, all 3 users like
      await Promise.all([
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenAlice}`),
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenBob}`),
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenCharlie}`),
      ]);

      let post = await Post.findById(postId);
      expect(post.likesCount).toBe(3);

      // All 3 users unlike concurrently
      const unlikeResults = await Promise.all([
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenAlice}`),
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenBob}`),
        request(app).post(`/api/posts/${postId}/like`).set('Authorization', `Bearer ${tokenCharlie}`),
      ]);

      unlikeResults.forEach((r) => {
        expect(r.status).toBe(200);
        expect(r.body.success).toBe(true);
        expect(r.body.likesCount).toBeGreaterThanOrEqual(0);
      });

      // Post in DB must be exactly 0, not negative
      post = await Post.findById(postId);
      expect(post.likes.length).toBe(0);
      expect(post.likesCount).toBe(0);
      expect(post.likesCount).toBeGreaterThanOrEqual(0);
    });
  });
});
