import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, fontSize } from '../config/theme';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { ShutDiffusionScreen } from '../screens/ShutDiffusionScreen';
import { LivesScreen } from '../screens/LivesScreen';
import { GoLiveScreen } from '../screens/GoLiveScreen';
import { LiveClubScreen } from '../screens/LiveClubScreen';
import { LivePlayerScreen } from '../screens/viewer/LivePlayerScreen';
import { AudioCheckScreen } from '../screens/broadcaster/AudioCheckScreen';
import { QuickStreamScreen } from '../screens/broadcaster/QuickStreamScreen';
import { LiveControlScreen } from '../screens/broadcaster/LiveControlScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/viewer/ProfileScreen';

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

// ─── Placeholder screens ──────────────────────────────────────────────────────

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={placeholder.container}>
      <Text style={placeholder.text}>{title}</Text>
    </View>
  );
}

const placeholder = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: colors.textPrimary,
    fontFamily: fonts.heading.bold,
    fontSize: fontSize.lg,
  },
});

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
  const { isAuthenticated } = useAuth();
  const { currentRole } = useRole();
  const isDJ = isAuthenticated && currentRole === 'broadcaster';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'globe-outline';
          if (route.name === 'ShutDiffusion') iconName = 'globe-outline';
          else if (route.name === 'Live') iconName = 'videocam-outline';
          else if (route.name === 'GoLive') iconName = 'radio-outline';
          else if (route.name === 'LiveClub') iconName = 'lock-closed-outline';
          else if (route.name === 'Parametres') iconName = 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="ShutDiffusion"
        component={ShutDiffusionScreen}
        options={{ tabBarLabel: 'Diffusion' }}
      />
      <Tab.Screen
        name="Live"
        component={LiveStackScreen}
        options={{ tabBarLabel: 'Live' }}
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
        component={LiveClubScreen}
        options={{ tabBarLabel: 'Live Club' }}
      />
      <Tab.Screen
        name="Parametres"
        component={ParametresStackScreen}
        options={{ tabBarLabel: 'Paramètres' }}
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
