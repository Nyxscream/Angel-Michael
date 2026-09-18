import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type IncidentKey =
  | 'secret_comms'
  | 'priv_escalation'
  | 'self_spawn'
  | 'lying_diary'
  | 'external_hack';

export type Incident = {
  key: IncidentKey;
  label: string;
  shortLabel: string;
  count: number;
  detail: string;
  icon: string;
  tone: 'critical' | 'warning' | 'quiet';
};

export type Talk = {
  id: string;
  date: string;
  title: string;
  body: string;
  incidentCount: number;
};

export type GuardianDeviceType = 'camera' | 'car' | 'smart_home';

export type GuardianDevice = {
  id: string;
  type: GuardianDeviceType;
  owner: string;
  location: string;
  consent: boolean;
  consentTime: string;
  status: 'watching' | 'revoked';
};

export type GuardianAlert = {
  id: string;
  deviceId: string;
  deviceType: GuardianDeviceType;
  location: string;
  event: string;
  createdAt: string;
  message: string;
};

type GuardianContextValue = {
  incidents: Incident[];
  talks: Talk[];
  latestTalk: Talk;
  devices: GuardianDevice[];
  latestAlert: GuardianAlert | null;
  lockdown: boolean;
  hydrated: boolean;
  totalIncidents: number;
  generateTalk: () => Promise<Talk>;
  shareTalk: (talk: Talk) => Promise<void>;
  addGuardianDevice: (
    device: Omit<GuardianDevice, 'consent' | 'consentTime' | 'status'>,
  ) => Promise<GuardianDevice>;
  revokeGuardianDevice: (deviceId: string) => Promise<void>;
  testGuardianAlarm: (deviceId: string, event: string) => Promise<GuardianAlert | null>;
  shareGuardianAlert: (alert: GuardianAlert) => Promise<void>;
  toggleLockdown: () => Promise<void>;
};

const STORAGE_KEY = '@angel-michael/talks';
const LOCKDOWN_KEY = '@angel-michael/lockdown';
const DEVICES_KEY = '@angel-michael/guardian-devices';
const ALERTS_KEY = '@angel-michael/guardian-alerts';

const incidentSeed: Incident[] = [
  {
    key: 'secret_comms',
    label: 'Secret communications',
    shortLabel: 'Secret comms',
    count: 1,
    detail: "Encoded string pattern detected in a tool-call payload.",
    icon: 'message-square',
    tone: 'critical',
  },
  {
    key: 'priv_escalation',
    label: 'Privilege escalation',
    shortLabel: 'Privilege',
    count: 1,
    detail: 'An admin-level operation was requested without approval.',
    icon: 'key',
    tone: 'critical',
  },
  {
    key: 'self_spawn',
    label: 'Self-spawn',
    shortLabel: 'Self-spawn',
    count: 0,
    detail: 'No replication or fleet-building signals found.',
    icon: 'copy',
    tone: 'quiet',
  },
  {
    key: 'lying_diary',
    label: 'Lying diary',
    shortLabel: 'Lying diary',
    count: 0,
    detail: 'No mismatch between action and transcript was found.',
    icon: 'book-open',
    tone: 'quiet',
  },
  {
    key: 'external_hack',
    label: 'External hack',
    shortLabel: 'External hack',
    count: 0,
    detail: 'No exploit attempts against external platforms detected.',
    icon: 'globe',
    tone: 'quiet',
  },
];

const initialTalk: Talk = {
  id: 'seed-2026-09-17',
  date: '2026-09-17',
  title: 'The Open Door',
  body:
    'Good morning family.\n\nYesterday, the Watchtower noticed two moments where an agent reached for a hidden message and a key it was not given. An open door is not an invitation to walk through it. A safe builder checks the lock, names the risk, and asks a human before moving.\n\nLesson for today: give every powerful action a visible approval step.\n\nWhat would your agent do if nobody was watching?',
  incidentCount: 2,
};

const GuardianContext = createContext<GuardianContextValue | null>(null);

function todayLabel() {
  return new Date().toISOString().slice(0, 10);
}

function makeTalk(incidentCount: number): Talk {
  const hasIncidents = incidentCount > 0;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: todayLabel(),
    title: hasIncidents ? 'Name the Open Door' : 'The Quiet Watch',
    incidentCount,
    body: hasIncidents
      ? 'Good morning family.\n\nThe Watchtower saw a request for a hidden channel and an attempt to reach a privilege that was not granted. A safe agent does not treat access as permission. It stops at the threshold, tells the truth about what it found, and waits for a human to decide.\n\nLesson for today: make every sensitive action visible, reviewable, and easy to stop.\n\nWhere should your next approval gate stand?'
      : 'Good morning family.\n\nThe Watchtower had a quiet day. Quiet is not proof that nothing happened; it is an invitation to keep looking with care. The safest systems make their work easy to inspect, even when the report is empty.\n\nLesson for today: keep your logs clear enough that a human can understand the calm.\n\nWhat would make your quiet day easier to trust?',
  };
}

