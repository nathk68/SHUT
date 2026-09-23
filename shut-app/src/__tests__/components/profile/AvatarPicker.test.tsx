import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { AvatarPicker } from '../../../components/profile/AvatarPicker';

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

describe('AvatarPicker', () => {
  it('renders avatar image when url provided', () => {
    render(<AvatarPicker avatarUrl="https://example.com/avatar.jpg" />);
    expect(screen.getByTestId('avatar-image')).toBeTruthy();
  });

  it('renders placeholder when no url', () => {
    render(<AvatarPicker avatarUrl={null} displayName="DJ Test" />);
    expect(screen.getByTestId('avatar-placeholder')).toBeTruthy();
  });

  it('shows edit overlay when editable=true', () => {
    render(<AvatarPicker avatarUrl={null} displayName="DJ Test" editable />);
    expect(screen.getByTestId('avatar-edit-button')).toBeTruthy();
  });

  it('does not show edit overlay when editable=false', () => {
    render(<AvatarPicker avatarUrl={null} displayName="DJ Test" editable={false} />);
    expect(screen.queryByTestId('avatar-edit-button')).toBeNull();
  });

  it('calls onPick when image selected', async () => {
    const { launchImageLibraryAsync } = require('expo-image-picker');
    launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] });
    const onPick = jest.fn();
    render(<AvatarPicker avatarUrl={null} displayName="DJ Test" editable onPick={onPick} />);
    fireEvent.press(screen.getByTestId('avatar-edit-button'));
    await waitFor(() => expect(onPick).toHaveBeenCalledWith('file:///photo.jpg'));
  });
});
