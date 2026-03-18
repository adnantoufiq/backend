import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postService } from '../../src/services/post.service';
import { useAuth } from '../../src/context/AuthContext';
import Button from '../../src/components/Button';
import { COLORS, FONTS, SPACING, RADIUS, SHADOW } from '../../src/constants/theme';

const MAX_LENGTH = 1000;

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isEmpty = content.trim().length === 0;

  const getInitials = (username: string) => username.slice(0, 2).toUpperCase();
  const avatarColors = ['#6C63FF', '#FF6584', '#43BCCD', '#F7B731', '#20BF6B'];
  const avatarColor = user
    ? avatarColors[user.username.charCodeAt(0) % avatarColors.length]
    : COLORS.primary;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Post content cannot be empty.');
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Post cannot exceed ${MAX_LENGTH} characters.`);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await postService.createPost(trimmed);
      setContent('');
      Alert.alert('Posted!', 'Your post has been shared successfully.', [
        { text: 'View Feed', onPress: () => router.replace('/(tabs)/feed') },
        { text: 'Post Again', style: 'cancel' },
      ]);
    } catch (err: any) {
      Alert.alert('Failed to Post', err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    if (content.trim().length === 0) return;
    Alert.alert('Discard Post?', 'Your draft will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => setContent('') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Post</Text>
            {content.trim().length > 0 && (
              <TouchableOpacity onPress={handleDiscard} activeOpacity={0.7}>
                <Text style={styles.discardText}>Discard</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Compose Card ── */}
          <View style={styles.composeCard}>
            {/* Author Row */}
            <View style={styles.authorRow}>
              <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarText}>
                  {user ? getInitials(user.username) : '?'}
                </Text>
              </View>
              <View>
                <Text style={styles.username}>@{user?.username}</Text>
                <Text style={styles.visibility}>
                  <Ionicons name="earth-outline" size={12} color={COLORS.textMuted} /> Public
                </Text>
              </View>
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor={COLORS.textMuted}
              value={content}
              onChangeText={(v) => {
                setContent(v);
                if (error) setError(null);
              }}
              multiline
              autoFocus
              maxLength={MAX_LENGTH + 50} // allow slight over so user sees the limit
              textAlignVertical="top"
            />

            {/* Character counter */}
            <View style={styles.counterRow}>
              <Text style={[styles.counter, isOverLimit && styles.counterOver]}>
                {charCount} / {MAX_LENGTH}
              </Text>
              {isOverLimit && (
                <Text style={styles.overLimitText}>
                  {charCount - MAX_LENGTH} characters over limit
                </Text>
              )}
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (charCount / MAX_LENGTH) * 100)}%`,
                    backgroundColor: isOverLimit
                      ? COLORS.error
                      : charCount > MAX_LENGTH * 0.8
                      ? COLORS.warning
                      : COLORS.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* ── Validation Error ── */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Tips ── */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>
              <Ionicons name="bulb-outline" size={14} color={COLORS.primary} /> Tips
            </Text>
            <Text style={styles.tipText}>• Keep it short and engaging</Text>
            <Text style={styles.tipText}>• Text only — up to 1000 characters</Text>
            <Text style={styles.tipText}>• Your post will be visible to everyone</Text>
          </View>

          {/* ── Submit Button ── */}
          <Button
            title="Share Post"
            onPress={handleSubmit}
            loading={loading}
            disabled={isEmpty || isOverLimit}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  discardText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
    fontWeight: '600',
  },
  composeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOW.md,
    marginBottom: SPACING.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  username: {
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  visibility: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  textInput: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    lineHeight: 24,
    minHeight: 140,
    paddingTop: 0,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  counter: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  counterOver: { color: COLORS.error, fontWeight: '700' },
  overLimitText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.error,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  errorText: {
    flex: 1,
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
  },
  tipsCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: 4,
  },
  tipsTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  tipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  submitBtn: { marginTop: SPACING.xs },
});
