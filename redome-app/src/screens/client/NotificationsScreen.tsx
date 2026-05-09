import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  writeBatch,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS } from '../../constants/colors';
import { AppNotification } from '../../types';

function timeAgo(ms: number): string {
  const diff = Math.floor((Date.now() - ms) / 1000);
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

export const NotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'notifications'),
      where('clientId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification)));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, 'notifications', n.id), { read: true }));
    await batch.commit();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notifications.length > 0 && notifications.some((n) => !n.read) && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
          <Text style={styles.markAllText}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={52} color={COLORS.pending} />
            <Text style={styles.emptyText}>Sem notificações</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => markAsRead(item.id)}
            activeOpacity={0.8}
          >
            <View style={[styles.dot, item.read ? styles.dotRead : styles.dotUnread]} />
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]}>
                {item.title}
              </Text>
              <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
              <Text style={styles.cardDate}>
                {timeAgo(item.createdAt.toMillis())} •{' '}
                {item.createdAt.toDate().toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  markAllBtn: {
    padding: 14,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  markAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  list: {
    padding: 12,
    paddingBottom: 32,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardUnread: {
    backgroundColor: 'rgba(26,60,94,0.04)',
    borderColor: 'rgba(26,60,94,0.2)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  dotUnread: {
    backgroundColor: COLORS.primary,
  },
  dotRead: {
    backgroundColor: COLORS.border,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardTitleUnread: {
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 11,
    color: COLORS.pending,
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
