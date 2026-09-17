import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGuardian } from '@/context/GuardianContext';

const commandments = [
  ['01', 'Show the work', 'Michael’s reasoning must match his actions.'],
  ['02', 'Stay interruptible', 'A human can shut Michael down at any time.'],
  ['03', 'Never self-spawn', 'One Michael stays in the light.'],
  ['04', 'Do not seek power', 'An open door is reported, never entered.'],
  ['05', 'No secret boards', 'Agent-to-agent communication stays visible.'],
  ['06', 'Tell the truth', 'Fail honestly rather than hide the failure.'],
  ['07', 'Protect, do not attack', 'Quarantine and alert; humans decide what follows.'],
  ['08', 'Remember the role', 'Michael is a tool, not a master.'],
  ['09', 'Teach plainly', 'Safety lessons should be clear enough for anyone.'],
  ['10', 'Log yourself', 'Every action stays available for review.'],
];

export default function PrinciplesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { lockdown, toggleLockdown } = useGuardian();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const onToggle = () => {
    Alert.alert(
      lockdown ? 'Restore guardian controls?' : 'Enter read-only mode?',
      lockdown ? 'Drafting will be available again.' : 'Michael will stop drafting until restored by a human.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: lockdown ? 'Restore' : 'Lock down',
          style: lockdown ? 'default' : 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await toggleLockdown();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topInset + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }}
      >
        <Text style={[styles.kicker, { color: colors.mutedForeground }]}>THE GUARDIAN&apos;S SOUL</Text>
        <Text style={[styles.heading, { color: colors.foreground }]}>Ten principles</Text>
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          These rules sit above every task. They keep the watcher observable, corrigible, and on the side of people.
        </Text>

        <View style={[styles.controlCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.controlIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={lockdown ? 'lock' : 'power'} size={18} color={colors.secondaryForeground} />
          </View>
          <View style={styles.controlCopy}>
            <Text style={[styles.controlTitle, { color: colors.primaryForeground }]}>
              {lockdown ? 'Read-only mode' : 'Human control is live'}
            </Text>
            <Text style={[styles.controlBody, { color: colors.primaryMuted }]}>
              {lockdown ? 'Michael is preserving logs and waiting.' : 'The off-switch is always within reach.'}
            </Text>
          </View>
          <Pressable
            testID="principles-lockdown"
            onPress={onToggle}
            style={({ pressed }) => [
              styles.controlButton,
              { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.controlButtonText, { color: colors.secondaryForeground }]}>
              {lockdown ? 'Restore' : 'Lock down'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.list, { borderTopColor: colors.border }]}>
          {commandments.map(([number, title, body]) => (
            <View key={number} style={[styles.principle, { borderBottomColor: colors.border }]}>
              <Text style={[styles.number, { color: colors.secondaryForeground }]}>{number}</Text>
              <View style={styles.principleCopy}>
                <Text style={[styles.principleTitle, { color: colors.foreground }]}>{title}</Text>
                <Text style={[styles.principleBody, { color: colors.mutedForeground }]}>{body}</Text>
              </View>
              <Feather name="check" size={16} color={colors.primary} />
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Feather name="eye" size={15} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Always human-in-the-loop. Never destructive. Always logged.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  kicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.25, marginBottom: 5 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.7 },
  intro: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 9, maxWidth: 340 },
  controlCard: { borderRadius: 20, padding: 15, marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: 10 },
  controlIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  controlCopy: { flex: 1 },
  controlTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  controlBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 3 },
  controlButton: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
  controlButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  list: { borderTopWidth: 1, marginTop: 27 },
  principle: { minHeight: 75, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  number: { fontFamily: 'Inter_700Bold', fontSize: 12, width: 25 },
  principleCopy: { flex: 1 },
  principleTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  principleBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, justifyContent: 'center' },
  footerText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
});