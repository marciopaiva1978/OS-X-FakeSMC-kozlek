import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/client/DashboardScreen';
import { TimelineScreen } from '../screens/client/TimelineScreen';
import { LiveCameraScreen } from '../screens/client/LiveCameraScreen';
import { DocumentsScreen } from '../screens/client/DocumentsScreen';
import { NotificationsScreen } from '../screens/client/NotificationsScreen';
import { COLORS } from '../constants/colors';
import { ClientTabsParamList } from '../types';

const Tab = createBottomTabNavigator<ClientTabsParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof ClientTabsParamList, [IoniconName, IoniconName]> = {
  Dashboard: ['home', 'home-outline'],
  Timeline: ['construct', 'construct-outline'],
  LiveCamera: ['videocam', 'videocam-outline'],
  Documents: ['document-text', 'document-text-outline'],
  Notifications: ['notifications', 'notifications-outline'],
};

export const ClientTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name as keyof ClientTabsParamList];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.pending,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          elevation: 8,
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 17 },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Início', headerTitle: 'Redome' }}
      />
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{ title: 'Obra', headerTitle: 'Linha do Tempo' }}
      />
      <Tab.Screen
        name="LiveCamera"
        component={LiveCameraScreen}
        options={{ title: 'Câmera', headerTitle: 'Câmera ao Vivo' }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: 'Documentos', headerTitle: 'Documentos' }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notificações', headerTitle: 'Notificações' }}
      />
    </Tab.Navigator>
  );
};
