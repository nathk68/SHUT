import {
  COUNTRIES,
  DJ_PROFILES,
  getCitiesForCountry,
  getCitiesForRegion,
  getRegionsForCountry,
  getDJsForCity,
  getDJsForCountry,
  searchDJs,
  type Country,
  type DJProfile,
  type MusicGenre,
} from '../../services/_mock-data/countries';

describe('countries data (country-state-city)', () => {
  describe('COUNTRIES', () => {
    it('contient tous les pays du monde (>200)', () => {
      expect(COUNTRIES.length).toBeGreaterThan(200);
    });

    it('chaque pays a les champs requis', () => {
      COUNTRIES.forEach((c: Country) => {
        expect(typeof c.code).toBe('string');
        expect(c.code.length).toBeGreaterThan(0);
        expect(typeof c.name).toBe('string');
        expect(c.name.length).toBeGreaterThan(0);
      });
    });

    it('codes uniques', () => {
      const codes = COUNTRIES.map((c) => c.code);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('contient les pays clés en français', () => {
      const map = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));
      expect(map['CH']).toBe('Suisse');
      expect(map['FR']).toBe('France');
      expect(map['DE']).toBe('Allemagne');
      expect(map['CA']).toBe('Canada');
      expect(map['US']).toBe('États-Unis');
    });
  });

  describe('getRegionsForCountry', () => {
    it('retourne les régions françaises (>10)', () => {
      const regions = getRegionsForCountry('FR');
      expect(regions.length).toBeGreaterThan(10);
      regions.forEach((r) => expect(r.countryCode).toBe('FR'));
    });

    it('retourne les provinces canadiennes', () => {
      const regions = getRegionsForCountry('CA');
      expect(regions.length).toBeGreaterThan(0);
    });

    it('tableau vide pour un code inconnu', () => {
      expect(getRegionsForCountry('XX')).toEqual([]);
    });
  });

  describe('getCitiesForRegion', () => {
    it('retourne des villes pour Grand Est (FR__GES) dont Nancy', () => {
      const cities = getCitiesForRegion('FR__GES');
      const names = cities.map((c) => c.name);
      expect(names).toContain('Nancy');
      expect(names).toContain('Strasbourg');
    });

    it('retourne des villes pour Ontario (CA__ON) dont Toronto', () => {
      const cities = getCitiesForRegion('CA__ON');
      expect(cities.some((c) => c.name === 'Toronto')).toBe(true);
    });

    it('tableau vide pour un ID inconnu', () => {
      expect(getCitiesForRegion('XX__UNKNOWN')).toEqual([]);
    });
  });

  describe('getCitiesForCountry', () => {
    it('retourne les villes suisses', () => {
      const cities = getCitiesForCountry('CH');
      expect(cities.length).toBeGreaterThan(0);
      cities.forEach((c) => expect(c.countryCode).toBe('CH'));
    });

    it('tableau vide pour un code inconnu', () => {
      expect(getCitiesForCountry('XX')).toEqual([]);
    });
  });

  describe('DJ_PROFILES', () => {
    it('contient au moins un DJ', () => {
      expect(DJ_PROFILES.length).toBeGreaterThan(0);
    });

    it('chaque DJ a les champs requis', () => {
      const validGenres: MusicGenre[] = ['Techno', 'House', 'Progressive', 'Minimal', 'Drum & Bass', 'Trance', 'Other'];
      DJ_PROFILES.forEach((dj: DJProfile) => {
        expect(typeof dj.id).toBe('string');
        expect(typeof dj.name).toBe('string');
        expect(typeof dj.cityName).toBe('string');
        expect(typeof dj.countryCode).toBe('string');
        expect(validGenres).toContain(dj.genre);
      });
    });

    it('chaque DJ référence un pays valide', () => {
      const codes = new Set(COUNTRIES.map((c) => c.code));
      DJ_PROFILES.forEach((dj) => expect(codes.has(dj.countryCode)).toBe(true));
    });
  });

  describe('getDJsForCity', () => {
    it('retourne Rainer K pour Berlin (DE__BE__Berlin)', () => {
      const djs = getDJsForCity('DE__BE__Berlin');
      expect(djs.some((dj) => dj.name === 'Rainer K')).toBe(true);
    });

    it('tableau vide pour un ID inconnu', () => {
      expect(getDJsForCity('XX__XX__Inexistante')).toEqual([]);
    });
  });

  describe('getDJsForCountry', () => {
    it('retourne des DJs français', () => {
      const djs = getDJsForCountry('FR');
      expect(djs.length).toBeGreaterThan(0);
      djs.forEach((dj) => expect(dj.countryCode).toBe('FR'));
    });

    it('tableau vide pour un code inconnu', () => {
      expect(getDJsForCountry('XX')).toEqual([]);
    });
  });

  describe('searchDJs', () => {
    it('retourne tous les DJs si vide', () => {
      expect(searchDJs('').length).toBe(DJ_PROFILES.length);
    });

    it('filtre par nom (insensible à la casse)', () => {
      const result = searchDJs('luca');
      expect(result.length).toBeGreaterThan(0);
      result.forEach((dj) => expect(dj.name.toLowerCase()).toContain('luca'));
    });

    it('tableau vide si aucun match', () => {
      expect(searchDJs('zzzinexistantzzzz')).toEqual([]);
    });
  });
});
