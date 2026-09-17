import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Talk, useGuardian } from '@/context/GuardianContext';

export default function TalksScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { talks, shareTalk } = useGuardian();
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const renderTalk = ({ item }: { item: Talk }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
          <Feather name="sun" size={16} color={colors.accentForeground} />
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>{item.date}</Text>
          <Text style={[styles.incidentCount, { color: colors.mutedForeground }]}>
            {item.incidentCount} {item.incidentCount === 1 ? 'signal' : 'signals'} recorded
          </Text>
        </View>
        <Pressable
          testID={`share-talk-${item.id}`}
          onPress={async () => {
            await Haptics.selectionAsync();
            await shareTalk(item);
          }}
          style={({ pressed }) => [
            styles.iconButton,
            { borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <Feather name="send" size={15} color={colors.secondaryForeground} />
        </Pressable>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>{item.body}</Text>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={talks}
        keyExtractor={(item) => item.id}
        renderItem={renderTalk}
        scrollEnabled={talks.length > 0}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
          gap: 14,
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text style={[styles.kicker, { color: colors.mutedForeground }]}>THE PULPIT</Text>
              <Text style={[styles.heading, { color: colors.foreground }]}>Talk archive</Text>
            </View>
            <View style={[styles.archiveBadge, { backgroundColor: colors.secondary }]}>
              <Feather name="book-open" size={15} color={colors.secondaryForeground} />
              <Text style={[styles.archiveBadgeText, { color: colors.secondaryForeground }]}>{talks.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="book-open" size={24} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No talks yet</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Generate the first safety talk from the Watchtower.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 6 },
  kicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.25, marginBottom: 5 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.7 },
  archiveBadge: { height: 36, minWidth: 44, paddingHorizontal: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  archiveBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  card: { borderRadius: 20, borderWidth: 1, padding: 17 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cardMeta: { flex: 1, marginLeft: 10 },
  date: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  incidentCount: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  iconButton: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 16, letterSpacing: -0.3 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 90, paddingHorizontal: 35 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 14 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 },
});