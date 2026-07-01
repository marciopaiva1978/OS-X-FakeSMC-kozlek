import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db, storage } from '../../config/firebase';
import { COLORS } from '../../constants/colors';
import { Project, Phase, AdminStackParamList } from '../../types';

type Props = NativeStackScreenProps<AdminStackParamList, 'UploadMedia'>;

interface PendingPhoto {
  uri: string;
  caption: string;
}

export const UploadMediaScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId, phaseId } = route.params;
  const [project, setProject] = useState<Project | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState(phaseId ?? '');
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'projects', projectId)).then((snap) => {
      if (snap.exists()) {
        const p = { id: snap.id, ...snap.data() } as Project;
        setProject(p);
        if (!selectedPhaseId) {
          setSelectedPhaseId(p.phases.find((ph) => ph.status === 'in_progress')?.id ?? p.phases[0]?.id ?? '');
        }
      }
      setLoading(false);
    });
  }, [projectId]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      setPhotos((prev) => [
        ...prev,
        ...result.assets.map((a) => ({ uri: a.uri, caption: '' })),
      ]);
    }
  };

  const handlePublish = async () => {
    if (!photos.length) { Alert.alert('Aviso', 'Seleccione pelo menos uma fotografia.'); return; }
    if (!selectedPhaseId) { Alert.alert('Aviso', 'Seleccione uma fase.'); return; }
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        photos.map(async (photo, i) => {
          const blob = await (await fetch(photo.uri)).blob();
          const storageRef = ref(storage, `projects/${projectId}/photos/${Date.now()}_${i}.jpg`);
          await uploadBytesResumable(storageRef, blob);
          const url = await getDownloadURL(storageRef);
          return { url, caption: photo.caption, uploadedAt: Timestamp.now() };
        })
      );
      const projectSnap = await getDoc(doc(db, 'projects', projectId));
      if (projectSnap.exists()) {
        const p = projectSnap.data() as Project;
        const updatedPhases = p.phases.map((ph) => {
          if (ph.id !== selectedPhaseId) return ph;
          return { ...ph, photos: [...ph.photos, ...uploaded] };
        });
        await updateDoc(doc(db, 'projects', projectId), { phases: updatedPhases });
      }
      Alert.alert('Publicado!', `${photos.length} foto(s) adicionada(s).`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Falha no upload. Verifique a ligação.');
    } finally {
      setUploading(false);
    }
  };

  if (loading || !project) return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Fase</Text>
      {project.phases.filter((ph) => ph.status !== 'pending').map((phase) => (
        <TouchableOpacity key={phase.id} style={[styles.phaseOption, selectedPhaseId === phase.id && styles.phaseSelected]} onPress={() => setSelectedPhaseId(phase.id)}>
          <Ionicons name={selectedPhaseId === phase.id ? 'radio-button-on' : 'radio-button-off'} size={18} color={selectedPhaseId === phase.id ? COLORS.primary : COLORS.pending} />
          <Text style={[styles.phaseText, selectedPhaseId === phase.id && styles.phaseTextSelected]}>{phase.name}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.pickBtn} onPress={pickImages}>
        <Ionicons name="images-outline" size={22} color={COLORS.primary} />
        <Text style={styles.pickBtnText}>Seleccionar fotografias</Text>
      </TouchableOpacity>

      {photos.length > 0 && (
        <View style={styles.previewGrid}>
          {photos.map((photo, i) => (
            <View key={i} style={styles.previewItem}>
              <Image source={{ uri: photo.uri }} style={styles.previewImg} />
              <TextInput
                style={styles.captionInput}
                placeholder="Legenda..."
                placeholderTextColor={COLORS.pending}
                value={photo.caption}
                onChangeText={(t) => setPhotos((prev) => prev.map((p, j) => j === i ? { ...p, caption: t } : p))}
              />
              <TouchableOpacity style={styles.removeBtn} onPress={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}>
                <Ionicons name="close-circle" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={[styles.publishBtn, (uploading || !photos.length) && styles.publishBtnDisabled]} onPress={handlePublish} disabled={uploading || !photos.length}>
        {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.publishBtnText}>Publicar ({photos.length})</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  phaseOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  phaseSelected: { borderColor: COLORS.primary, backgroundColor: 'rgba(26,60,94,0.05)' },
  phaseText: { fontSize: 14, color: COLORS.textSecondary },
  phaseTextSelected: { color: COLORS.text, fontWeight: '600' },
  pickBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', padding: 18, marginTop: 8 },
  pickBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  previewGrid: { gap: 10 },
  previewItem: { position: 'relative', backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border },
  previewImg: { width: '100%', height: 160, borderRadius: 12 },
  captionInput: { padding: 10, fontSize: 13, color: COLORS.text },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.surface, borderRadius: 10 },
  publishBtn: { backgroundColor: COLORS.accent, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  publishBtnDisabled: { opacity: 0.5 },
  publishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
