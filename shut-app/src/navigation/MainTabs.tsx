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
import { PhoneCameraScreen } from '../screens/broadcaster/PhoneCameraScreen';
import { LiveControlScreen } from '../screens/broadcaster/LiveControlScreen';
import { PostLiveScreen } from '../screens/broadcaster/PostLiveScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TabAvatar } from '../components/ui/TabAvatar';
import { MaDiscothequeScreen } from '../screens/MaDiscothequeScreen';
import { MesFavorisScreen } from '../screens/MesFavorisScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { PublicProfileScreen } from '../screens/PublicProfileScreen';
import { LanguageScreen } from '../screens/settings/LanguageScreen';
import { QualityScreen } from '../screens/settings/QualityScreen';
import { NotificationsScreen } from '../screens/settings/NotificationsScreen';
import { PrivacyPolicyScreen } from '../screens/legal/PrivacyPolicyScreen';
import { TermsScreen } from '../screens/legal/TermsScreen';
import { RGPDScreen } from '../screens/legal/RGPDScreen';
import { ReplayPlayerScreen } from '../screens/viewer/ReplayPlayerScreen';
import { FollowListScreen } from '../screens/FollowListScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────

export type MainTabParamList = {
  ShutDiffusion: undefined;
  Live: { countryCode?: string } | undefined;
  GoLive: undefined;
  LiveClub: undefined;
  Parametres: undefined;
};

export type ExploreStackParamList = {
  ExploreMain: undefined;
  PublicProfile: { userId: string };
  LivePlayer: { eventId: string };
  ReplayPlayer: { playbackUrl: string; title: string; trimStart?: number; trimEnd?: number; replayId?: string; djUserId?: string; eventId?: string };
  PostLive: { eventId: string };
  FollowList: { userId: string; mode: 'followers' | 'following' };
};

export type LiveStackParamList = {
  LivesMain: { countryCode?: string } | undefined;
  LivePlayer: { eventId: string };
  PublicProfile: { userId: string };
  FollowList: { userId: string; mode: 'followers' | 'following' };
  ReplayPlayer: { playbackUrl: string; title: string; trimStart?: number; trimEnd?: number; replayId?: string; djUserId?: string; eventId?: string };
};

export type GoLiveStackParamList = {
  GoLiveMain: undefined;
  AudioCheck: undefined;
  QuickStream: { cameraId?: string };
  PhoneCamera: { rtmpUrl: string; streamKey: string; eventId?: string; mode?: 'phone' | 'external' };
  LiveControl: { eventId: string };
  PostLive: { eventId: string };
};

export type LiveClubStackParamList = {
  DiscothequeMain: undefined;
  PostLive: { eventId: string };
  ReplayPlayer: { playbackUrl: string; title: string; trimStart?: number; trimEnd?: number; replayId?: string; djUserId?: string; eventId?: string };
  PublicProfile: { userId: string };
  LivePlayer: { eventId: string };
};

export type FavorisStackParamList = {
  FavorisMain: undefined;
  ReplayPlayer: { playbackUrl: string; title: string; trimStart?: number; trimEnd?: number; replayId?: string; djUserId?: string; eventId?: string };
  PublicProfile: { userId: string };
  LivePlayer: { eventId: string };
};

export type ParametresStackParamList = {
  Profile: undefined;
  SettingsMain: undefined;
  EditProfile: undefined;
  PublicProfile: { userId: string };
  ReplayPlayer: { playbackUrl: string; title: string; trimStart?: number; trimEnd?: number; replayId?: string; djUserId?: string; eventId?: string };
  PostLive: { eventId: string };
  FollowList: { userId: string; mode: 'followers' | 'following' };
  Language: undefined;
  Quality: undefined;
  Notifications: undefined;
  PrivacyPolicy: undefined;
  Terms: undefined;
  RGPD: undefined;
};

