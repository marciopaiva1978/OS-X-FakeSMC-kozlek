import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../../config/firebase';
import { COLORS } from '../../constants/colors';
import { Project, AdminStackParamList } from '../../types';

type Props = NativeStackScreenProps<AdminStackParamList, 'ProjectDetail'>;

export const ProjectDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'projects', projectId), (snap) => {
      if (snap.exists()) setProject({ id: snap.id, ...snap.data() } as Project);
      setLoading(false);
    });
    return unsub;
  }, [projectId]);

  if (loading || !project) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const actions: { label: string; icon: string; screen: keyof AdminStackParamList; params?: object }[] = [
    { label: 'Actualizar Progresso', icon: 'trending-up-outline', screen: 'UpdateProgress', params: { projectId } },
    { label: 'Adicionar Fotos/Vídeos', icon: 'images-outline', screen: 'UploadMedia', params: { projectId } },
    { label: 'Enviar Notificação', icon: 'notifications-outline', screen: 'SendNotification', params: { projectId, clientId: project.clientId, clientName: project.clientName } },
    { label: 'Gerir Documentos', icon: 'document-text-outline', screen: 'ManageDocuments', params: { projectId } },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.clientName}>{project.clientName}</Text>
        <Text style={styles.address}>{project.address}</Text>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${project.progressPercent}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{project.progressPercent}%</Text>
        </View>
        <Text style={styles.phaseBadge}>{project.currentPhase}</Text>
        <Text style={styles.dateLabel}>
          Entrega prevista: {project.estimatedEndDate.toDate().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {actions.map((action) => (
        <TouchableOpacity
          key={action.label}
          style={styles.actionBtn}
          onPress={() => navigation.navigate(action.screen as never, action.params as never)}
          activeOpacity={0.8}
        >
          <Ionicons name={action.icon as React.ComponentProps<typeof Ionicons>['name']} size={22} color={COLORS.primary} />
          <Text style={styles.actionLabel}>{action.label}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.pending} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  infoCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  clientName: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  address: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 14 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },
  progressLabel: { fontSize: 15, fontWeight: '700', color: COLORS.accent },
  phaseBadge: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  dateLabel: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, gap: 14, borderWidth: 1, borderColor: COLORS.border },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: COLORS.text },
});
