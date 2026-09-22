import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { colors } from '../config/theme';
import { getStoredData } from '../utils/storage';

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
  const [hasSeenSplash, setHasSeenSplash] = useState<boolean | null>(null);

  useEffect(() => {
    getStoredData<boolean>('@shut_has_seen_splash').then(v => setHasSeenSplash(!!v));
  }, []);

  if (isLoading || hasSeenSplash === null) {
    return <LoadingSpinner message="Chargement..." />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated || isGuest ? (
        <FavoritesProvider>
          <MainTabs />
        </FavoritesProvider>
      ) : (
        // Comportement officiel
        //<AuthStack initialRouteName={hasSeenSplash ? 'Login' : 'SplashLanding'} />

        // Comportement modifié pour forcer l'affichage de SplashLanding
        <AuthStack initialRouteName="SplashLanding" />
      )}
    </NavigationContainer>
  );
}
