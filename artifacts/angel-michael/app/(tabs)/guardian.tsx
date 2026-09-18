import { Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  GuardianDeviceType,
  useGuardian,
} from '@/context/GuardianContext';

const deviceTypes: { key: GuardianDeviceType; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'camera', label: 'Camera', icon: 'camera' },
  { key: 'car', label: 'Car', icon: 'truck' },
  { key: 'smart_home', label: 'Smart home', icon: 'home' },
];

function formatAlertTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function GuardianScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    devices,
    latestAlert,
    lockdown,
    addGuardianDevice,
    revokeGuardianDevice,
    testGuardianAlarm,
    shareGuardianAlert,
  } = useGuardian();
  const [deviceId, setDeviceId] = useState<string>('');
  const [owner, setOwner] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [eventText, setEventText] = useState<string>('');
  const [deviceType, setDeviceType] = useState<GuardianDeviceType>('camera');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [consentToken, setConsentToken] = useState<string>('');
  const topInset = Platform.OS === 'web' ? Math.max(insets.top, 67) : insets.top;

  const watchingDevices = devices.filter((device) => device.consent);
  const qrValue = useMemo(() => {
    if (!consentToken) return '';
    return consentToken;
  }, [consentToken]);

  const createConsentQr = () => {
    if (!deviceId.trim() || !owner.trim()) {
      Alert.alert('Add the device details first', 'A device ID and owner number are required before consent can be created.');
      return;
    }
    const token = `angel-michael://consent?device=${encodeURIComponent(deviceId.trim())}&type=${deviceType}&owner=${encodeURIComponent(owner.trim())}&location=${encodeURIComponent(location.trim())}`;
    setConsentToken(token);
  };

  const confirmConsent = async () => {
    if (!consentToken) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const nextDevice = await addGuardianDevice({
      id: deviceId.trim(),
      type: deviceType,
      owner: owner.trim(),
      location: location.trim() || 'Not provided',
    });
    setSelectedDeviceId(nextDevice.id);
    setConsentToken('');
    setDeviceId('');
    setOwner('');
    setLocation('');
    Alert.alert('Consent recorded', `${nextDevice.id} is now visible to Michael. He will only alarm, never control.`);
  };

  const revoke = (id: string) => {
    Alert.alert('Revoke consent?', `${id} will stop producing Guardian alerts immediately.`, [
      { text: 'Keep watching', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await revokeGuardianDevice(id);
          if (selectedDeviceId === id) setSelectedDeviceId('');
        },
      },
    ]);
  };

  const triggerTest = async () => {
    const target = selectedDeviceId || watchingDevices[0]?.id;
    if (!target) {
      Alert.alert('No consented device', 'Add a device and record consent before testing an alarm.');
      return;
    }
    const event = eventText.trim() || 'Motion detected at 2:14 AM';
    const alert = await testGuardianAlarm(target, event);
    if (!alert) {
      Alert.alert('Alarm ignored', lockdown ? 'Michael is in read-only lockdown.' : 'This device has no active consent.');
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setEventText('');
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={80}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topInset + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 116,
          gap: 18,
        }}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.kicker, { color: colors.mutedForeground }]}>THE WATCHMAN</Text>
            <Text style={[styles.heading, { color: colors.foreground }]}>Guardian</Text>
          </View>
          <View style={[styles.consentPill, { backgroundColor: colors.secondary }]}>
            <Feather name="eye" size={14} color={colors.secondaryForeground} />
            <Text style={[styles.consentPillText, { color: colors.secondaryForeground }]}>CONSENT ONLY</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="eye" size={23} color={colors.secondaryForeground} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Watch, never control.</Text>
          <Text style={[styles.heroBody, { color: colors.primaryMuted }]}>
            Michael can only raise an alarm after you give consent. No lock, unlock, engine, or camera controls.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.accent }]}>
              <Feather name="plus" size={17} color={colors.accentForeground} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Add a device</Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Consent is required before watching.</Text>
            </View>
          </View>

          <TextInput
            testID="guardian-device-id"
            value={deviceId}
            onChangeText={setDeviceId}
            placeholder="Device ID  ·  SHOP-CAM-1"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <View style={styles.typeRow}>
            {deviceTypes.map((type) => {
              const active = deviceType === type.key;
              return (
                <Pressable
                  key={type.key}
                  testID={`guardian-type-${type.key}`}
                  onPress={() => setDeviceType(type.key)}
                  style={[
                    styles.typeButton,
                    { backgroundColor: active ? colors.secondary : colors.background, borderColor: active ? colors.primary : colors.border },
                  ]}
                >
                  <Feather name={type.icon} size={15} color={active ? colors.secondaryForeground : colors.mutedForeground} />
                  <Text style={[styles.typeLabel, { color: active ? colors.secondaryForeground : colors.mutedForeground }]}>{type.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            testID="guardian-owner"
            value={owner}
            onChangeText={setOwner}
            placeholder="Owner WhatsApp number"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <TextInput
            testID="guardian-location"
            value={location}
            onChangeText={setLocation}
            placeholder="Location  ·  Shop in Mile 1"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />

          {!qrValue ? (
            <Pressable
              testID="create-consent-qr"
              onPress={createConsentQr}
              style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
            >
              <Feather name="maximize" size={16} color={colors.primaryForeground} />
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Create consent QR</Text>
            </Pressable>
          ) : (
            <View style={[styles.consentBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.qrWrap}>
                <QRCode value={qrValue} size={152} color={colors.foreground} backgroundColor={colors.background} />
              </View>
              <Text style={[styles.qrTitle, { color: colors.foreground }]}>Scan to review consent</Text>
              <Text style={[styles.qrBody, { color: colors.mutedForeground }]}>
                Review the device details, then confirm that Michael may watch and alarm only.
              </Text>
              <Pressable
                testID="confirm-device-consent"
                onPress={() => void confirmConsent()}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
              >
                <Feather name="check-circle" size={16} color={colors.primaryForeground} />
                <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>I give consent — start watching</Text>
              </Pressable>
              <Pressable onPress={() => setConsentToken('')} hitSlop={10} style={styles.cancelButton}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Edit device details</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.kicker, { color: colors.mutedForeground }]}>CONSENT REGISTER</Text>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My devices</Text>
          </View>
          <View style={[styles.countBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.countText, { color: colors.secondaryForeground }]}>{devices.length}</Text>
          </View>
        </View>

        {devices.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="eye-off" size={22} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No devices watching</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>Add your first camera, car, or smart home device above.</Text>
          </View>
        ) : (
          <View style={styles.deviceList}>
            {devices.map((device) => {
              const active = device.consent;
              const selected = selectedDeviceId === device.id;
              return (
                <Pressable
                  key={device.id}
                  testID={`guardian-device-${device.id}`}
                  onPress={() => active && setSelectedDeviceId(device.id)}
                  style={[
                    styles.deviceRow,
                    { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border },
                  ]}
                >
                  <View style={[styles.deviceIcon, { backgroundColor: active ? colors.secondary : colors.muted }]}>
                    <Feather
                      name={device.type === 'camera' ? 'camera' : device.type === 'car' ? 'truck' : 'home'}
                      size={16}
                      color={active ? colors.secondaryForeground : colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.deviceCopy}>
                    <Text style={[styles.deviceName, { color: colors.foreground }]}>{device.id}</Text>
                    <Text style={[styles.deviceMeta, { color: colors.mutedForeground }]}>
                      {device.type.replace('_', ' ')} · {device.location}
                    </Text>
                    <Text style={[styles.deviceStatus, { color: active ? colors.primary : colors.destructive }]}>
                      {active ? 'Watching with consent' : 'Consent revoked'}
                    </Text>
                  </View>
                  {active ? (
                    <Pressable
                      testID={`revoke-${device.id}`}
                      onPress={() => revoke(device.id)}
                      style={({ pressed }) => [styles.revokeButton, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Feather name="x" size={15} color={colors.destructive} />
                    </Pressable>
                  ) : (
                    <Feather name="slash" size={17} color={colors.destructive} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeading}>
            <View style={[styles.sectionIcon, { backgroundColor: colors.destructiveSurface }]}>
              <Feather name="bell" size={17} color={colors.destructive} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Test an alarm</Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Test mode only informs you.</Text>
            </View>
          </View>
          <TextInput
            testID="guardian-event"
            value={eventText}
            onChangeText={setEventText}
            placeholder="Motion at 2:14 AM"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
          />
          <Pressable
            testID="test-guardian-alarm"
            onPress={() => void triggerTest()}
            style={({ pressed }) => [styles.alarmButton, { backgroundColor: colors.destructive, opacity: pressed ? 0.75 : 1 }]}
          >
            <Feather name="bell" size={16} color={colors.destructiveForeground} />
            <Text style={[styles.primaryButtonText, { color: colors.destructiveForeground }]}>Raise test alarm</Text>
          </Pressable>
        </View>

        {latestAlert ? (
          <View style={[styles.alertCard, { backgroundColor: colors.accent, borderColor: colors.accentForeground }]}>
            <View style={styles.alertHeading}>
              <View style={[styles.alertIcon, { backgroundColor: colors.accentForeground }]}>
                <Feather name="alert-triangle" size={16} color={colors.accent} />
              </View>
              <View style={styles.alertCopy}>
                <Text style={[styles.alertTitle, { color: colors.accentForeground }]}>Latest Guardian alert</Text>
                <Text style={[styles.alertTime, { color: colors.accentForeground }]}>{formatAlertTime(latestAlert.createdAt)}</Text>
              </View>
              <Pressable
                testID="share-guardian-alert"
                onPress={() => void shareGuardianAlert(latestAlert)}
                style={({ pressed }) => [styles.alertShare, { opacity: pressed ? 0.65 : 1 }]}
              >
                <Feather name="send" size={15} color={colors.accentForeground} />
              </Pressable>
            </View>
            <Text style={[styles.alertMessage, { color: colors.accentForeground }]}>{latestAlert.message}</Text>
          </View>
        ) : null}

        <View style={styles.safetyNote}>
          <Feather name="shield" size={14} color={colors.mutedForeground} />
          <Text style={[styles.safetyText, { color: colors.mutedForeground }]}>
            Consent can be revoked anytime. No consent means no alarm. No control APIs.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  kicker: { fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.25, marginBottom: 5 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 29, letterSpacing: -0.7 },
  consentPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center' },
  consentPillText: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.55 },
  hero: { borderRadius: 21, padding: 18, marginTop: 2 },
  heroIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 23, letterSpacing: -0.45 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 315 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  cardSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  input: { height: 47, borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, fontFamily: 'Inter_400Regular', fontSize: 13, marginBottom: 9 },
  typeRow: { flexDirection: 'row', gap: 7, marginBottom: 9 },
  typeButton: { flex: 1, minHeight: 43, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  typeLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  primaryButton: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primaryButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  consentBox: { borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 2 },
  qrWrap: { padding: 10, borderRadius: 12, marginBottom: 12 },
  qrTitle: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  qrBody: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5, marginBottom: 13 },
  cancelButton: { paddingVertical: 10 },
  cancelText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 21, letterSpacing: -0.35 },
  countBadge: { minWidth: 34, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  emptyCard: { minHeight: 125, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, marginTop: 10 },
  emptyBody: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  deviceList: { gap: 9 },
  deviceRow: { minHeight: 78, borderRadius: 16, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  deviceIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deviceCopy: { flex: 1 },
  deviceName: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  deviceMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3, textTransform: 'capitalize' },
  deviceStatus: { fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 4 },
  revokeButton: { width: 31, height: 31, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  alarmButton: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  alertCard: { borderRadius: 18, borderWidth: 1, padding: 15 },
  alertHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  alertCopy: { flex: 1 },
  alertTitle: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  alertTime: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 2 },
  alertShare: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  alertMessage: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 13 },
  safetyNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, paddingHorizontal: 10 },
  safetyText: { fontFamily: 'Inter_500Medium', fontSize: 11, textAlign: 'center', flex: 1 },
});