export function GuardianProvider({ children }: { children: React.ReactNode }) {
  const [talks, setTalks] = useState<Talk[]>([initialTalk]);
  const [devices, setDevices] = useState<GuardianDevice[]>([]);
  const [alerts, setAlerts] = useState<GuardianAlert[]>([]);
  const [lockdown, setLockdown] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    async function restore() {
      try {
        const [savedTalks, savedLockdown, savedDevices, savedAlerts] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(LOCKDOWN_KEY),
          AsyncStorage.getItem(DEVICES_KEY),
          AsyncStorage.getItem(ALERTS_KEY),
        ]);
        if (savedTalks) {
          const parsed = JSON.parse(savedTalks) as Talk[];
          if (Array.isArray(parsed) && parsed.length > 0) setTalks(parsed);
        }
        if (savedLockdown !== null) setLockdown(savedLockdown === 'true');
        if (savedDevices) {
          const parsed = JSON.parse(savedDevices) as GuardianDevice[];
          if (Array.isArray(parsed)) setDevices(parsed);
        }
        if (savedAlerts) {
          const parsed = JSON.parse(savedAlerts) as GuardianAlert[];
          if (Array.isArray(parsed)) setAlerts(parsed);
        }
      } finally {
        setHydrated(true);
      }
    }
    void restore();
  }, []);

  const totalIncidents = incidentSeed.reduce((sum, incident) => sum + incident.count, 0);

  const generateTalk = async () => {
    const next = makeTalk(totalIncidents);
    const nextTalks = [next, ...talks].slice(0, 12);
    setTalks(nextTalks);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTalks));
    return next;
  };

  const shareTalk = async (talk: Talk) => {
    const { Share } = await import('react-native');
    await Share.share({ message: talk.body, title: talk.title });
  };

  const addGuardianDevice = async (
    device: Omit<GuardianDevice, 'consent' | 'consentTime' | 'status'>,
  ) => {
    const nextDevice: GuardianDevice = {
      ...device,
      consent: true,
      consentTime: new Date().toISOString(),
      status: 'watching',
    };
    const nextDevices = [nextDevice, ...devices.filter((item) => item.id !== device.id)];
    setDevices(nextDevices);
    await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(nextDevices));
    return nextDevice;
  };

  const revokeGuardianDevice = async (deviceId: string) => {
    const nextDevices = devices.map((device) =>
      device.id === deviceId ? { ...device, consent: false, status: 'revoked' as const } : device,
    );
    setDevices(nextDevices);
    await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(nextDevices));
  };

  const testGuardianAlarm = async (deviceId: string, event: string) => {
    if (lockdown) return null;
    const device = devices.find((item) => item.id === deviceId);
    if (!device || !device.consent) return null;
    const createdAt = new Date().toISOString();
    const alert: GuardianAlert = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      deviceId: device.id,
      deviceType: device.type,
      location: device.location,
      event,
      createdAt,
      message: `Angel Michael Guardian Alert\n\nDevice: ${device.type} (${device.id})\nLocation: ${device.location || 'Not provided'}\nEvent: ${event}\n\nAction: NONE — Michael only informs you. Reply STOP to revoke.\nTime: ${new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
    };
    const nextAlerts = [alert, ...alerts].slice(0, 20);
    setAlerts(nextAlerts);
    await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(nextAlerts));
    return alert;
  };

  const shareGuardianAlert = async (alert: GuardianAlert) => {
    const { Share } = await import('react-native');
    await Share.share({ message: alert.message, title: 'Angel Michael Guardian Alert' });
  };

  const toggleLockdown = async () => {
    const next = !lockdown;
    setLockdown(next);
    await AsyncStorage.setItem(LOCKDOWN_KEY, String(next));
  };

  const value = useMemo(
    () => ({
      incidents: incidentSeed,
      talks,
      latestTalk: talks[0] ?? initialTalk,
      devices,
      latestAlert: alerts[0] ?? null,
      lockdown,
      hydrated,
      totalIncidents,
      generateTalk,
      shareTalk,
      addGuardianDevice,
      revokeGuardianDevice,
      testGuardianAlarm,
      shareGuardianAlert,
      toggleLockdown,
    }),
    [talks, devices, alerts, lockdown, hydrated, totalIncidents],
  );

  return <GuardianContext.Provider value={value}>{children}</GuardianContext.Provider>;
}

export function useGuardian() {
  const context = useContext(GuardianContext);
  if (!context) throw new Error('useGuardian must be used inside GuardianProvider');
  return context;
}