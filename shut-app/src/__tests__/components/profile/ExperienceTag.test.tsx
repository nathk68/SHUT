import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ExperienceTag } from '../../../components/profile/ExperienceTag';

describe('ExperienceTag', () => {
  it('renders debutant label', () => {
    render(<ExperienceTag level="debutant" />);
    expect(screen.getByText('Débutant')).toBeTruthy();
  });

  it('renders confirme label', () => {
    render(<ExperienceTag level="confirme" />);
    expect(screen.getByText('Confirmé')).toBeTruthy();
  });

  it('renders professionnel label', () => {
    render(<ExperienceTag level="professionnel" />);
    expect(screen.getByText('Professionnel')).toBeTruthy();
  });

  it('renders intermediaire label', () => {
    render(<ExperienceTag level="intermediaire" />);
    expect(screen.getByText('Intermédiaire')).toBeTruthy();
  });
});
