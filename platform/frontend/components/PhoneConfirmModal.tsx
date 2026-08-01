import { Modal, View, Text, Pressable, ActivityIndicator, Platform, Share, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { colors } from './ui';
import { waitForVoteSessionConfirm } from '../services/biometrics';

/**
 * Shown on web while waiting for Face ID confirmation on the user's phone.
 */
export function PhoneConfirmModal({
  visible,
  sessionId,
  deepLink,
  token,
  onConfirmed,
  onCancel,
}: {
  visible: boolean;
  sessionId: string;
  deepLink: string;
  token: string;
  onConfirmed: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setWaiting(true);
    setError(null);
    waitForVoteSessionConfirm(token, sessionId)
      .then(() => {
        if (!cancelled) onConfirmed();
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Confirmation failed');
      })
      .finally(() => {
        if (!cancelled) setWaiting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, sessionId, token, onConfirmed]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(deepLink)}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.65)',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: '#111118',
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: '#2a2a3e',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 }}>
            Confirm on your phone
          </Text>
          <Text style={{ color: '#a0a0b0', lineHeight: 22, marginBottom: 16 }}>
            Open the VoteMap app, Face ID this session, then this page continues automatically. Web
            cannot vote without phone biometrics.
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={{ uri: qrUrl }}
              style={{ width: 220, height: 220, backgroundColor: '#fff', borderRadius: 8 }}
              accessibilityLabel="QR code for Face ID confirmation deep link"
            />
          </View>

          <Text selectable style={{ color: colors.blue, fontSize: 13, marginBottom: 8 }}>
            {deepLink}
          </Text>
          <Text style={{ color: '#666680', fontSize: 12, marginBottom: 16 }}>
            Session: {sessionId}
          </Text>

          {waiting && !error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <ActivityIndicator color={colors.purple} />
              <Text style={{ color: '#a0a0b0' }}>Waiting for Face ID…</Text>
            </View>
          )}
          {error && <Text style={{ color: colors.red, marginBottom: 12 }}>{error}</Text>}

          <Pressable
            onPress={() => {
              if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
                void navigator.clipboard.writeText(deepLink);
              } else {
                void Share.share({ message: deepLink });
              }
            }}
            style={{
              backgroundColor: colors.purple,
              paddingVertical: 14,
              borderRadius: 999,
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Copy deep link</Text>
          </Pressable>
          <Pressable onPress={onCancel}>
            <Text style={{ color: '#a0a0b0', textAlign: 'center' }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
