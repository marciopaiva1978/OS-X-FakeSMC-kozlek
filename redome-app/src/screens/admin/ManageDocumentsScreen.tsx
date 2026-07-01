import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db, storage } from '../../config/firebase';
import { COLORS } from '../../constants/colors';
import { ProjectDocument, AdminStackParamList } from '../../types';

type Props = NativeStackScreenProps<AdminStackParamList, 'ManageDocuments'>;

export const ManageDocumentsScreen: React.FC<Props> = ({ route }) => {
  const { projectId } = route.params;
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'documents'), where('projectId', '==', projectId));
    const unsub = onSnapshot(q, (snap) => {
      setDocuments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectDocument))
        .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis()));
      setLoading(false);
    });
    return unsub;
  }, [projectId]);

  const pickAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const blob = await (await fetch(asset.uri)).blob();
      const storageRef = ref(storage, `projects/${projectId}/documents/${Date.now()}_${asset.name}`);
      await uploadBytesResumable(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'documents'), {
        projectId,
        name: asset.name,
        url,
        uploadedAt: Timestamp.now(),
      });
    } catch {
      Alert.alert('Erro', 'Falha no upload do documento.');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (item: ProjectDocument) => {
    Alert.alert('Remover documento', `Remover "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'documents', item.id));
            const storageRef = ref(storage, item.url);
            await deleteObject(storageRef).catch(() => {});
          } catch {
            Alert.alert('Erro', 'Não foi possível remover.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity style={styles.addBtn} onPress={pickAndUpload} disabled={uploading}>
            {uploading
              ? <ActivityIndicator color={COLORS.primary} />
              : <><Ionicons name="add-circle-outline" size={22} color={COLORS.primary} /><Text style={styles.addBtnText}>Adicionar Documento PDF</Text></>
            }
          </TouchableOpacity>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="document-outline" size={44} color={COLORS.pending} />
              <Text style={styles.emptyText}>Nenhum documento ainda</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.docRow}>
            <Ionicons name="document-text" size={22} color={COLORS.error} />
            <View style={styles.docInfo}>
              <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.docDate}>{item.uploadedAt.toDate().toLocaleDateString('pt-PT')}</Text>
            </View>
            <TouchableOpacity onPress={() => removeDocument(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="trash-outline" size={20} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 14, gap: 8, paddingBottom: 32 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', padding: 16, marginBottom: 8 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  docRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: COLORS.border },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  docDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  empty: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});
