import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SearchableDropdown } from './SearchableDropdown';
import {
  COUNTRIES,
  getCitiesForCountry,
} from '../../services/_mock-data/countries';

export interface LocationValue {
  countryCode?: string;
  cityId?: string;
  cityName?: string;
}

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}

export function LocationSelector({ value, onChange }: Props) {
  const countryOptions = useMemo(
    () => COUNTRIES.map(c => ({ id: c.code, label: c.name, prefix: c.flag })),
    [],
  );

  const cityOptions = useMemo(() => {
    if (!value.countryCode) return [];
    return getCitiesForCountry(value.countryCode).map(c => ({ id: c.id, label: c.name }));
  }, [value.countryCode]);

  function handleCountrySelect(countryCode: string) {
    onChange({ countryCode });
  }

  function handleCitySelect(cityId: string) {
    const city = cityOptions.find(c => c.id === cityId);
    onChange({ countryCode: value.countryCode, cityId, cityName: city?.label ?? '' });
  }

  return (
    <View>
      <SearchableDropdown
        label="Pays"
        placeholder="Rechercher un pays..."
        options={countryOptions}
        value={value.countryCode}
        onSelect={handleCountrySelect}
        leftIcon="globe-outline"
      />
      <SearchableDropdown
        label="Ville"
        placeholder="Rechercher une ville..."
        options={cityOptions}
        value={value.cityId}
        onSelect={handleCitySelect}
        disabled={!value.countryCode}
        leftIcon="location-outline"
      />
    </View>
  );
}
