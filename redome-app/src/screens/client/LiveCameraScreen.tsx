import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { COLORS } from '../../constants/colors';
import { Project } from '../../types';

// react-native-video deve ser instalado separadamente para suporte HLS completo
// import Video from 'react-native-video';

export const LiveCameraScreen: React.FC = () => {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (!user?.projectId) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, 'projects', user.projectId), (snap) => {
      if (snap.exists()) setProject({ id: snap.id, ...snap.data() } as Project);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!project?.cameraOnline) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [project?.cameraOnline]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!project?.cameraOnline) {
    return (
      <View style={styles.centered}>
        <Ionicons name="videocam-off-outline" size={60} color={COLORS.pending} />
        <Text style={styles.offlineTitle}>Câmera temporariamente indisponível</Text>
        <Text style={styles.offlineBody}>
          A transmissão ao vivo será reposta em breve.{'\n'}
          Por favor tente mais tarde.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Indicador AO VIVO */}
      <View style={styles.liveIndicator}>
        <Animated.View style={[styles.liveDotOuter, { transform: [{ scale: pulseAnim }] }]} />
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>AO VIVO</Text>
      </View>

      {/* Player HLS — substituir pelo componente Video quando react-native-video estiver instalado */}
      <View style={styles.playerPlaceholder}>
        <Ionicons name="videocam" size={52} color="rgba(255,255,255,0.4)" />
        <Text style={styles.playerPlaceholderText}>
          Para activar o stream HLS, instale{'\n'}
          <Text style={styles.bold}>react-native-video</Text>{'\n'}
          e configure o URL no Firebase
        </Text>
        <Text style={styles.streamUrl} numberOfLines={1}>
          {project.cameraStreamUrl || 'URL não configurado'}
        </Text>
      </View>

      {/* Legenda */}
      <View style={styles.footer}>
        <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.5)" />
        <Text style={styles.footerText}>Imagem com atraso de alguns segundos</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
    gap: 16,
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  offlineBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  liveIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    position: 'absolute',
    left: 10,
  },
  liveDotOuter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,59,48,0.4)',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 6,
  },
  playerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  playerPlaceholderText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  streamUrl: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
});
