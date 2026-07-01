import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProjectsListScreen } from '../screens/admin/ProjectsListScreen';
import { ProjectDetailScreen } from '../screens/admin/ProjectDetailScreen';
import { UpdateProgressScreen } from '../screens/admin/UpdateProgressScreen';
import { UploadMediaScreen } from '../screens/admin/UploadMediaScreen';
import { SendNotificationScreen } from '../screens/admin/SendNotificationScreen';
import { ManageDocumentsScreen } from '../screens/admin/ManageDocumentsScreen';
import { NewProjectScreen } from '../screens/admin/NewProjectScreen';
import { COLORS } from '../constants/colors';
import { AdminStackParamList } from '../types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 17 },
        headerBackTitle: 'Voltar',
      }}
    >
      <Stack.Screen
        name="ProjectsList"
        component={ProjectsListScreen}
        options={{ title: 'Redome — Admin' }}
      />
      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: 'Detalhe da Obra' }}
      />
      <Stack.Screen
        name="UpdateProgress"
        component={UpdateProgressScreen}
        options={{ title: 'Actualizar Progresso' }}
      />
      <Stack.Screen
        name="UploadMedia"
        component={UploadMediaScreen}
        options={{ title: 'Adicionar Fotos/Vídeos' }}
      />
      <Stack.Screen
        name="SendNotification"
        component={SendNotificationScreen}
        options={{ title: 'Enviar Notificação' }}
      />
      <Stack.Screen
        name="ManageDocuments"
        component={ManageDocumentsScreen}
        options={{ title: 'Gerir Documentos' }}
      />
      <Stack.Screen
        name="NewProject"
        component={NewProjectScreen}
        options={{ title: 'Nova Obra' }}
      />
    </Stack.Navigator>
  );
};
