import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import { COLORS } from '../../constants/colors';
import { Project } from '../../types';

const REDOME_EMAIL = 'geral@redome.pt';
const REDOME_PHONE = '+351 210 000 000';

export const ContactScreen: React.FC = () => {
  const { user } = useAuth();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.projectId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, 'projects', user.projectId)).then((snap) => {
      if (snap.exists()) {
        const project = snap.data() as Project;
        setWhatsappNumber(project.whatsappNumber ?? '');
      }
      setLoading(false);
    });
  }, [user]);

  const openWhatsApp = () => {
    const number = whatsappNumber.replace(/\D/g, '');
    const url = `https://wa.me/${number}?text=${encodeURIComponent('Olá, tenho uma questão sobre a minha obra.')}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('WhatsApp não disponível', 'Instale o WhatsApp ou ligue-nos directamente.');
      }
    });
  };

  const openEmail = () => {
    Linking.openURL(`mailto:${REDOME_EMAIL}?subject=Questão sobre a minha obra`);
  };

  const openPhone = () => {
    Linking.openURL(`tel:${REDOME_PHONE.replace(/\s/g, '')}`);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.heroCard}>
          <Ionicons name="headset-outline" size={48} color={COLORS.primary} />
          <Text style={styles.heroTitle}>Estamos aqui para si</Text>
          <Text style={styles.heroBody}>
            Tem alguma questão sobre a sua obra?{'\n'}
            Entre em contacto connosco.
          </Text>
        </View>

        {/* WhatsApp — principal */}
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={openWhatsApp}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
          <View style={styles.btnText}>
            <Text style={styles.btnLabel}>Falar com a Redome</Text>
            <Text style={styles.btnSub}>Resposta rápida via WhatsApp</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Contactos secundários */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={openPhone}>
            <Ionicons name="call-outline" size={22} color={COLORS.primary} />
            <Text style={styles.secondaryLabel}>Telefone</Text>
            <Text style={styles.secondaryValue}>{REDOME_PHONE}</Text>
          </TouchableOpacity>

          <View style={styles.secondaryDivider} />

          <TouchableOpacity style={styles.secondaryBtn} onPress={openEmail}>
            <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
            <Text style={styles.secondaryLabel}>E-mail</Text>
            <Text style={styles.secondaryValue}>{REDOME_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.schedule}>
          Horário de atendimento: Seg–Sex  9h–18h
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: 16,
    gap: 14,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  heroBody: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    flex: 1,
  },
  btnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  secondaryRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  secondaryBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  secondaryDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  secondaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  schedule: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
