import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import {
  getProfiles,
  createProfile,
  deleteProfile,
  setActiveProfile,
  getActiveProfile,
  renameProfile,
  UserProfile,
} from '@/utils/storage';
import GlowButton from '@/components/GlowButton';
import * as Haptics from 'expo-haptics';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

export default function ProfilesScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎮');

  // Swipeable refs to close them
  const swipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const loadProfiles = useCallback(async () => {
    const list = await getProfiles();
    setProfiles(list);
    setActiveId(getActiveProfile().id);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwitchProfile = useCallback(
    async (profile: UserProfile) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await setActiveProfile(profile);
      setActiveId(profile.id);
    },
    []
  );

  const handleSaveProfile = useCallback(async () => {
    if (!newName.trim()) {
      Alert.alert('Name required', 'Please enter a name for the profile.');
      return;
    }
    const emojiToSave = newEmoji.trim() || '🎮';
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (modalMode === 'create') {
      const profile = await createProfile(newName, emojiToSave);
      await setActiveProfile(profile);
    } else if (modalMode === 'edit' && editingId) {
      await renameProfile(editingId, newName, emojiToSave);
    }
    
    setShowModal(false);
    setNewName('');
    setNewEmoji('🎮');
    setEditingId(null);
    await loadProfiles();
  }, [newName, newEmoji, modalMode, editingId, loadProfiles]);

  const confirmDeleteProfile = useCallback(
    (profile: UserProfile) => {
      // Close swipeable if open
      if (swipeableRefs.current[profile.id]) {
        swipeableRefs.current[profile.id]?.close();
      }

      if (profiles.length <= 1) {
        Alert.alert('Cannot delete', 'You need at least one profile.');
        return;
      }
      Alert.alert(
        'Delete Profile',
        `Delete "${profile.name}"? This will remove all their game history and settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteProfile(profile.id);
              await loadProfiles();
            },
          },
        ]
      );
    },
    [profiles, loadProfiles]
  );

  const openEditModal = useCallback((profile: UserProfile) => {
    // Close swipeable if open
    if (swipeableRefs.current[profile.id]) {
      swipeableRefs.current[profile.id]?.close();
    }
    
    setModalMode('edit');
    setEditingId(profile.id);
    setNewName(profile.name);
    setNewEmoji(profile.emoji);
    setShowModal(true);
  }, []);

  const openCreateModal = useCallback(() => {
    setModalMode('create');
    setEditingId(null);
    setNewName('');
    setNewEmoji('🎮');
    setShowModal(true);
  }, []);

  const handleLongPress = useCallback((profile: UserProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Profile Options',
      `What would you like to do with ${profile.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit', 
          onPress: () => openEditModal(profile)
        },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => confirmDeleteProfile(profile) 
        },
      ]
    );
  }, [openEditModal, confirmDeleteProfile]);

  const renderRightActions = (profile: UserProfile) => {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeButton, { backgroundColor: Colors.neonYellowDim, borderColor: Colors.neonYellow + '40' }]}
          onPress={() => openEditModal(profile)}
        >
          <Text style={styles.swipeButtonIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeButton, { backgroundColor: Colors.dangerDim, borderColor: Colors.danger + '40' }]}
          onPress={() => confirmDeleteProfile(profile)}
        >
          <Text style={styles.swipeButtonIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>PROFILES</Text>
            <View style={styles.backButton} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile list */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SELECT PLAYER</Text>
              {profiles.map((profile) => {
                const isActive = profile.id === activeId;
                return (
                  <Swipeable
                    key={profile.id}
                    ref={(ref) => { swipeableRefs.current[profile.id] = ref; }}
                    renderRightActions={() => renderRightActions(profile)}
                    friction={2}
                    rightThreshold={40}
                  >
                    <TouchableOpacity
                      style={[
                        styles.profileCard,
                        isActive && styles.profileCardActive,
                      ]}
                      onPress={() => handleSwitchProfile(profile)}
                      onLongPress={() => handleLongPress(profile)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.profileEmoji}>{profile.emoji}</Text>
                      <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, isActive && styles.profileNameActive]}>
                          {profile.name}
                        </Text>
                        {isActive && (
                          <Text style={styles.activeLabel}>ACTIVE</Text>
                        )}
                      </View>
                      {isActive && (
                        <View style={styles.activeDot} />
                      )}
                    </TouchableOpacity>
                  </Swipeable>
                );
              })}
            </View>

            {/* Add profile button */}
            <View style={styles.addSection}>
              <GlowButton
                title="New Profile"
                onPress={openCreateModal}
                color={Colors.neonCyan}
                size="large"
                icon="+"
              />
            </View>

            <Text style={styles.hintText}>
              Swipe left or long press to edit / delete
            </Text>
          </ScrollView>
        </View>

        {/* ─── Create/Edit Profile Modal ────────────────────────────────────── */}
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={modalStyles.overlay}>
            <View style={modalStyles.container}>
              <Text style={modalStyles.title}>
                {modalMode === 'create' ? 'New Profile' : 'Edit Profile'}
              </Text>

              {/* Emoji Input */}
              <Text style={modalStyles.label}>AVATAR (EMOJI)</Text>
              <TextInput
                style={modalStyles.emojiInput}
                value={newEmoji}
                onChangeText={setNewEmoji}
                placeholder="🎮"
                placeholderTextColor={Colors.textMuted}
                maxLength={4} // Some emojis use multiple characters
                textAlign="center"
              />

              {/* Name input */}
              <Text style={modalStyles.label}>ENTER NAME</Text>
              <TextInput
                style={modalStyles.nameInput}
                value={newName}
                onChangeText={setNewName}
                placeholder="Player name"
                placeholderTextColor={Colors.textMuted}
                maxLength={20}
                autoFocus={modalMode === 'create'}
                returnKeyType="done"
                onSubmitEditing={handleSaveProfile}
              />

              {/* Preview */}
              <View style={modalStyles.preview}>
                <Text style={modalStyles.previewEmoji}>{newEmoji || '🎮'}</Text>
                <Text style={modalStyles.previewName}>
                  {newName.trim() || 'Player'}
                </Text>
              </View>

              {/* Actions */}
              <View style={modalStyles.actions}>
                <GlowButton
                  title={modalMode === 'create' ? "Create" : "Save"}
                  onPress={handleSaveProfile}
                  color={Colors.neonGreen}
                  size="large"
                  icon="✓"
                />
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={modalStyles.cancelButton}
                >
                  <Text style={modalStyles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ─── Modal Styles ───────────────────────────────────────────────────────────

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 380,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: 2,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 3,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  emojiInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    color: Colors.white,
    fontSize: 32,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    textAlign: 'center',
    alignSelf: 'center',
    minWidth: 80,
  },
  nameInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    color: Colors.white,
    fontSize: FontSize.lg,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    textAlign: 'center',
    letterSpacing: 1,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  previewEmoji: {
    fontSize: 32,
  },
  previewName: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.neonCyan,
    letterSpacing: 1,
  },
  actions: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: '500',
    letterSpacing: 1,
  },
});

// ─── Main Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 70,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: FontSize.sm,
    color: Colors.neonCyan,
    fontWeight: '700',
    letterSpacing: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },

  // Profile list
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  profileCardActive: {
    borderColor: Colors.neonCyan + '50',
    backgroundColor: Colors.neonCyanDim,
  },
  profileEmoji: {
    fontSize: 36,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  profileNameActive: {
    color: Colors.neonCyan,
  },
  activeLabel: {
    fontSize: 10,
    color: Colors.neonCyan,
    fontWeight: '800',
    letterSpacing: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.neonGreen,
    shadowColor: Colors.neonGreenGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },

  // Swipe actions
  swipeActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  swipeButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  swipeButtonIcon: {
    fontSize: 24,
  },

  // Add section
  addSection: {
    alignItems: 'center',
  },

  hintText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});
