import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashLandingScreen } from '../screens/SplashLandingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { OnboardingRoleScreen } from '../screens/onboarding/OnboardingRoleScreen';
import { SpectatorOnboardingScreen } from '../screens/onboarding/SpectatorOnboardingScreen';
import { DJOnboardingScreen } from '../screens/onboarding/DJOnboardingScreen';
import { DAOnboardingScreen } from '../screens/onboarding/DAOnboardingScreen';

export type AuthStackParamList = {
  SplashLanding: undefined;
  OnboardingRole: undefined;
  SpectatorOnboarding: undefined;
  DJOnboarding: undefined;
  DAOnboarding: undefined;
  Login: undefined;
  Register: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface Props {
  initialRouteName?: keyof AuthStackParamList;
}

export function AuthStack({ initialRouteName = 'SplashLanding' }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="SplashLanding" component={SplashLandingScreen} />
      <Stack.Screen name="OnboardingRole" component={OnboardingRoleScreen} />
      <Stack.Screen name="SpectatorOnboarding" component={SpectatorOnboardingScreen} />
      <Stack.Screen name="DJOnboarding" component={DJOnboardingScreen} />
      <Stack.Screen name="DAOnboarding" component={DAOnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
