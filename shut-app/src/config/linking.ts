import type { LinkingOptions } from '@react-navigation/native';

export const DEEP_LINK_DOMAIN = 'https://shutdiffusion.com';

export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ['https://shutdiffusion.com', 'https://www.shutdiffusion.com', 'shut://', 'com.nathk68.shut-app://'],
  config: {
    screens: {
      ShutDiffusion: {
        screens: {
          LivePlayer: 'live/:eventId',
          ReplayPlayer: 'replay/:replayId',
          PublicProfile: 'profile/:userId',
        },
      },
    },
  },
};

export function buildShareUrl(type: 'live' | 'replay' | 'profile', id: string): string {
  return `${DEEP_LINK_DOMAIN}/${type}/${id}`;
}
