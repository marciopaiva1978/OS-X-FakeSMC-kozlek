import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { db } from '../../config/firebase';
import { COLORS } from '../../constants/colors';
import { AdminStackParamList, Phase } from '../../types';

type Props = NativeStackScreenProps<AdminStackParamList, 'NewProject'>;

const DEFAULT_PHASES: Omit<Phase, 'id'>[] = [
  { name: 'Projecto e Licenciamento', status: 'pending', completedAt: null, photos: [], videos: [] },
  { name: 'Preparação do Terreno', status: 'pending', completedAt: null, photos: [], videos: [] },
  { name: 'Fundações', status: 'pending', completedAt: null, photos: [], videos: [] },
  { name: 'Estrutura', status: 'pending', completedAt: null, photos: [], videos: [] },
  { name: 'Alvenaria e Cobertura', status: 'pending', completedAt: null, photos: [], videos: [] },
  { name: 'Instalações (água, electricidade, gás)', status: 'pending', completedAt: null, photos: [], videos: [] },
  { name: 'Revestimentos e Acabamentos', status: 'pending', completedAt: null, photos: [], videos: [] },
  { name: 'Arranjos Exteriores', status: 'pending', completedAt: null, photos: [], videos: [] },
  { name: 'Vistoria e Entrega', status: 'pending', completedAt: null, photos: [], videos: [] },
];

export const NewProjectScreen: React.FC<Props> = ({ navigation }) => {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [estimatedEnd, setEstimatedEnd] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!clientName.trim() || !address.trim() || !clientEmail.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha nome do cliente, e-mail e morada.');
      return;
    }
    setSaving(true);
    try {
      const phases = DEFAULT_PHASES.map((p, i) => ({ ...p, id: `phase_${i + 1}` }));
      const projectRef = await addDoc(collection(db, 'projects'), {
        clientId: '',
        clientName: clientName.trim(),
        address: address.trim(),
        startDate: Timestamp.now(),
        estimatedEndDate: estimatedEnd
          ? Timestamp.fromDate(new Date(estimatedEnd))
          : Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        currentPhase: phases[0].name,
        progressPercent: 0,
        whatsappNumber: whatsapp.trim(),
        cameraStreamUrl: '',
        cameraOnline: false,
        phases,
      });
      Alert.alert(
        'Obra criada!',
        `Projecto criado com sucesso.\nID: ${projectRef.id}\n\nLembre-se de criar a conta Firebase Authentication para o cliente e actualizar o clientId.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a obra.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {[
          { label: 'Nome do cliente', value: clientName, set: setClientName, placeholder: 'João Silva', type: 'default' },
          { label: 'E-mail do cliente', value: clientEmail, set: setClientEmail, placeholder: 'joao@email.com', type: 'email-address' },
          { label: 'Morada da obra', value: address, set: setAddress, placeholder: 'Rua das Flores, 12, Lisboa', type: 'default' },
          { label: 'WhatsApp Redome (para o cliente)', value: whatsapp, set: setWhatsapp, placeholder: '+351912345678', type: 'phone-pad' },
          { label: 'Data estimada de entrega (AAAA-MM-DD)', value: estimatedEnd, set: setEstimatedEnd, placeholder: '2027-06-30', type: 'default' },
        ].map(({ label, value, set, placeholder, type }) => (
          <View key={label}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={set}
              placeholder={placeholder}
              placeholderTextColor={COLORS.pending}
              keyboardType={type as never}
              autoCapitalize={type === 'email-address' ? 'none' : 'words'}
            />
          </View>
        ))}

        <View style={styles.phasesInfo}>
          <Text style={styles.phasesInfoText}>9 fases padrão serão criadas automaticamente</Text>
        </View>

        <TouchableOpacity style={[styles.createBtn, saving && styles.createBtnDisabled]} onPress={handleCreate} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.createBtnText}>Criar Obra</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 4, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, padding: 14, fontSize: 15, color: COLORS.text },
  phasesInfo: { backgroundColor: 'rgba(26,60,94,0.06)', borderRadius: 10, padding: 12, marginTop: 16 },
  phasesInfoText: { fontSize: 13, color: COLORS.primary, textAlign: 'center' },
  createBtn: { backgroundColor: COLORS.accent, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 4 },
  createBtnDisabled: { opacity: 0.7 },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
