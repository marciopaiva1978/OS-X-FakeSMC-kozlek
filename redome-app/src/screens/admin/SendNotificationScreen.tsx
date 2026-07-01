import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../../config/firebase';
import { COLORS } from '../../constants/colors';
import { AdminStackParamList } from '../../types';

type Props = NativeStackScreenProps<AdminStackParamList, 'SendNotification'>;

export const SendNotificationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { projectId, clientId, clientName } = route.params;
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha o título e a mensagem.');
      return;
    }
    setSending(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        projectId,
        clientId,
        title: title.trim(),
        body: body.trim(),
        createdAt: Timestamp.now(),
        read: false,
      });
      Alert.alert('Enviada!', `Notificação enviada a ${clientName}.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.recipientBadge}>
          <Ionicons name="person-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.recipientText}>Para: <Text style={styles.recipientName}>{clientName}</Text></Text>
        </View>

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Nova fase concluída!"
          placeholderTextColor={COLORS.pending}
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />

        <Text style={styles.label}>Mensagem</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Escreva a mensagem para o cliente..."
          placeholderTextColor={COLORS.pending}
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={5}
          maxLength={500}
          textAlignVertical="top"
        />

        {/* Preview */}
        {(title || body) && (
          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <Ionicons name="notifications" size={16} color={COLORS.accent} />
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle}>{title || 'Título'}</Text>
                <Text style={styles.previewBody} numberOfLines={2}>{body || 'Mensagem...'}</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#FFF" />
              <Text style={styles.sendBtnText}>Enviar a {clientName}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  recipientBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(26,60,94,0.08)', borderRadius: 10, padding: 12, gap: 8, marginBottom: 8 },
  recipientText: { fontSize: 14, color: COLORS.textSecondary },
  recipientName: { fontWeight: '700', color: COLORS.primary },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: 15, color: COLORS.text },
  textArea: { height: 120, paddingTop: 12 },
  preview: { marginTop: 12 },
  previewLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  previewCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: COLORS.border },
  previewContent: { flex: 1 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  previewBody: { fontSize: 13, color: COLORS.textSecondary },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.primary, borderRadius: 14, height: 52, marginTop: 16 },
  sendBtnDisabled: { opacity: 0.7 },
  sendBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
