import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FollowButton } from '../../../components/profile/FollowButton';

describe('FollowButton', () => {
  it('shows "Suivre" when not following', () => {
    render(<FollowButton isFollowing={false} onPress={jest.fn()} />);
    expect(screen.getByText('Suivre')).toBeTruthy();
  });

  it('shows "Suivi" when following', () => {
    render(<FollowButton isFollowing={true} onPress={jest.fn()} />);
    expect(screen.getByText('Suivi')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<FollowButton isFollowing={false} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('follow-button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled while loading', () => {
    const onPress = jest.fn();
    render(<FollowButton isFollowing={false} onPress={onPress} loading />);
    fireEvent.press(screen.getByTestId('follow-button'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
