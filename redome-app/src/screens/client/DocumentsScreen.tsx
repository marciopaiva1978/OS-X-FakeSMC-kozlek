import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/colors';
import { ProjectDocument } from '../../types';

export const DocumentsScreen: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.projectId) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, 'documents'),
      where('projectId', '==', user.projectId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ProjectDocument))
        .sort((a, b) => b.uploadedAt.toMillis() - a.uploadedAt.toMillis());
      setDocuments(docs);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const openDocument = async (doc: ProjectDocument) => {
    setDownloading(doc.id);
    try {
      const fileUri = FileSystem.documentDirectory + doc.name;
      const { uri } = await FileSystem.downloadAsync(doc.url, fileUri);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      } else {
        Alert.alert('Aviso', 'Partilha não disponível neste dispositivo.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o documento.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={documents}
      keyExtractor={(item) => item.id}
      style={styles.container}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="document-outline" size={52} color={COLORS.pending} />
          <Text style={styles.emptyText}>Sem documentos disponíveis</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => openDocument(item)}
          activeOpacity={0.8}
        >
          <View style={styles.pdfIcon}>
            <Ionicons name="document-text" size={24} color={COLORS.error} />
            <Text style={styles.pdfLabel}>PDF</Text>
          </View>
          <View style={styles.docInfo}>
            <Text style={styles.docName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.docDate}>
              {item.uploadedAt.toDate().toLocaleDateString('pt-PT', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
          {downloading === item.id ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="download-outline" size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 14,
    paddingBottom: 32,
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pdfIcon: {
    width: 44,
    height: 52,
    backgroundColor: 'rgba(198,40,40,0.08)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.error,
    marginTop: 1,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  docDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  empty: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});
