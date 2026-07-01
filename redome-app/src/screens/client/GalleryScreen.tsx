import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS } from '../../constants/colors';
import { PhotoObject, ClientStackParamList } from '../../types';

type Props = NativeStackScreenProps<ClientStackParamList, 'Gallery'>;

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 3;

export const GalleryScreen: React.FC<Props> = ({ route }) => {
  const { phase } = route.params;
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoObject | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');

  return (
    <View style={styles.container}>
      {/* Separador fotos/vídeos */}
      {phase.videos.length > 0 && (
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
            onPress={() => setActiveTab('photos')}
          >
            <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
              Fotografias ({phase.photos.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'videos' && styles.tabActive]}
            onPress={() => setActiveTab('videos')}
          >
            <Text style={[styles.tabText, activeTab === 'videos' && styles.tabTextActive]}>
              Vídeos ({phase.videos.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'photos' && (
        <>
          {phase.photos.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={52} color={COLORS.pending} />
              <Text style={styles.emptyText}>Sem fotografias nesta fase</Text>
            </View>
          ) : (
            <FlatList
              data={phase.photos}
              numColumns={3}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={styles.grid}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => setSelectedPhoto(item)} activeOpacity={0.85}>
                  <Image
                    source={{ uri: item.url }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {activeTab === 'videos' && (
        <View style={styles.empty}>
          <Ionicons name="videocam-outline" size={52} color={COLORS.pending} />
          <Text style={styles.emptyText}>Reprodução de vídeo disponível em breve</Text>
        </View>
      )}

      {/* Modal de foto em ecrã completo */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
              {selectedPhoto.caption ? (
                <View style={styles.captionContainer}>
                  <Text style={styles.captionText}>{selectedPhoto.caption}</Text>
                  <Text style={styles.captionDate}>
                    {selectedPhoto.uploadedAt.toDate().toLocaleDateString('pt-PT')}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  grid: {
    padding: 16,
    gap: 4,
  },
  thumbnail: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    margin: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    padding: 8,
  },
  fullImage: {
    flex: 1,
    width: '100%',
  },
  captionContainer: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  captionText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  captionDate: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
  },
});
