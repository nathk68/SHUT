import { Country as CscCountry, State, City as CscCity } from 'country-state-city';

export type MusicGenre = 'Techno' | 'House' | 'Progressive' | 'Minimal' | 'Drum & Bass' | 'Trance' | 'Other';

export type Country   = { code: string; name: string; flag: string };
export type Region    = { id: string; name: string; countryCode: string };
// cityId format : "${countryCode}__${stateCode}__${cityName}"
// regionId format: "${countryCode}__${stateCode}"
export type City      = { id: string; name: string; countryCode: string; regionId: string };
export type Venue     = { id: string; name: string; cityName: string; countryCode: string };
export type DJProfile = { id: string; name: string; cityName: string; countryCode: string; genre: MusicGenre };

// ─── Noms français des pays ───────────────────────────────────────────────────
// Évite Intl.DisplayNames qui n'est pas disponible dans Hermes/Expo Go.

const FR: Record<string, string> = {
  AF:'Afghanistan', AL:'Albanie', DZ:'Algérie', AD:'Andorre', AO:'Angola',
  AG:'Antigua-et-Barbuda', AR:'Argentine', AM:'Arménie', AU:'Australie',
  AT:'Autriche', AZ:'Azerbaïdjan', BS:'Bahamas', BH:'Bahreïn', BD:'Bangladesh',
  BB:'Barbade', BY:'Biélorussie', BE:'Belgique', BZ:'Belize', BJ:'Bénin',
  BT:'Bhoutan', BO:'Bolivie', BA:'Bosnie-Herzégovine', BW:'Botswana',
  BR:'Brésil', BN:'Brunei', BG:'Bulgarie', BF:'Burkina Faso', BI:'Burundi',
  CV:'Cap-Vert', KH:'Cambodge', CM:'Cameroun', CA:'Canada',
  CF:'Rép. centrafricaine', TD:'Tchad', CL:'Chili', CN:'Chine',
  CO:'Colombie', KM:'Comores', CD:'Congo (RDC)', CG:'Congo (Rép.)',
  CR:'Costa Rica', CI:"Côte d'Ivoire", HR:'Croatie', CU:'Cuba',
  CY:'Chypre', CZ:'République Tchèque', DK:'Danemark', DJ:'Djibouti',
  DM:'Dominique', DO:'Rép. dominicaine', EC:'Équateur', EG:'Égypte',
  SV:'Salvador', GQ:'Guinée équatoriale', ER:'Érythrée', EE:'Estonie',
  SZ:'Eswatini', ET:'Éthiopie', FJ:'Fidji', FI:'Finlande', FR:'France',
  GA:'Gabon', GM:'Gambie', GE:'Géorgie', DE:'Allemagne', GH:'Ghana',
  GR:'Grèce', GD:'Grenade', GT:'Guatemala', GN:'Guinée', GW:'Guinée-Bissau',
  GY:'Guyana', HT:'Haïti', HN:'Honduras', HU:'Hongrie', IS:'Islande',
  IN:'Inde', ID:'Indonésie', IR:'Iran', IQ:'Irak', IE:'Irlande',
  IL:'Israël', IT:'Italie', JM:'Jamaïque', JP:'Japon', JO:'Jordanie',
  KZ:'Kazakhstan', KE:'Kenya', KI:'Kiribati', KW:'Koweït', KG:'Kirghizistan',
  LA:'Laos', LV:'Lettonie', LB:'Liban', LS:'Lesotho', LR:'Liberia',
  LY:'Libye', LI:'Liechtenstein', LT:'Lituanie', LU:'Luxembourg',
  MG:'Madagascar', MW:'Malawi', MY:'Malaisie', MV:'Maldives', ML:'Mali',
  MT:'Malte', MH:'Marshall', MR:'Mauritanie', MU:'Maurice', MX:'Mexique',
  FM:'Micronésie', MD:'Moldavie', MC:'Monaco', MN:'Mongolie', ME:'Monténégro',
  MA:'Maroc', MZ:'Mozambique', MM:'Myanmar', NA:'Namibie', NR:'Nauru',
  NP:'Népal', NL:'Pays-Bas', NZ:'Nouvelle-Zélande', NI:'Nicaragua',
  NE:'Niger', NG:'Nigéria', MK:'Macédoine du Nord', NO:'Norvège',
  OM:'Oman', PK:'Pakistan', PW:'Palaos', PA:'Panama',
  PG:'Papouasie-Nouvelle-Guinée', PY:'Paraguay', PE:'Pérou',
  PH:'Philippines', PL:'Pologne', PT:'Portugal', QA:'Qatar',
  RO:'Roumanie', RU:'Russie', RW:'Rwanda',
  KN:'Saint-Christophe-et-Niévès', LC:'Sainte-Lucie',
  VC:'Saint-Vincent-et-les-Grenadines', WS:'Samoa', SM:'Saint-Marin',
  ST:'Sao Tomé-et-Principe', SA:'Arabie Saoudite', SN:'Sénégal',
  RS:'Serbie', SC:'Seychelles', SL:'Sierra Leone', SG:'Singapour',
  SK:'Slovaquie', SI:'Slovénie', SB:'Îles Salomon', SO:'Somalie',
  ZA:'Afrique du Sud', SS:'Soudan du Sud', ES:'Espagne', LK:'Sri Lanka',
  SD:'Soudan', SR:'Suriname', SE:'Suède', CH:'Suisse', SY:'Syrie',
  TW:'Taïwan', TJ:'Tadjikistan', TZ:'Tanzanie', TH:'Thaïlande',
  TL:'Timor oriental', TG:'Togo', TO:'Tonga', TT:'Trinité-et-Tobago',
  TN:'Tunisie', TR:'Turquie', TM:'Turkménistan', TV:'Tuvalu',
  UG:'Ouganda', UA:'Ukraine', AE:'Émirats arabes unis', GB:'Royaume-Uni',
  US:'États-Unis', UY:'Uruguay', UZ:'Ouzbékistan', VU:'Vanuatu',
  VE:'Venezuela', VN:'Viêt Nam', YE:'Yémen', ZM:'Zambie', ZW:'Zimbabwe',
};

