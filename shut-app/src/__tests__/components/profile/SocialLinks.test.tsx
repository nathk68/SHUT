import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SocialLinks } from '../../../components/profile/SocialLinks';

describe('SocialLinks', () => {
  it('renders instagram link when provided', () => {
    render(<SocialLinks links={{ instagram: 'djtest' }} />);
    expect(screen.getByTestId('social-instagram')).toBeTruthy();
  });

  it('does not render soundcloud when not provided', () => {
    render(<SocialLinks links={{ instagram: 'djtest' }} />);
    expect(screen.queryByTestId('social-soundcloud')).toBeNull();
  });

  it('renders multiple links', () => {
    render(<SocialLinks links={{ instagram: 'djtest', soundcloud: 'djtest', youtube: 'djtest' }} />);
    expect(screen.getByTestId('social-instagram')).toBeTruthy();
    expect(screen.getByTestId('social-soundcloud')).toBeTruthy();
    expect(screen.getByTestId('social-youtube')).toBeTruthy();
  });
});
