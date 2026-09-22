import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { ShutDiffusionScreen } from '../screens/ShutDiffusionScreen';
import { LivesScreen } from '../screens/LivesScreen';
import { GoLiveScreen } from '../screens/GoLiveScreen';
import { LivePlayerScreen } from '../screens/viewer/LivePlayerScreen';
import { AudioCheckScreen } from '../screens/broadcaster/AudioCheckScreen';
import { QuickStreamScreen } from '../screens/broadcaster/QuickStreamScreen';
import { LiveControlScreen } from '../screens/broadcaster/LiveControlScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/viewer/ProfileScreen';
import { TabAvatar } from '../components/ui/TabAvatar';
import { MaDiscothequeScreen } from '../screens/MaDiscothequeScreen';
import { MesFavorisScreen } from '../screens/MesFavorisScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type MainTabParamList = {
  ShutDiffusion: undefined;
  Live: { countryCode?: string } | undefined;
  GoLive: undefined;
  LiveClub: undefined;
  Parametres: undefined;
};

export type LiveStackParamList = {
  LivesMain: { countryCode?: string } | undefined;
  LivePlayer: { eventId: string };
};

export type GoLiveStackParamList = {
  GoLiveMain: undefined;
  AudioCheck: undefined;
  QuickStream: undefined;
  LiveControl: { eventId: string };
};

export type ParametresStackParamList = {
  SettingsMain: undefined;
  Profile: undefined;
};

// ─── Stack navigators ─────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();
const LiveStack = createNativeStackNavigator<LiveStackParamList>();
const GoLiveStack = createNativeStackNavigator<GoLiveStackParamList>();
const ParametresStack = createNativeStackNavigator<ParametresStackParamList>();

function LiveStackScreen() {
  return (
    <LiveStack.Navigator screenOptions={{ headerShown: false }}>
      <LiveStack.Screen name="LivesMain" component={LivesScreen} />
      <LiveStack.Screen
        name="LivePlayer"
        component={LivePlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </LiveStack.Navigator>
  );
}

function GoLiveStackScreen() {
  return (
    <GoLiveStack.Navigator screenOptions={{ headerShown: false }}>
      <GoLiveStack.Screen name="GoLiveMain" component={GoLiveScreen} />
      <GoLiveStack.Screen name="AudioCheck" component={AudioCheckScreen} />
      <GoLiveStack.Screen name="QuickStream" component={QuickStreamScreen} />
      <GoLiveStack.Screen
        name="LiveControl"
        component={LiveControlScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </GoLiveStack.Navigator>
  );
}

function ParametresStackScreen() {
  return (
    <ParametresStack.Navigator screenOptions={{ headerShown: false }}>
      <ParametresStack.Screen name="SettingsMain" component={SettingsScreen} />
      <ParametresStack.Screen name="Profile" component={ProfileScreen} />
    </ParametresStack.Navigator>
  );
}

// ─── Main tabs ────────────────────────────────────────────────────────────────

export function MainTabs() {
  const { isAuthenticated, isGuest, user } = useAuth();
  const { currentRole } = useRole();
  const isDJ = isAuthenticated && currentRole === 'broadcaster';

  const liveClubLabel = isDJ ? 'Ma discothèque' : 'Mes favoris';
  const LiveClubComponent = isDJ ? MaDiscothequeScreen : MesFavorisScreen;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'Parametres') {
            return (
              <TabAvatar
                size={size}
                color={color}
                avatarUrl={user?.avatarUrl ?? null}
                displayName={user?.username || user?.displayName || ''}
                focused={focused}
                isGuest={isGuest}
              />
            );
          }
          let iconName: keyof typeof Ionicons.glyphMap = 'compass-outline';
          if (route.name === 'ShutDiffusion') iconName = 'compass-outline';
          else if (route.name === 'Live') iconName = 'videocam-outline';
          else if (route.name === 'GoLive') iconName = 'radio-outline';
          else if (route.name === 'LiveClub') {
            iconName = isDJ ? 'musical-notes-outline' : 'heart-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ShutDiffusion"
        component={ShutDiffusionScreen}
        options={{ tabBarLabel: 'Explorer' }}
      />
      <Tab.Screen
        name="Live"
        component={LiveStackScreen}
        options={{ tabBarLabel: 'En direct' }}
      />
      {isDJ && (
        <Tab.Screen
          name="GoLive"
          component={GoLiveStackScreen}
          options={{ tabBarLabel: 'DJ Live' }}
        />
      )}
      <Tab.Screen
        name="LiveClub"
        component={LiveClubComponent}
        options={{ tabBarLabel: liveClubLabel }}
      />
      <Tab.Screen
        name="Parametres"
        component={ParametresStackScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundElevated,
    borderTopColor: 'rgba(255,255,255,0.06)',
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: fonts.body.medium,
    fontSize: fontSize.xs,
  },
});
