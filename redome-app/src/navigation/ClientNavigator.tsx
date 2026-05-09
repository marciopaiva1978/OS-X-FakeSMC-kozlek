import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClientTabs } from './ClientTabs';
import { GalleryScreen } from '../screens/client/GalleryScreen';
import { ContactScreen } from '../screens/client/ContactScreen';
import { ClientStackParamList } from '../types';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator<ClientStackParamList>();

export const ClientNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackTitle: 'Voltar',
      }}
    >
      <Stack.Screen
        name="ClientTabs"
        component={ClientTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Gallery"
        component={GalleryScreen}
        options={({ route }) => ({ title: route.params.phase.name })}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{ title: 'Contacto' }}
      />
    </Stack.Navigator>
  );
};
