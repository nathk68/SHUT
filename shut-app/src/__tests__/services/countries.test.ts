/**
 * TDD — Tests écrits AVANT l'implémentation de src/services/_mock-data/countries.ts
 * Ces tests définissent le contrat attendu des données pays/villes/DJs.
 */

import {
  COUNTRIES,
  CITIES,
  DJ_PROFILES,
  getCitiesForCountry,
  getDJsForCity,
  searchDJs,
  type Country,
  type City,
  type DJProfile,
  type MusicGenre,
} from '../../services/_mock-data/countries';

describe('countries mock data', () => {
  // ─── COUNTRIES ───────────────────────────────────────────────────────────

  describe('COUNTRIES', () => {
    it('contient au moins un pays', () => {
      expect(COUNTRIES.length).toBeGreaterThan(0);
    });

    it('chaque pays a les champs requis', () => {
      COUNTRIES.forEach((country: Country) => {
        expect(typeof country.code).toBe('string');
        expect(country.code.length).toBeGreaterThan(0);
        expect(typeof country.name).toBe('string');
        expect(country.name.length).toBeGreaterThan(0);
        expect(typeof country.flag).toBe('string');
      });
    });

    it('les codes pays sont uniques', () => {
      const codes = COUNTRIES.map((c) => c.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('contient la Suisse (pays partenaire de lancement)', () => {
      const ch = COUNTRIES.find((c) => c.code === 'CH');
      expect(ch).toBeDefined();
      expect(ch?.name).toBe('Suisse');
    });
  });

  // ─── CITIES ──────────────────────────────────────────────────────────────

  describe('CITIES', () => {
    it('contient au moins une ville', () => {
      expect(CITIES.length).toBeGreaterThan(0);
    });

    it('chaque ville a les champs requis', () => {
      CITIES.forEach((city: City) => {
        expect(typeof city.id).toBe('string');
        expect(city.id.length).toBeGreaterThan(0);
        expect(typeof city.name).toBe('string');
        expect(typeof city.countryCode).toBe('string');
      });
    });

    it('chaque ville référence un pays valide', () => {
      const countryCodes = new Set(COUNTRIES.map((c) => c.code));
      CITIES.forEach((city) => {
        expect(countryCodes.has(city.countryCode)).toBe(true);
      });
    });

    it('les IDs de villes sont uniques', () => {
      const ids = CITIES.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  // ─── DJ_PROFILES ─────────────────────────────────────────────────────────

  describe('DJ_PROFILES', () => {
    it('contient au moins un DJ', () => {
      expect(DJ_PROFILES.length).toBeGreaterThan(0);
    });

    it('chaque DJ a les champs requis', () => {
      DJ_PROFILES.forEach((dj: DJProfile) => {
        expect(typeof dj.id).toBe('string');
        expect(typeof dj.name).toBe('string');
        expect(dj.name.length).toBeGreaterThan(0);
        expect(typeof dj.cityId).toBe('string');
        expect(typeof dj.countryCode).toBe('string');
        expect(typeof dj.genre).toBe('string');
      });
    });

    it('chaque DJ référence une ville valide', () => {
      const cityIds = new Set(CITIES.map((c) => c.id));
      DJ_PROFILES.forEach((dj) => {
        expect(cityIds.has(dj.cityId)).toBe(true);
      });
    });

    it('chaque DJ référence un pays valide', () => {
      const countryCodes = new Set(COUNTRIES.map((c) => c.code));
      DJ_PROFILES.forEach((dj) => {
        expect(countryCodes.has(dj.countryCode)).toBe(true);
      });
    });

    it('les genres sont parmi les valeurs attendues', () => {
      const validGenres: MusicGenre[] = ['Techno', 'House', 'Progressive', 'Minimal', 'Other'];
      DJ_PROFILES.forEach((dj) => {
        expect(validGenres).toContain(dj.genre);
      });
    });
  });

  // ─── getCitiesForCountry ──────────────────────────────────────────────────

  describe('getCitiesForCountry', () => {
    it('retourne uniquement les villes du pays donné', () => {
      const ch = COUNTRIES.find((c) => c.code === 'CH');
      if (!ch) return;
      const cities = getCitiesForCountry(ch.code);
      expect(cities.length).toBeGreaterThan(0);
      cities.forEach((city) => {
        expect(city.countryCode).toBe(ch.code);
      });
    });

    it('retourne un tableau vide pour un code inconnu', () => {
      const cities = getCitiesForCountry('XX');
      expect(cities).toEqual([]);
    });
  });

  // ─── getDJsForCity ────────────────────────────────────────────────────────

  describe('getDJsForCity', () => {
    it('retourne uniquement les DJs de la ville donnée', () => {
      const city = CITIES[0];
      const djs = getDJsForCity(city.id);
      djs.forEach((dj) => {
        expect(dj.cityId).toBe(city.id);
      });
    });

    it('retourne un tableau vide pour un ID inconnu', () => {
      const djs = getDJsForCity('city-inexistante');
      expect(djs).toEqual([]);
    });
  });

  // ─── searchDJs ────────────────────────────────────────────────────────────

  describe('searchDJs', () => {
    it('retourne tous les DJs quand la recherche est vide', () => {
      const result = searchDJs('');
      expect(result.length).toBe(DJ_PROFILES.length);
    });

    it('filtre les DJs par nom (insensible à la casse)', () => {
      const firstName = DJ_PROFILES[0].name.split(' ')[0].toLowerCase();
      const result = searchDJs(firstName);
      expect(result.length).toBeGreaterThan(0);
      result.forEach((dj) => {
        expect(dj.name.toLowerCase()).toContain(firstName);
      });
    });

    it('retourne un tableau vide si aucun DJ ne correspond', () => {
      const result = searchDJs('zzzinexistantzzzz');
      expect(result).toEqual([]);
    });
  });
});
