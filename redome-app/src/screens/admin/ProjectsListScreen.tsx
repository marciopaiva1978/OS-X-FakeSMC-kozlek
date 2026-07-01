import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/colors';
import { Project, AdminStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<AdminStackParamList, 'ProjectsList'>;

export const ProjectsListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signOut, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('clientName'));
    const unsub = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = projects.filter(
    (p) =>
      p.clientName.toLowerCase().includes(search.toLowerCase()) ||
      p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={COLORS.pending} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por nome ou morada..."
            placeholderTextColor={COLORS.pending}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={52} color={COLORS.pending} />
              <Text style={styles.emptyText}>Nenhuma obra encontrada</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.clientName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.clientName}>{item.clientName}</Text>
                  <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.pending} />
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${item.progressPercent}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{item.progressPercent}%</Text>
                <Text style={styles.phase}>{item.currentPhase}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewProject')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 10, paddingHorizontal: 12, height: 40, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },
  logoutBtn: { padding: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12, gap: 10, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  cardInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  address: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: COLORS.accent, width: 35, textAlign: 'right' },
  phase: { fontSize: 11, color: COLORS.textSecondary, flex: 1, textAlign: 'right' },
  empty: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
});
