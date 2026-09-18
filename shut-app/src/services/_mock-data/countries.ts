export type MusicGenre = 'Techno' | 'House' | 'Progressive' | 'Minimal' | 'Other';

export type Country = {
  code: string;
  name: string;
  flag: string;
};

export type Region = {
  id: string;
  name: string;
  countryCode: string;
};

export type City = {
  id: string;
  name: string;
  countryCode: string;
  regionId: string;
};

export type Venue = {
  id: string;
  name: string;
  cityId: string;
};

export type DJProfile = {
  id: string;
  name: string;
  cityId: string;
  countryCode: string;
  genre: MusicGenre;
};

export const COUNTRIES: Country[] = [
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
];

export const REGIONS: Region[] = [
  { id: 'region-vaud', name: 'Vaud', countryCode: 'CH' },
  { id: 'region-geneve-canton', name: 'Genève', countryCode: 'CH' },
  { id: 'region-zurich-canton', name: 'Zurich', countryCode: 'CH' },
  { id: 'region-idf', name: 'Île-de-France', countryCode: 'FR' },
  { id: 'region-ara', name: 'Auvergne-Rhône-Alpes', countryCode: 'FR' },
  { id: 'region-berlin', name: 'Berlin', countryCode: 'DE' },
  { id: 'region-bruxelles', name: 'Bruxelles-Capitale', countryCode: 'BE' },
];

export const CITIES: City[] = [
  { id: 'city-lausanne', name: 'Lausanne', countryCode: 'CH', regionId: 'region-vaud' },
  { id: 'city-geneve', name: 'Genève', countryCode: 'CH', regionId: 'region-geneve-canton' },
  { id: 'city-zurich', name: 'Zurich', countryCode: 'CH', regionId: 'region-zurich-canton' },
  { id: 'city-paris', name: 'Paris', countryCode: 'FR', regionId: 'region-idf' },
  { id: 'city-lyon', name: 'Lyon', countryCode: 'FR', regionId: 'region-ara' },
  { id: 'city-berlin', name: 'Berlin', countryCode: 'DE', regionId: 'region-berlin' },
  { id: 'city-bruxelles', name: 'Bruxelles', countryCode: 'BE', regionId: 'region-bruxelles' },
];

export const VENUES: Venue[] = [
  { id: 'venue-docks', name: 'Les Docks', cityId: 'city-lausanne' },
  { id: 'venue-mad', name: 'MAD Club', cityId: 'city-lausanne' },
  { id: 'venue-blackbox', name: 'Black Box', cityId: 'city-geneve' },
  { id: 'venue-cave', name: 'La Cave', cityId: 'city-geneve' },
  { id: 'venue-hive', name: 'Hive Club', cityId: 'city-zurich' },
  { id: 'venue-dpavilion', name: 'D! Pavilion', cityId: 'city-zurich' },
  { id: 'venue-machine', name: 'La Machine', cityId: 'city-paris' },
  { id: 'venue-rex', name: 'Rex Club', cityId: 'city-paris' },
  { id: 'venue-ninkasi', name: 'Ninkasi', cityId: 'city-lyon' },
  { id: 'venue-berghain', name: 'Berghain', cityId: 'city-berlin' },
  { id: 'venue-tresor', name: 'Tresor', cityId: 'city-berlin' },
  { id: 'venue-fuse', name: 'Fuse', cityId: 'city-bruxelles' },
  { id: 'venue-koekelberg', name: 'Koekelberg', cityId: 'city-bruxelles' },
];

export const DJ_PROFILES: DJProfile[] = [
  { id: 'dj-1', name: 'Luca R', cityId: 'city-lausanne', countryCode: 'CH', genre: 'Techno' },
  { id: 'dj-2', name: 'Sophie V', cityId: 'city-geneve', countryCode: 'CH', genre: 'House' },
  { id: 'dj-3', name: 'Marcus B', cityId: 'city-zurich', countryCode: 'CH', genre: 'Minimal' },
  { id: 'dj-4', name: 'K-NT', cityId: 'city-paris', countryCode: 'FR', genre: 'Minimal' },
  { id: 'dj-5', name: 'Elise M', cityId: 'city-lyon', countryCode: 'FR', genre: 'Progressive' },
  { id: 'dj-6', name: 'Rainer K', cityId: 'city-berlin', countryCode: 'DE', genre: 'Techno' },
  { id: 'dj-7', name: 'Axel D', cityId: 'city-bruxelles', countryCode: 'BE', genre: 'House' },
];

export function getRegionsForCountry(countryCode: string): Region[] {
  return REGIONS.filter((r) => r.countryCode === countryCode);
}

export function getCitiesForCountry(countryCode: string): City[] {
  return CITIES.filter((city) => city.countryCode === countryCode);
}

export function getCitiesForRegion(regionId: string): City[] {
  return CITIES.filter((city) => city.regionId === regionId);
}

export function getVenuesForCity(cityId: string): Venue[] {
  return VENUES.filter((venue) => venue.cityId === cityId);
}

export function getDJsForCity(cityId: string): DJProfile[] {
  return DJ_PROFILES.filter((dj) => dj.cityId === cityId);
}

export function getDJsForRegion(regionId: string): DJProfile[] {
  const cityIds = new Set(getCitiesForRegion(regionId).map((c) => c.id));
  return DJ_PROFILES.filter((dj) => cityIds.has(dj.cityId));
}

export function getDJsForCountry(countryCode: string): DJProfile[] {
  return DJ_PROFILES.filter((dj) => dj.countryCode === countryCode);
}

export function searchDJs(query: string): DJProfile[] {
  if (!query) return DJ_PROFILES;
  const lower = query.toLowerCase();
  return DJ_PROFILES.filter((dj) => dj.name.toLowerCase().includes(lower));
}