// ─── Countries ────────────────────────────────────────────────────────────────

export const COUNTRIES: Country[] = CscCountry.getAllCountries()
  .map((c) => ({
    code: c.isoCode,
    name: FR[c.isoCode] ?? c.name,
    flag: c.flag ?? '',
  }))
  .sort((a, b) => a.name.localeCompare(b.name, 'fr'));

// ─── Helper functions ─────────────────────────────────────────────────────────

export function getRegionsForCountry(countryCode: string): Region[] {
  return State.getStatesOfCountry(countryCode)
    .filter((s) => (CscCity.getCitiesOfState(countryCode, s.isoCode) ?? []).length > 0)
    .map((s) => ({
      id: `${countryCode}__${s.isoCode}`,
      name: s.name,
      countryCode,
    }));
}

export function getCitiesForRegion(regionId: string): City[] {
  const sep = regionId.indexOf('__');
  const countryCode = regionId.slice(0, sep);
  const stateCode   = regionId.slice(sep + 2);
  return (CscCity.getCitiesOfState(countryCode, stateCode) ?? []).map((c) => ({
    id: `${regionId}__${c.name}`,
    name: c.name,
    countryCode,
    regionId,
  }));
}

export function getCitiesForCountry(countryCode: string): City[] {
  return (CscCity.getCitiesOfCountry(countryCode) ?? []).map((c) => ({
    id: `${countryCode}__${c.stateCode ?? ''}__${c.name}`,
    name: c.name,
    countryCode,
    regionId: `${countryCode}__${c.stateCode ?? ''}`,
  }));
}

export function getVenuesForCity(cityName: string, countryCode: string): Venue[] {
  return VENUES.filter((v) => v.cityName === cityName && v.countryCode === countryCode);
}

