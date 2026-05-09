import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../../config/firebase';
import { COLORS } from '../../constants/colors';
import { Project, Phase, AdminStackParamList } from '../../types';
import { Timestamp } from 'firebase/firestore';

type Props = NativeStackScreenProps<AdminStackParamList, 'UpdateProgress'>;

export const UpdateProgressScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [progressInput, setProgressInput] = useState('');

  useEffect(() => {
    getDoc(doc(db, 'projects', projectId)).then((snap) => {
      if (snap.exists()) {
        const p = { id: snap.id, ...snap.data() } as Project;
        setProject(p);
        setSelectedPhaseId(p.phases.find((ph) => ph.status === 'in_progress')?.id ?? p.phases[0]?.id ?? '');
        setProgressInput(String(p.progressPercent));
      }
      setLoading(false);
    });
  }, [projectId]);

  const handleSave = async () => {
    if (!project) return;
    const pct = parseInt(progressInput, 10);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('Valor inválido', 'A percentagem deve estar entre 0 e 100.');
      return;
    }
    setSaving(true);
    try {
      const updatedPhases = project.phases.map((ph) => {
        if (ph.id === selectedPhaseId) {
          return { ...ph, status: 'in_progress' as const };
        }
        const idx = project.phases.findIndex((p) => p.id === selectedPhaseId);
        const phIdx = project.phases.findIndex((p) => p.id === ph.id);
        if (phIdx < idx) {
          return { ...ph, status: 'completed' as const, completedAt: ph.completedAt ?? Timestamp.now() };
        }
        return { ...ph, status: 'pending' as const };
      });
      const selectedPhase = project.phases.find((ph) => ph.id === selectedPhaseId);
      await updateDoc(doc(db, 'projects', projectId), {
        currentPhase: selectedPhase?.name ?? project.currentPhase,
        progressPercent: pct,
        phases: updatedPhases,
      });
      Alert.alert('Guardado', 'Progresso actualizado com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível guardar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !project) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>Fase actual</Text>
      {project.phases.map((phase) => (
        <TouchableOpacity
          key={phase.id}
          style={[styles.phaseOption, selectedPhaseId === phase.id && styles.phaseOptionSelected]}
          onPress={() => setSelectedPhaseId(phase.id)}
        >
          <Ionicons
            name={selectedPhaseId === phase.id ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={selectedPhaseId === phase.id ? COLORS.primary : COLORS.pending}
          />
          <Text style={[styles.phaseOptionText, selectedPhaseId === phase.id && styles.phaseOptionTextSelected]}>
            {phase.name}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionLabel}>Percentagem concluída</Text>
      <View style={styles.percentRow}>
        <TextInput
          style={styles.percentInput}
          value={progressInput}
          onChangeText={setProgressInput}
          keyboardType="number-pad"
          maxLength={3}
        />
        <Text style={styles.percentSymbol}>%</Text>
      </View>
      <View style={styles.sliderTrack}>
        <View style={[styles.sliderFill, { width: `${Math.min(parseInt(progressInput) || 0, 100)}%` }]} />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  phaseOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  phaseOptionSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(26,60,94,0.05)' },
  phaseOptionText: { fontSize: 14, color: COLORS.textSecondary },
  phaseOptionTextSelected: { color: COLORS.text, fontWeight: '600' },
  percentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  percentInput: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: 28, fontWeight: '700', color: COLORS.primary, width: 100, textAlign: 'center' },
  percentSymbol: { fontSize: 28, fontWeight: '700', color: COLORS.primary },
  sliderTrack: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', marginTop: 12, marginBottom: 24 },
  sliderFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },
  saveBtn: { backgroundColor: COLORS.accent, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
