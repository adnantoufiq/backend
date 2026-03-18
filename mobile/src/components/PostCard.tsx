import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post, Comment } from '../services/post.service';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../constants/theme';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLike: (postId: string) => Promise<void>;
  onComment: (postId: string, text: string) => Promise<void>;
}

const formatTimeAgo = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
};

const getInitials = (username: string) =>
  username.slice(0, 2).toUpperCase();

const avatarColors = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#20BF6B',
  '#EB3B5A', '#8854D0', '#0FB9B1', '#FC5C65',
];
const getAvatarColor = (username: string) => {
  const idx = username.charCodeAt(0) % avatarColors.length;
  return avatarColors[idx];
};

const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onLike, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likingPost, setLikingPost] = useState(false);

  const handleLike = async () => {
    if (likingPost) return;
    setLikingPost(true);
    try {
      await onLike(post._id);
    } finally {
      setLikingPost(false);
    }
  };

  const handleSubmitComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) {
      Alert.alert('Too long', 'Comment cannot exceed 500 characters.');
      return;
    }
    setSubmittingComment(true);
    try {
      await onComment(post._id, trimmed);
      setCommentText('');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(post.author.username) }]}>
          <Text style={styles.avatarText}>{getInitials(post.author.username)}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.username}>@{post.author.username}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
      </View>

      {/* ── Content ── */}
      <Text style={styles.content}>{post.content}</Text>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleLike}
          disabled={likingPost}
          activeOpacity={0.7}
        >
          {likingPost ? (
            <ActivityIndicator size={16} color={COLORS.like} />
          ) : (
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={post.isLiked ? COLORS.like : COLORS.textSecondary}
            />
          )}
          <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
            {post.likesCount} {post.likesCount === 1 ? 'Like' : 'Likes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowComments((v) => !v)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showComments ? 'chatbubble' : 'chatbubble-outline'}
            size={20}
            color={showComments ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.actionText, showComments && styles.activeText]}>
            {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Comments Section ── */}
      {showComments && (
        <View style={styles.commentsSection}>
          {/* Existing comments */}
          {post.comments.length === 0 ? (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          ) : (
            post.comments.map((comment: Comment) => (
              <View key={comment._id} style={styles.commentItem}>
                <View style={[styles.commentAvatar, { backgroundColor: getAvatarColor(comment.user.username) }]}>
                  <Text style={styles.commentAvatarText}>
                    {getInitials(comment.user.username)}
                  </Text>
                </View>
                <View style={styles.commentBubble}>
                  <Text style={styles.commentUsername}>@{comment.user.username}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                  <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                </View>
              </View>
            ))
          )}

          {/* Add comment input */}
          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={handleSubmitComment}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!commentText.trim() || submittingComment) && styles.sendBtnDisabled,
              ]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submittingComment}
              activeOpacity={0.8}
            >
              {submittingComment ? (
                <ActivityIndicator size={16} color={COLORS.surface} />
              ) : (
                <Ionicons name="send" size={16} color={COLORS.surface} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  avatarText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  headerInfo: { flex: 1 },
  username: {
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  timestamp: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  content: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  likedText: { color: COLORS.like },
  activeText: { color: COLORS.primary },

  // Comments
  commentsSection: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: SPACING.sm,
  },
  noComments: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  commentItem: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commentAvatarText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: FONTS.sizes.xs,
  },
  commentBubble: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  commentUsername: {
    fontWeight: '700',
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    marginBottom: 2,
  },
  commentText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
});

export default PostCard;
