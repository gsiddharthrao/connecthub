import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Clock, ArrowLeft, Share2, Check, MessageSquare } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import LikeButton from '../../components/feed/LikeButton';
import CommentList from '../../components/feed/CommentList';
import AddCommentForm from '../../components/feed/AddCommentForm';

export async function getServerSideProps(context) {
  const { id } = context.params;
  const apiUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api';

  try {
    const postRes = await fetch(`${apiUrl}/posts/${id}`);

    if (postRes.status === 404) {
      return { notFound: true };
    }

    if (!postRes.ok) {
      return {
        props: {
          post: null,
          error: `Failed to load post (status ${postRes.status})`,
          id,
        },
      };
    }

    const postData = await postRes.json();
    const post = postData.post || postData.data || postData;

    // Fetch comments for SSR preview
    let comments = [];
    try {
      const commentsRes = await fetch(`${apiUrl}/posts/${id}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        comments = commentsData.comments || [];
      }
    } catch {
      // Gracefully continue with empty comments if comments endpoint fails
    }

    return {
      props: {
        post,
        initialComments: comments,
        id,
      },
    };
  } catch (err) {
    return {
      props: {
        post: null,
        error: 'Unable to connect to server',
        id,
      },
    };
  }
}

export default function PublicPostSSR({ post, initialComments = [], error, id }) {
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState(initialComments);

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto my-16 px-4 w-full">
          <Card className="text-center py-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Post Unavailable</h2>
            <p className="text-sm text-gray-500 mb-6">
              {error || 'The requested post could not be retrieved.'}
            </p>
            <Link href="/">
              <Button variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Feed
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const author = post.user || {};
  const authorName = author.name || 'ConnectHub Member';
  const authorHeadline = author.headline || 'Professional';
  const mediaSource = post.mediaUrl || post.image;
  const likesCount = post.likesCount ?? (post.likes ? post.likes.length : 0);
  const commentsCount = comments.length > 0 ? comments.length : (post.commentsCount ?? 0);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined') {
        const url = window.location.href;
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Head>
        <title>{`Post by ${authorName} | ConnectHub`}</title>
        <meta
          name="description"
          content={post.content?.slice(0, 160) || `Post by ${authorName} on ConnectHub`}
        />
        {/* OpenGraph Tags for SSR Social Sharing */}
        <meta property="og:title" content={`Post by ${authorName} - ConnectHub`} />
        <meta
          property="og:description"
          content={post.content?.slice(0, 160) || `Post by ${authorName} on ConnectHub`}
        />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://connecthub.internal/post/${id}`} />
        {mediaSource && <meta property="og:image" content={mediaSource} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Post by ${authorName} - ConnectHub`} />
        <meta
          name="twitter:description"
          content={post.content?.slice(0, 160) || `Post by ${authorName}`}
        />
        {mediaSource && <meta name="twitter:image" content={mediaSource} />}
      </Head>

      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-4">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Link
            href="/"
            className="flex items-center space-x-1 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Feed</span>
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Post Preview</span>
        </div>

        {/* Post Surface Card */}
        <Card noPadding className="shadow-sm overflow-hidden bg-white">
          {/* Author Header */}
          <div className="p-5 pb-3 flex items-start justify-between">
            <div className="flex items-center space-x-3.5">
              <Link href={author._id ? `/profile/${author._id}` : '#'}>
                <Avatar
                  src={author.avatar}
                  name={authorName}
                  size="lg"
                  className="hover:opacity-90 transition-opacity cursor-pointer ring-2 ring-gray-100"
                />
              </Link>
              <div>
                <Link
                  href={author._id ? `/profile/${author._id}` : '#'}
                  className="text-base font-bold text-gray-900 leading-tight hover:text-brand-600 transition-colors block"
                >
                  {authorName}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5">{authorHeadline}</p>
                <div className="flex items-center text-[11px] text-gray-400 mt-1 space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(post.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="px-5 py-3">
            <p className="text-base text-gray-800 whitespace-pre-line leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Media Attachment */}
          {mediaSource && (
            <div className="mt-2 bg-gray-900 flex items-center justify-center max-h-[500px] overflow-hidden">
              <img
                src={mediaSource}
                alt="Post attachment"
                className="w-full object-cover max-h-[500px]"
              />
            </div>
          )}

          {/* Engagement Counters */}
          <div className="px-5 py-2.5 flex items-center justify-between text-xs text-gray-500 border-t border-b border-gray-100 bg-gray-50/50">
            <span>👍 {likesCount} Likes</span>
            <span>💬 {commentsCount} Comments</span>
          </div>

          {/* Interaction Row */}
          <div className="px-4 py-1.5 flex items-center justify-around border-b border-gray-100 bg-white">
            <LikeButton
              postId={post._id}
              likes={post.likes || []}
              likesCount={likesCount}
            />

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center space-x-1.5 py-2 px-4 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
              title="Share post"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-gray-500" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          {/* Comments Thread Section */}
          <div className="p-5 bg-gray-50/70 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-brand-600" />
              <span>Comments ({commentsCount})</span>
            </h3>

            <AddCommentForm
              postId={post._id}
              onCommentAdded={(newComment) => {
                if (newComment) {
                  setComments((prev) => [...prev, newComment]);
                }
              }}
            />

            <CommentList
              postId={post._id}
              comments={comments}
              postAuthorId={author._id}
            />
          </div>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
