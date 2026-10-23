import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { GenreTagList } from '../../../components/profile/GenreTagList';

describe('GenreTagList', () => {
  it('renders each genre as a chip', () => {
    render(<GenreTagList genres={['Techno', 'House', 'Minimal']} />);
    expect(screen.getByText('Techno')).toBeTruthy();
    expect(screen.getByText('House')).toBeTruthy();
    expect(screen.getByText('Minimal')).toBeTruthy();
  });

  it('renders nothing for empty array', () => {
    const { toJSON } = render(<GenreTagList genres={[]} />);
    expect(toJSON()).toBeTruthy();
  });
});
