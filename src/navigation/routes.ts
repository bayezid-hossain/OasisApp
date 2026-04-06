export const Routes = {
  // Tabs
  Dashboard: 'Dashboard',
  Search: 'Search',
  Recap: 'Recap',

  // Stack modals
  ThoughtDetail: 'ThoughtDetail',
  CaptureOverlay: 'CaptureOverlay',
} as const;

export type RootStackParamList = {
  Tabs: undefined;
  ThoughtDetail: {noteId: string};
  CaptureOverlay: {defaultMode?: 'voice' | 'text'};
};

export type TabParamList = {
  Dashboard: undefined;
  Search: undefined;
  Recap: undefined;
};
