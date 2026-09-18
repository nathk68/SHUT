// Type definitions used by broadcaster screens (StreamSetupScreen, LiveControlScreen, etc.)

export type PlanningStackParamList = {
  PlanningMain: undefined;
  StreamSetup: { eventId: string };
};

export type DashboardStackParamList = {
  DashboardMain: undefined;
  LiveControl: { eventId: string };
};
