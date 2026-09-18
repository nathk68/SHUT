/**
 * TDD — Tests écrits AVANT l'implémentation de src/components/ui/SearchableDropdown.tsx
 */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { SearchableDropdown } from '../../../components/ui/SearchableDropdown';

const OPTIONS = [
  { id: '1', label: 'Tous les DJs' },
  { id: '2', label: 'Luca R' },
  { id: '3', label: 'Sophie V' },
  { id: '4', label: 'Maceo' },
];

describe('SearchableDropdown', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  // ─── Rendu initial ────────────────────────────────────────────────────────

  it('affiche le label quand aucune valeur sélectionnée', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    expect(screen.getByText('Choisir un DJ')).toBeTruthy();
  });

  it('affiche la valeur sélectionnée si fournie', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        value="2"
        onSelect={mockOnSelect}
      />
    );
    expect(screen.getByText('Luca R')).toBeTruthy();
  });

  it('la liste déroulante est fermée par défaut', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    expect(screen.queryByText('Sophie V')).toBeNull();
  });

  // ─── Ouverture ────────────────────────────────────────────────────────────

  it("s'ouvre au clic et affiche toutes les options", () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    expect(screen.getByText('Luca R')).toBeTruthy();
    expect(screen.getByText('Sophie V')).toBeTruthy();
    expect(screen.getByText('Maceo')).toBeTruthy();
  });

  it('affiche un champ de recherche quand ouvert', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    expect(screen.getByPlaceholderText('Rechercher...')).toBeTruthy();
  });

  // ─── Filtrage ─────────────────────────────────────────────────────────────

  it('filtre les options en fonction du texte saisi', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher...'), 'soph');
    expect(screen.getByText('Sophie V')).toBeTruthy();
    expect(screen.queryByText('Luca R')).toBeNull();
    expect(screen.queryByText('Maceo')).toBeNull();
  });

  it('est insensible à la casse lors du filtrage', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher...'), 'LUCA');
    expect(screen.getByText('Luca R')).toBeTruthy();
  });

  it('affiche un message vide si aucune option ne correspond', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    fireEvent.changeText(screen.getByPlaceholderText('Rechercher...'), 'zzz');
    expect(screen.getByText('Aucun résultat')).toBeTruthy();
  });

  // ─── Sélection ────────────────────────────────────────────────────────────

  it('appelle onSelect avec l\'id de l\'option choisie', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    fireEvent.press(screen.getByText('Sophie V'));
    expect(mockOnSelect).toHaveBeenCalledWith('3');
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('ferme la liste après la sélection', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    fireEvent.press(screen.getByText('Maceo'));
    expect(screen.queryByPlaceholderText('Rechercher...')).toBeNull();
  });

  it('affiche le label de l\'option sélectionnée après la sélection', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    fireEvent.press(screen.getByText('Maceo'));
    expect(screen.getByText('Maceo')).toBeTruthy();
  });

  // ─── Props optionnelles ───────────────────────────────────────────────────

  it('est désactivable via la prop disabled', () => {
    render(
      <SearchableDropdown
        options={OPTIONS}
        label="Choisir un DJ"
        onSelect={mockOnSelect}
        disabled
      />
    );
    fireEvent.press(screen.getByText('Choisir un DJ'));
    expect(screen.queryByPlaceholderText('Rechercher...')).toBeNull();
    expect(mockOnSelect).not.toHaveBeenCalled();
  });
});