export function getDJsForCity(cityId: string): DJProfile[] {
  // cityId = "FR__GES__Nancy"
  const sep = cityId.indexOf('__');
  const countryCode = cityId.slice(0, sep);
  const cityName    = cityId.slice(cityId.lastIndexOf('__') + 2);
  return DJ_PROFILES.filter(
    (dj) => dj.countryCode === countryCode && dj.cityName === cityName,
  );
}

export function getDJsForRegion(regionId: string): DJProfile[] {
  const sep         = regionId.indexOf('__');
  const countryCode = regionId.slice(0, sep);
  const stateCode   = regionId.slice(sep + 2);
  const names = new Set(
    (CscCity.getCitiesOfState(countryCode, stateCode) ?? []).map((c) => c.name),
  );
  return DJ_PROFILES.filter(
    (dj) => dj.countryCode === countryCode && names.has(dj.cityName),
  );
}

export function getDJsForCountry(countryCode: string): DJProfile[] {
  return DJ_PROFILES.filter((dj) => dj.countryCode === countryCode);
}

export function searchDJs(query: string): DJProfile[] {
  if (!query) return DJ_PROFILES;
  const lower = query.toLowerCase();
  return DJ_PROFILES.filter((dj) => dj.name.toLowerCase().includes(lower));
}

// ─── Venues (mock) ────────────────────────────────────────────────────────────

export const VENUES: Venue[] = [
  { id: 'venue-berghain',   name: 'Berghain',         cityName: 'Berlin',     countryCode: 'DE' },
  { id: 'venue-tresor',     name: 'Tresor',           cityName: 'Berlin',     countryCode: 'DE' },
  { id: 'venue-watergate',  name: 'Watergate',        cityName: 'Berlin',     countryCode: 'DE' },
  { id: 'venue-rex',        name: 'Rex Club',         cityName: 'Paris',      countryCode: 'FR' },
  { id: 'venue-concrete',   name: 'Concrete',         cityName: 'Paris',      countryCode: 'FR' },
  { id: 'venue-machine',    name: 'La Machine',       cityName: 'Paris',      countryCode: 'FR' },
  { id: 'venue-fuse',       name: 'Fuse',             cityName: 'Brussels',   countryCode: 'BE' },
  { id: 'venue-fabric',     name: 'Fabric',           cityName: 'London',     countryCode: 'GB' },
  { id: 'venue-shelter',    name: 'Shelter',          cityName: 'Amsterdam',  countryCode: 'NL' },
  { id: 'venue-awakenings', name: 'Awakenings',       cityName: 'Amsterdam',  countryCode: 'NL' },
  { id: 'venue-razzmatazz', name: 'Razzmatazz',       cityName: 'Barcelona',  countryCode: 'ES' },
  { id: 'venue-amnesia',    name: 'Amnesia',          cityName: 'Eivissa',    countryCode: 'ES' },
  { id: 'venue-dc10',       name: 'DC-10',            cityName: 'Eivissa',    countryCode: 'ES' },
  { id: 'venue-lux',        name: 'Lux Frágil',       cityName: 'Lisbon',     countryCode: 'PT' },
  { id: 'venue-fabrique',   name: 'Fabrique',         cityName: 'Milan',      countryCode: 'IT' },
  { id: 'venue-docks',      name: 'Les Docks',        cityName: 'Lausanne',   countryCode: 'CH' },
  { id: 'venue-hive',       name: 'Hive Club',        cityName: 'Zurich',     countryCode: 'CH' },
  { id: 'venue-exit',       name: 'EXIT Festival',    cityName: 'Novi Sad',   countryCode: 'RS' },
  { id: 'venue-form',       name: 'Form Space',       cityName: 'Cluj-Napoca',countryCode: 'RO' },
  { id: 'venue-robert',     name: 'Robert Johnson',   cityName: 'Frankfurt',  countryCode: 'DE' },
];

// ─── DJ Profiles (mock) ───────────────────────────────────────────────────────
// cityName doit correspondre exactement au nom retourné par country-state-city.

