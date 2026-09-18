import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { colors } from '../config/theme';

const navTheme = {
  dark: true,
  colors: {
    primary: colors.accentLight,
    background: colors.background,
    card: colors.backgroundElevated,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.live,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
    heavy: { fontFamily: 'System', fontWeight: '900' as const },
  },
};

export function RootNavigator() {
  const { isAuthenticated, isLoading, isGuest } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated || isGuest ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
