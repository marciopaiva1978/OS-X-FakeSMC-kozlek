import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/colors';
import { Phase, Project, ClientTabsParamList, ClientStackParamList } from '../../types';

type TimelineNav = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabsParamList, 'Timeline'>,
  NativeStackNavigationProp<ClientStackParamList>
>;

const STATUS_CONFIG = {
  completed: { color: COLORS.success, icon: 'checkmark-circle' as const, label: 'Concluída' },
  in_progress: { color: COLORS.accent, icon: 'time' as const, label: 'Em curso' },
  pending: { color: COLORS.pending, icon: 'ellipse-outline' as const, label: 'Pendente' },
};

export const TimelineScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<TimelineNav>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const phases: Phase[] = project?.phases ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${project?.progressPercent ?? 0}%` }]}
        />
      </View>
      <Text style={styles.progressLabel}>{project?.progressPercent ?? 0}% concluído</Text>

      {phases.map((phase, index) => {
        const config = STATUS_CONFIG[phase.status];
        const isLast = index === phases.length - 1;
        const isInteractive = phase.status !== 'pending';

        return (
          <TouchableOpacity
            key={phase.id}
            style={styles.phaseRow}
            onPress={() => isInteractive && navigation.navigate('Gallery', { phase })}
            disabled={!isInteractive}
            activeOpacity={0.7}
          >
            {/* Linha de ligação vertical */}
            {!isLast && <View style={[styles.connector, { backgroundColor: config.color }]} />}

            {/* Ícone de estado */}
            <View style={[styles.iconWrapper, { borderColor: config.color }]}>
              <Ionicons name={config.icon} size={20} color={config.color} />
            </View>

            {/* Conteúdo */}
            <View style={styles.phaseContent}>
              <Text style={[styles.phaseName, phase.status === 'pending' && styles.phaseNamePending]}>
                {phase.name}
              </Text>
              <View style={styles.phaseFooter}>
                <Text style={[styles.phaseStatus, { color: config.color }]}>{config.label}</Text>
                {phase.completedAt && (
                  <Text style={styles.phaseDate}>
                    {phase.completedAt.toDate().toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                )}
                {phase.photos.length > 0 && (
                  <View style={styles.photoChip}>
                    <Ionicons name="images-outline" size={12} color={COLORS.primary} />
                    <Text style={styles.photoChipText}>{phase.photos.length}</Text>
                  </View>
                )}
              </View>
            </View>

            {isInteractive && (
              <Ionicons name="chevron-forward" size={16} color={COLORS.pending} />
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: 20,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  connector: {
    position: 'absolute',
    left: 28,
    bottom: -10,
    width: 2,
    height: 10,
    zIndex: -1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: COLORS.surface,
  },
  phaseContent: {
    flex: 1,
  },
  phaseName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  phaseNamePending: {
    color: COLORS.pending,
    fontWeight: '400',
  },
  phaseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phaseStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  phaseDate: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  photoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,60,94,0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  photoChipText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
