import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PostCard from '../../src/components/PostCard';
import { postService, Post } from '../../src/services/post.service';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';

const PAGE_SIZE = 10;

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterUsername, setFilterUsername] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');
  const filterRef = useRef<TextInput>(null);

  const fetchPosts = useCallback(
    async (pageNum: number, username: string, replace: boolean) => {
      try {
        setError(null);
        const data = await postService.getPosts({
          page: pageNum,
          limit: PAGE_SIZE,
          username: username || undefined,
        });

        setPosts((prev) => (replace ? data.posts : [...prev, ...data.posts]));
        setTotalPages(data.pagination.totalPages);
        setPage(pageNum);
      } catch (err: any) {
        setError(err.message || 'Failed to load posts');
      }
    },
    []
  );

  // Reload feed when tab becomes focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchPosts(1, appliedFilter, true).finally(() => setLoading(false));
    }, [appliedFilter])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(1, appliedFilter, true);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, appliedFilter, false);
    setLoadingMore(false);
  };

  const handleApplyFilter = () => {
    filterRef.current?.blur();
    setAppliedFilter(filterUsername.trim());
  };

  const handleClearFilter = () => {
    setFilterUsername('');
    setAppliedFilter('');
    filterRef.current?.blur();
  };

  const handleLike = useCallback(
    async (postId: string) => {
      try {
        const result = await postService.likePost(postId);
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? { ...p, isLiked: result.liked, likesCount: result.likesCount, likes: [] }
              : p
          )
        );
      } catch (err: any) {
        // Silently ignore like errors on the list
      }
    },
    []
  );

  const handleComment = useCallback(
    async (postId: string, text: string) => {
      const comment = await postService.addComment(postId, text);
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                comments: [...p.comments, comment],
                commentsCount: p.commentsCount + 1,
              }
            : p
        )
      );
    },
    []
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={64} color={COLORS.border} />
        <Text style={styles.emptyTitle}>
          {appliedFilter ? `No posts from @${appliedFilter}` : 'No posts yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {appliedFilter
            ? 'Try a different username filter'
            : 'Be the first to share something!'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Feed</Text>
        <Text style={styles.headerSubtitle}>
          {appliedFilter ? `Showing posts by @${appliedFilter}` : 'All posts'}
        </Text>
      </View>

      {/* ── Username Filter ── */}
      <View style={styles.filterContainer}>
        <View style={styles.filterInputWrapper}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.filterIcon} />
          <TextInput
            ref={filterRef}
            style={styles.filterInput}
            placeholder="Filter by username..."
            placeholderTextColor={COLORS.textMuted}
            value={filterUsername}
            onChangeText={setFilterUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={handleApplyFilter}
          />
          {filterUsername.length > 0 && (
            <TouchableOpacity onPress={handleClearFilter} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={handleApplyFilter} activeOpacity={0.8}>
          <Text style={styles.filterBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* ── Error Banner ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Feed List ── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUserId={user?._id ?? ''}
              onLike={handleLike}
              onComment={handleComment}
            />
          )}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  filterInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    height: 44,
    ...SHADOW.sm,
  },
  filterIcon: {
    marginRight: SPACING.xs,
  },
  filterInput: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
  },
  filterBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  filterBtnText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  errorText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
  },
  retryText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  loadMoreContainer: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