export const DJ_PROFILES: DJProfile[] = [
  { id: 'dj-1',  name: 'Luca R',       cityName: 'Lausanne',    countryCode: 'CH', genre: 'Techno' },
  { id: 'dj-2',  name: 'Sophie V',     cityName: 'Geneva',      countryCode: 'CH', genre: 'House' },
  { id: 'dj-3',  name: 'Marcus B',     cityName: 'Zurich',      countryCode: 'CH', genre: 'Minimal' },
  { id: 'dj-4',  name: 'K-NT',         cityName: 'Paris',       countryCode: 'FR', genre: 'Minimal' },
  { id: 'dj-5',  name: 'Elise M',      cityName: 'Lyon',        countryCode: 'FR', genre: 'Progressive' },
  { id: 'dj-6',  name: 'Djinn',        cityName: 'Marseille',   countryCode: 'FR', genre: 'Techno' },
  { id: 'dj-7',  name: 'Céline D',     cityName: 'Lille',       countryCode: 'FR', genre: 'House' },
  { id: 'dj-8',  name: 'Rainer K',     cityName: 'Berlin',      countryCode: 'DE', genre: 'Techno' },
  { id: 'dj-9',  name: 'Paula T',      cityName: 'Hamburg',     countryCode: 'DE', genre: 'House' },
  { id: 'dj-10', name: 'Dax J',        cityName: 'Cologne',     countryCode: 'DE', genre: 'Techno' },
  { id: 'dj-11', name: 'Axel D',       cityName: 'Brussels',    countryCode: 'BE', genre: 'House' },
  { id: 'dj-12', name: 'Charlotte P',  cityName: 'Antwerp',     countryCode: 'BE', genre: 'Techno' },
  { id: 'dj-13', name: 'Joris V',      cityName: 'Amsterdam',   countryCode: 'NL', genre: 'Progressive' },
  { id: 'dj-14', name: 'Ferry C',      cityName: 'Rotterdam',   countryCode: 'NL', genre: 'Trance' },
  { id: 'dj-15', name: 'Carl C',       cityName: 'London',      countryCode: 'GB', genre: 'Techno' },
  { id: 'dj-16', name: 'Maya J',       cityName: 'Manchester',  countryCode: 'GB', genre: 'House' },
  { id: 'dj-17', name: 'Ricardo V',    cityName: 'Barcelona',   countryCode: 'ES', genre: 'Minimal' },
  { id: 'dj-18', name: 'Marco C',      cityName: 'Eivissa',     countryCode: 'ES', genre: 'House' },
  { id: 'dj-19', name: 'Joseph C',     cityName: 'Milan',       countryCode: 'IT', genre: 'Techno' },
  { id: 'dj-20', name: 'Tania M',      cityName: 'Lisbon',      countryCode: 'PT', genre: 'House' },
  { id: 'dj-21', name: 'Patrick P',    cityName: 'Vienna',      countryCode: 'AT', genre: 'Techno' },
  { id: 'dj-22', name: 'Adriatique',   cityName: 'Budapest',    countryCode: 'HU', genre: 'Progressive' },
  { id: 'dj-23', name: 'Kristijan M',  cityName: 'Belgrade',    countryCode: 'RS', genre: 'Techno' },
  { id: 'dj-24', name: 'Sven V',       cityName: 'Pula',        countryCode: 'HR', genre: 'Techno' },
  { id: 'dj-25', name: 'Rhadoo',       cityName: 'Bucharest',   countryCode: 'RO', genre: 'Minimal' },
  { id: 'dj-26', name: 'Petre I',      cityName: 'Cluj-Napoca', countryCode: 'RO', genre: 'Techno' },
  { id: 'dj-27', name: 'Âme',          cityName: 'Stockholm',   countryCode: 'SE', genre: 'House' },
  { id: 'dj-28', name: 'DVS1',         cityName: 'Prague',      countryCode: 'CZ', genre: 'Techno' },
  { id: 'dj-29', name: 'Richie H',     cityName: 'Toronto',     countryCode: 'CA', genre: 'Techno' },
  { id: 'dj-30', name: 'Volvox',       cityName: 'New York',    countryCode: 'US', genre: 'Techno' },
];
