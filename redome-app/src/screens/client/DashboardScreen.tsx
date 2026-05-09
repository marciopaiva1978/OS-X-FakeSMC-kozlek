import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress } from '../../components/CircularProgress';
import { COLORS } from '../../constants/colors';
import { Project, AppNotification, ClientTabsParamList, ClientStackParamList } from '../../types';

type DashboardNav = CompositeNavigationProp<
  BottomTabNavigationProp<ClientTabsParamList, 'Dashboard'>,
  NativeStackNavigationProp<ClientStackParamList>
>;

const PHASE_ICONS: Record<string, string> = {
  'Projecto e Licenciamento': 'document',
  'Preparação do Terreno': 'earth',
  'Fundações': 'layers',
  'Estrutura': 'business',
  'Alvenaria e Cobertura': 'home',
  'Instalações (água, electricidade, gás)': 'flash',
  'Revestimentos e Acabamentos': 'color-palette',
  'Arranjos Exteriores': 'leaf',
  'Vistoria e Entrega': 'checkmark-circle',
};

function timeAgo(timestamp: Timestamp): string {
  const now = Date.now();
  const date = timestamp.toDate().getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
  const weeks = Math.floor(diff / 604800);
  return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
}

function formatDate(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
}

function getLastUpdate(project: Project): Timestamp | null {
  const completedDates = project.phases
    .filter((p) => p.completedAt)
    .map((p) => p.completedAt as Timestamp)
    .sort((a, b) => b.toMillis() - a.toMillis());
  return completedDates[0] ?? null;
}

function greetingByHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 19) return 'Boa tarde';
  return 'Boa noite';
}

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<DashboardNav>();
  const [project, setProject] = useState<Project | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Botão de notificações no cabeçalho com badge
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={styles.headerBtn}
        >
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, unreadCount]);

  useEffect(() => {
    if (!user?.projectId) {
      setLoading(false);
      return;
    }

    const projectRef = doc(db, 'projects', user.projectId);
    const unsubProject = onSnapshot(projectRef, (snap) => {
      if (snap.exists()) {
        setProject({ id: snap.id, ...snap.data() } as Project);
      }
      setLoading(false);
      setRefreshing(false);
    });

    const notifQuery = query(
      collection(db, 'notifications'),
      where('clientId', '==', user.id),
      where('read', '==', false)
    );
    const unsubNotif = onSnapshot(notifQuery, (snap) => {
      setUnreadCount(snap.size);
    });

    return () => {
      unsubProject();
      unsubNotif();
    };
  }, [user]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={52} color={COLORS.pending} />
        <Text style={styles.noProjectText}>Nenhuma obra associada à sua conta.</Text>
        <Text style={styles.noProjectSub}>Por favor contacte a Redome.</Text>
      </View>
    );
  }

  const lastUpdate = getLastUpdate(project);
  const phaseIcon = (PHASE_ICONS[project.currentPhase] ?? 'build') as React.ComponentProps<typeof Ionicons>['name'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Saudação */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            {greetingByHour()}, <Text style={styles.greetingName}>{user?.name.split(' ')[0]}</Text>
          </Text>
          <Text style={styles.greetingDate}>
            {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>

        {/* Card principal da obra */}
        <View style={styles.projectCard}>
          {/* Endereço */}
          <View style={styles.addressRow}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.addressText} numberOfLines={2}>{project.address}</Text>
          </View>

          {/* Progresso circular */}
          <View style={styles.progressSection}>
            <CircularProgress percentage={project.progressPercent} />
          </View>

          {/* Fase actual */}
          <View style={styles.phaseBadge}>
            <Ionicons name={phaseIcon} size={16} color={COLORS.accent} />
            <Text style={styles.phaseText}>{project.currentPhase}</Text>
            <View style={styles.phaseStatusDot} />
            <Text style={styles.phaseStatusText}>Em curso</Text>
          </View>

          <View style={styles.divider} />

          {/* Detalhes */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Entrega prevista</Text>
                <Text style={styles.detailValue}>{formatDate(project.estimatedEndDate)}</Text>
              </View>
            </View>

            {lastUpdate && (
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>Última actualização</Text>
                  <Text style={styles.detailValue}>{timeAgo(lastUpdate)}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Acesso rápido à câmera */}
        {project.cameraOnline && (
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => navigation.navigate('LiveCamera')}
            activeOpacity={0.85}
          >
            <View style={styles.liveDot} />
            <Text style={styles.cameraButtonText}>VER CÂMERA AO VIVO</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Acesso rápido ao contacto */}
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => navigation.navigate('Contact')}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={20} color={COLORS.success} />
          <Text style={styles.contactButtonText}>Falar com a Redome</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  noProjectText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 16,
  },
  noProjectSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  headerBtn: {
    marginRight: 12,
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  greeting: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  greetingText: {
    fontSize: 22,
    color: COLORS.text,
    fontWeight: '400',
  },
  greetingName: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  greetingDate: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(232, 160, 32, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 6,
  },
  phaseText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  phaseStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  phaseStatusText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },
  detailsRow: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  cameraButtonText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contactButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contactButtonText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
