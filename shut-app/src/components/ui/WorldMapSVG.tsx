import React, { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { feature } from 'topojson-client';
import { geoNaturalEarth1, geoPath } from 'd3-geo';

// world-atlas v2 uses countries-110m.json (not world/110m.json)
const world = require('world-atlas/countries-110m.json');

// ISO TopoJSON id → ISO alpha-2 code for partner countries
// IDs are 3-char numeric strings in world-atlas v2 data
const PARTNER_IDS: Record<string, string> = {
  '756': 'CH', // Switzerland
  '250': 'FR', // France
  '276': 'DE', // Germany
  '056': 'BE', // Belgium
};

const VIEWBOX_W = 960;
// Crop Antarctica: at scale 153, lat -60° ≈ y 358 → clip at 375
const VIEWBOX_H = 375;

// Natural Earth 1 projection — better aesthetics than Mercator
const projection = geoNaturalEarth1()
  .scale(153)
  .translate([VIEWBOX_W / 2, 235]); // slightly above center to compensate crop

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
    </Svg>
  );
}
