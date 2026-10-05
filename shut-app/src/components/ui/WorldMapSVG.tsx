import React, { useMemo } from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Rect } from 'react-native-svg';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoPath } from 'd3-geo';

// world-atlas v2 uses countries-110m.json (not world/110m.json)
const world = require('world-atlas/countries-110m.json');

// ISO TopoJSON id → ISO alpha-2 code for partner countries
// IDs are 3-char numeric strings in world-atlas v2 data
const PARTNER_IDS: Record<string, string> = {
  '756': 'CH', // Switzerland
  '250': 'FR', // France
};

const VIEWBOX_W = 960;
const VIEWBOX_H = 700;

// Zoomed on France + Switzerland
const projection = geoNaturalEarth1()
  .scale(1800)
  .translate([VIEWBOX_W / 2 + 60, VIEWBOX_H / 2 + 1450]);

const pathGen = geoPath(projection);

// Pre-compute all country paths at module load (static data, never changes)
const countryPaths: Array<{ id: string; d: string; alpha2: string | undefined }> =
  feature(world, world.objects.countries)
    .features.map((c: any) => ({
      id: String(c.id),
      d: pathGen(c) ?? '',
      alpha2: PARTNER_IDS[String(c.id)],
    }))
    .filter((c: any) => c.d && c.id && c.id !== 'undefined');

// ─── Colors ───────────────────────────────────────────────────────────────────

const COLOR_PARTNER = '#974dfb';
const COLOR_SELECTED = '#c080ff';
const COLOR_DEFAULT = '#1c1b2e';
const COLOR_STROKE = '#08080f';
const FADE_COLOR = '#08080f';
const FADE_SIZE = 150;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  width: number;
  height: number;
  selectedCode?: string | null;
  onCountryPress?: (code: string) => void;
}

export function WorldMapSVG({ width, height, selectedCode, onCountryPress }: Props) {
  // Separate partner paths from non-partner so partners render on top
  const { nonPartnerPaths, partnerPaths } = useMemo(() => {
    const partnerPaths = countryPaths.filter((c) => c.alpha2);
    const nonPartnerPaths = countryPaths.filter((c) => !c.alpha2);
    return { partnerPaths, nonPartnerPaths };
  }, []);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
    >
      {/* Non-partner countries first (background layer) */}
      {nonPartnerPaths.map(({ id, d }) => (
        <Path
          key={id}
          d={d}
          fill={COLOR_DEFAULT}
          stroke={COLOR_STROKE}
          strokeWidth={0.5}
        />
      ))}

      {/* Partner countries on top (highlighted layer) */}
      {partnerPaths.map(({ id, d, alpha2 }) => {
        const isSelected = alpha2 === selectedCode;
        return (
          <Path
            key={id}
            d={d}
            fill={isSelected ? COLOR_SELECTED : COLOR_PARTNER}
            stroke={isSelected ? 'rgba(255,255,255,0.4)' : COLOR_STROKE}
            strokeWidth={isSelected ? 1.5 : 0.5}
            onPress={onCountryPress ? () => onCountryPress(alpha2!) : undefined}
          />
        );
      })}

      {/* Edge fade overlays */}
      <Defs>
        <LinearGradient id="fadeLeft" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={FADE_COLOR} stopOpacity="1" />
          <Stop offset="1" stopColor={FADE_COLOR} stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="fadeRight" x1="1" y1="0" x2="0" y2="0">
          <Stop offset="0" stopColor={FADE_COLOR} stopOpacity="1" />
          <Stop offset="1" stopColor={FADE_COLOR} stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="fadeTop" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={FADE_COLOR} stopOpacity="1" />
          <Stop offset="1" stopColor={FADE_COLOR} stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="fadeBottom" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={FADE_COLOR} stopOpacity="1" />
          <Stop offset="1" stopColor={FADE_COLOR} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={FADE_SIZE} height={VIEWBOX_H} fill="url(#fadeLeft)" />
      <Rect x={VIEWBOX_W - FADE_SIZE} y="0" width={FADE_SIZE} height={VIEWBOX_H} fill="url(#fadeRight)" />
      <Rect x="0" y="0" width={VIEWBOX_W} height={FADE_SIZE} fill="url(#fadeTop)" />
      <Rect x="0" y={VIEWBOX_H - FADE_SIZE} width={VIEWBOX_W} height={FADE_SIZE} fill="url(#fadeBottom)" />
    </Svg>
  );
}