// ─── Stack navigators ─────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const LiveStack = createNativeStackNavigator<LiveStackParamList>();
const GoLiveStack = createNativeStackNavigator<GoLiveStackParamList>();
const LiveClubStack = createNativeStackNavigator<LiveClubStackParamList>();
const FavorisStack = createNativeStackNavigator<FavorisStackParamList>();
const ParametresStack = createNativeStackNavigator<ParametresStackParamList>();

function ExploreStackScreen() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreMain" component={ShutDiffusionScreen} />
      <ExploreStack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <ExploreStack.Screen
        name="LivePlayer"
        component={LivePlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <ExploreStack.Screen
        name="ReplayPlayer"
        component={ReplayPlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <ExploreStack.Screen
        name="PostLive"
        component={PostLiveScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <ExploreStack.Screen name="FollowList" component={FollowListScreen} />
    </ExploreStack.Navigator>
  );
}

function LiveStackScreen() {
  return (
    <LiveStack.Navigator screenOptions={{ headerShown: false }}>
      <LiveStack.Screen name="LivesMain" component={LivesScreen} />
      <LiveStack.Screen
        name="LivePlayer"
        component={LivePlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <LiveStack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <LiveStack.Screen name="FollowList" component={FollowListScreen} />
      <LiveStack.Screen
        name="ReplayPlayer"
        component={ReplayPlayerScreen}
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
        name="PhoneCamera"
        component={PhoneCameraScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <GoLiveStack.Screen
        name="LiveControl"
        component={LiveControlScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <GoLiveStack.Screen
        name="PostLive"
        component={PostLiveScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </GoLiveStack.Navigator>
  );
}

function LiveClubStackScreen() {
  return (
    <LiveClubStack.Navigator screenOptions={{ headerShown: false }}>
      <LiveClubStack.Screen name="DiscothequeMain" component={MaDiscothequeScreen} />
      <LiveClubStack.Screen
        name="PostLive"
        component={PostLiveScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <LiveClubStack.Screen
        name="ReplayPlayer"
        component={ReplayPlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <LiveClubStack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <LiveClubStack.Screen
        name="LivePlayer"
        component={LivePlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </LiveClubStack.Navigator>
  );
}

function FavorisStackScreen() {
  return (
    <FavorisStack.Navigator screenOptions={{ headerShown: false }}>
      <FavorisStack.Screen name="FavorisMain" component={MesFavorisScreen} />
      <FavorisStack.Screen
        name="ReplayPlayer"
        component={ReplayPlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <FavorisStack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <FavorisStack.Screen
        name="LivePlayer"
        component={LivePlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </FavorisStack.Navigator>
  );
}

function ParametresStackScreen() {
  return (
    <ParametresStack.Navigator screenOptions={{ headerShown: false }}>
      <ParametresStack.Screen name="Profile" component={ProfileScreen} />
      <ParametresStack.Screen name="SettingsMain" component={SettingsScreen} />
      <ParametresStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ParametresStack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <ParametresStack.Screen
        name="ReplayPlayer"
        component={ReplayPlayerScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <ParametresStack.Screen
        name="PostLive"
        component={PostLiveScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
      <ParametresStack.Screen name="Language" component={LanguageScreen} />
      <ParametresStack.Screen name="Quality" component={QualityScreen} />
      <ParametresStack.Screen name="Notifications" component={NotificationsScreen} />
      <ParametresStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <ParametresStack.Screen name="Terms" component={TermsScreen} />
      <ParametresStack.Screen name="RGPD" component={RGPDScreen} />
      <ParametresStack.Screen name="FollowList" component={FollowListScreen} />
    </ParametresStack.Navigator>
  );
}

// ─── Main tabs ────────────────────────────────────────────────────────────────

export function MainTabs() {
  const { isAuthenticated, isGuest, user } = useAuth();
  const { currentRole } = useRole();
  const isDJ = isAuthenticated && currentRole === 'broadcaster';

  const liveClubLabel = isDJ ? 'Mes sets' : 'Mes favoris';
  const LiveClubComponent = isDJ ? LiveClubStackScreen : FavorisStackScreen;

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
        component={ExploreStackScreen}
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
