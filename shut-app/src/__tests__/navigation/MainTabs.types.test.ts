import type { ParametresStackParamList, LiveStackParamList } from '../../navigation/MainTabs';

describe('Navigation param list types', () => {
  it('ParametresStackParamList has EditProfile', () => {
    const _: keyof ParametresStackParamList = 'EditProfile';
    expect(_).toBe('EditProfile');
  });

  it('ParametresStackParamList has PublicProfile with userId', () => {
    const params: ParametresStackParamList['PublicProfile'] = { userId: 'user-1' };
    expect(params.userId).toBe('user-1');
  });

  it('LiveStackParamList has PublicProfile with userId', () => {
    const params: LiveStackParamList['PublicProfile'] = { userId: 'user-2' };
    expect(params.userId).toBe('user-2');
  });
});
