import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../config/theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  noSafeArea?: boolean;
}

export function ScreenContainer({ children, style, edges = ['top'], noSafeArea }: Props) {
  const Container = noSafeArea ? View : SafeAreaView;
  return (
    <Container style={[styles.container, style]} edges={edges}>
      <StatusBar style="light" />
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
