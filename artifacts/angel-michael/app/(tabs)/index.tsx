import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Incident, useGuardian } from '@/context/GuardianContext';

function formatDate() {
  return new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(
    new Date(),
  );
}

function SignalCard({ incident }: { incident: Incident }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState<boolean>(false);
  const isQuiet = incident.count === 0;
  return (
    <Pressable
      testID={`signal-${incident.key}`}
      onPress={() => setExpanded((value) => !value)}
      style={({ pressed }) => [
        styles.signalCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.86 : 1 },
      ]}
    >
      <View style={[styles.signalIcon, { backgroundColor: isQuiet ? colors.muted : colors.destructiveSurface }]}>
        <Feather
          name={incident.icon as keyof typeof Feather.glyphMap}
          size={15}
          color={isQuiet ? colors.mutedForeground : colors.destructive}
        />
      </View>
      <View style={styles.signalCopy}>
        <Text style={[styles.signalLabel, { color: colors.foreground }]} numberOfLines={1}>
          {incident.shortLabel}
        </Text>
        <Text style={[styles.signalStatus, { color: isQuiet ? colors.mutedForeground : colors.destructive }]}>
          {isQuiet ? 'Clear' : `${incident.count} flagged`}
        </Text>
        {expanded ? (
          <Text style={[styles.signalDetail, { color: colors.mutedForeground }]}>{incident.detail}</Text>
        ) : null}
      </View>
      <Feather name={expanded ? 'chevron-up' : 'chevron-right'} size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { incidents, latestTalk, totalIncidents, lockdown, generateTalk, shareTalk, toggleLockdown } =
    useGuardian();
  const [generating, setGenerating] = useState<boolean>(false);
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const onGenerate = async () => {
    if (lockdown) {
      Alert.alert('Read-only mode', 'Michael is in lockdown. Turn off lockdown before drafting a new talk.');
      return;
    }
    setGenerating(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await generateTalk();
    setGenerating(false);
  };

  const onShare = async () => {
    await Haptics.selectionAsync();
    await shareTalk(latestTalk);
  };

  const onLockdown = () => {
    Alert.alert(
      lockdown ? 'Restore guardian controls?' : 'Enter read-only mode?',
      lockdown
        ? 'Michael will be able to draft safety talks again.'
        : 'Michael will stop drafting new talks until a human turns this off.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: lockdown ? 'Restore controls' : 'Lock down',
          style: lockdown ? 'default' : 'destructive',
          onPress: () => void toggleLockdown(),
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topInset + 10, paddingBottom: insets.bottom + 116 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topLine}>
          <View>
            <View style={styles.brandLine}>
              <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
                <Feather name="shield" size={15} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>ANGEL MICHAEL</Text>
            </View>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate()}</Text>
          </View>
          <View style={[styles.onlinePill, { backgroundColor: lockdown ? colors.accent : colors.secondary }]}>
            <View style={[styles.onlineDot, { backgroundColor: lockdown ? colors.accentForeground : colors.primary }]} />
            <Text style={[styles.onlineText, { color: lockdown ? colors.accentForeground : colors.secondaryForeground }]}>
              {lockdown ? 'READ-ONLY' : 'ONLINE'}
            </Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroGlow, { backgroundColor: colors.primaryGlow }]} />
          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: colors.secondaryForeground }]}>THE WATCHTOWER</Text>
            <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>
              {totalIncidents === 0 ? 'Quiet skies.' : `${totalIncidents} signals need you.`}
            </Text>
            <Text style={[styles.heroBody, { color: colors.primaryMuted }]}>
              {totalIncidents === 0
                ? 'No incidents detected in the last 24 hours.'
                : 'Michael found activity worth a human review.'}
            </Text>
          </View>
          <View style={[styles.heroShield, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={32} color={colors.secondaryForeground} />
            <View style={[styles.heroSpark, { backgroundColor: colors.accent }]} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>LAST 24 HOURS</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Signal report</Text>
          </View>
          <Pressable testID="view-all-signals" onPress={() => router.push('/principles')} hitSlop={10}>
            <Text style={[styles.link, { color: colors.secondaryForeground }]}>What we watch</Text>
          </Pressable>
        </View>

        <View style={styles.signalGrid}>
          {incidents.map((incident) => (
            <SignalCard key={incident.key} incident={incident} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: colors.mutedForeground }]}>THE PULPIT</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today&apos;s talk</Text>
          </View>
          <Pressable testID="open-talks" onPress={() => router.push('/talks')} hitSlop={10}>
            <Text style={[styles.link, { color: colors.secondaryForeground }]}>View archive</Text>
          </Pressable>
        </View>

        <View style={[styles.talkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.talkTop}>
            <View style={[styles.talkBadge, { backgroundColor: colors.accent }]}>
              <Feather name="sun" size={14} color={colors.accentForeground} />
              <Text style={[styles.talkBadgeText, { color: colors.accentForeground }]}>SAFETY TOOLBOX TALK</Text>
            </View>
            <Text style={[styles.talkDate, { color: colors.mutedForeground }]}>{latestTalk.date}</Text>
          </View>
          <Text style={[styles.talkTitle, { color: colors.foreground }]}>{latestTalk.title}</Text>
          <Text style={[styles.talkExcerpt, { color: colors.mutedForeground }]} numberOfLines={4}>
            {latestTalk.body}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.talkActions}>
            <Pressable
              testID="generate-talk"
              onPress={() => void onGenerate()}
              disabled={generating}
              style={({ pressed }) => [
                styles.primaryAction,
                { backgroundColor: colors.primary, opacity: pressed || generating ? 0.72 : 1 },
              ]}
            >
              {generating ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Feather name="refresh-cw" size={16} color={colors.primaryForeground} />
              )}
              <Text style={[styles.primaryActionText, { color: colors.primaryForeground }]}>
                {generating ? 'Drafting…' : 'Generate new'}
              </Text>
            </Pressable>
            <Pressable
              testID="share-talk"
              onPress={() => void onShare()}
              style={({ pressed }) => [
                styles.shareAction,
                { borderColor: colors.border, backgroundColor: colors.background, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Feather name="send" size={16} color={colors.secondaryForeground} />
              <Text style={[styles.shareActionText, { color: colors.secondaryForeground }]}>Share</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          testID="lockdown-control"
          onPress={onLockdown}
          style={({ pressed }) => [
            styles.lockdownBar,
            { borderColor: lockdown ? colors.accentForeground : colors.border, backgroundColor: colors.card, opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <View style={[styles.lockdownIcon, { backgroundColor: lockdown ? colors.accent : colors.muted }]}>
            <Feather name={lockdown ? 'lock' : 'power'} size={16} color={lockdown ? colors.accentForeground : colors.mutedForeground} />
          </View>
          <View style={styles.lockdownCopy}>
            <Text style={[styles.lockdownTitle, { color: colors.foreground }]}>
              {lockdown ? 'Read-only mode is active' : 'Human control'}
            </Text>
            <Text style={[styles.lockdownBody, { color: colors.mutedForeground }]}>
              {lockdown ? 'Tap to restore guardian controls.' : 'Lock Michael down at any time.'}
            </Text>
          </View>
          <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 22 },
  topLine: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  brandLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: 'Inter_700Bold', fontSize: 12, letterSpacing: 1.2 },
  date: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 6 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 30, paddingHorizontal: 10, paddingVertical: 7 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 0.8 },
  hero: { minHeight: 168, borderRadius: 24, padding: 20, overflow: 'hidden', flexDirection: 'row', justifyContent: 'space-between' },
  heroGlow: { position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -85, top: -105, opacity: 0.65 },
  heroCopy: { flex: 1, paddingRight: 12, justifyContent: 'center' },
  heroKicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.6, marginBottom: 10 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 27, lineHeight: 33, letterSpacing: -0.6 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 190 },
  heroShield: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', transform: [{ rotate: '8deg' }] },
  heroSpark: { position: 'absolute', width: 8, height: 8, borderRadius: 4, top: 11, right: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.25, marginBottom: 5 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, letterSpacing: -0.3 },
  link: { fontFamily: 'Inter_600SemiBold', fontSize: 12, paddingBottom: 2 },
  signalGrid: { gap: 9 },
  signalCard: { minHeight: 61, borderRadius: 16, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  signalIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  signalCopy: { flex: 1 },
  signalLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  signalStatus: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 3 },
  signalDetail: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 6 },
  talkCard: { borderRadius: 20, borderWidth: 1, padding: 17 },
  talkTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  talkBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  talkBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.65 },
  talkDate: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  talkTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.4, marginTop: 16 },
  talkExcerpt: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 8 },
  divider: { height: 1, marginVertical: 16 },
  talkActions: { flexDirection: 'row', gap: 9 },
  primaryAction: { flex: 1, minHeight: 46, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  shareAction: { minHeight: 46, paddingHorizontal: 16, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  shareActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  lockdownBar: { minHeight: 68, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  lockdownIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  lockdownCopy: { flex: 1 },
  lockdownTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  lockdownBody: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
});
