# Internationalization (i18n) Research for SHUT App

## Date: 2026-10-05
## Context: React Native 0.86 / Expo SDK 57 / TypeScript 6

---

## 1. Library Comparison

### Option A: expo-localization + i18n-js

| Metric | Value |
|---|---|
| Bundle size (core) | ~5-6 KB min+gzip (i18n-js v4.5.3) |
| NPM weekly downloads | ~560K |
| TypeScript support | Yes (v4+) |
| React Native support | Native, Expo-recommended example |
| Pluralization | Basic (zero/one/other) |
| Namespaces | Single default namespace |
| Language detector | Manual (use expo-localization) |
| Lazy loading | Not built-in |
| Interpolation | Yes |
| Context/gender | No |
| Community/ecosystem | Small, limited plugins |
| Expo docs mention | Yes (primary example in Expo guide) |

**Strengths:**
- Simplest setup, minimal boilerplate
- Officially shown in Expo localization guide
- Very lightweight
- Good for small apps with few screens

**Weaknesses:**
- No built-in namespace support (everything in one object or manual splitting)
- No lazy loading of translation bundles
- No language detector plugin (must wire manually)
- No persistence plugin (must wire AsyncStorage manually)
- Smaller community, fewer resources
- Limited pluralization (no ICU MessageFormat)
- No React hooks or context integration built-in (must wrap manually)

### Option B: expo-localization + react-i18next (i18next)

| Metric | Value |
|---|---|
| Bundle size (core) | ~9 KB min+gzip (react-i18next ~6KB + i18next ~8KB, tree-shaken) |
| NPM weekly downloads | ~6M+ (react-i18next) / ~8M+ (i18next) |
| TypeScript support | Yes, first-class with declaration merging for key autocomplete |
| React Native support | Full, works identically to React |
| Pluralization | Full ICU plural rules (with compatibilityJSON: 'v4') |
| Namespaces | Yes, first-class support |
| Language detector | Plugin ecosystem (custom detector for RN) |
| Lazy loading | Yes (i18next-resources-to-backend) |
| Interpolation | Yes, advanced (nesting, formatting) |
| Context/gender | Yes |
| Community/ecosystem | Largest in the React i18n space |
| Expo docs mention | Yes (listed as recommended alternative) |

**Strengths:**
- Industry standard, largest community (6M+ weekly downloads)
- First-class namespace support for organizing translations by feature
- useTranslation() hook integrates naturally with React components
- Plugin architecture: language detectors, backends, caching
- AsyncStorage persistence via custom language detector or plugin
- Full ICU plural support across all languages
- TypeScript autocompletion on translation keys (with setup)
- Lazy loading translations per namespace
- Same API works in React, React Native, Node.js
- Extensive documentation and tutorials
- Active maintenance (regular releases)

**Weaknesses:**
- Slightly larger bundle than i18n-js (~9KB vs ~5KB)
- Initial configuration has more boilerplate than i18n-js
- Full plugin stack (detector + backend + cache) can reach ~20KB
- Declaration merging for TypeScript key safety requires manual setup

### Option C: expo-localization + react-intl (FormatJS)

| Metric | Value |
|---|---|
| Bundle size (core) | ~20KB+ min+gzip |
| NPM weekly downloads | ~1.5M |
| TypeScript support | Yes |
| React Native support | Yes, but with caveats |
| Pluralization | Most complete ICU MessageFormat implementation |
| Namespaces | No built-in concept |
| Language detector | Manual |
| Lazy loading | Manual code splitting |
| Interpolation | Yes (ICU syntax) |
| Context/gender | Yes (full ICU) |
| Community/ecosystem | Large (FormatJS), but web-focused |
| Expo docs mention | No |

**Strengths:**
- Most complete ICU MessageFormat implementation
- Excellent for complex pluralization, gender, select rules
- Strong enterprise adoption
- Backed by FormatJS (well-maintained)

**Weaknesses:**
- LARGEST bundle size (~20KB+, heaviest of all three)
- Requires Intl polyfills on React Native / Hermes engine
  - Hermes ships WITHOUT Intl.PluralRules and Intl.Locale
  - Polyfills carry CLDR data, significantly increasing bundle
  - @formatjs/intl-localematcher has documented performance issues on Hermes (10s+ polyfill time reported)
- No namespace concept (harder to organize large translation sets)
- ICU MessageFormat syntax is more complex for translators
- Web-centric design, React Native is secondary concern
- No built-in language detector or persistence
- Not mentioned in Expo documentation

---

## 2. Recommendation: expo-localization + react-i18next

**react-i18next is the clear winner for SHUT's requirements.** Here is why:

### Fit for SHUT specifically:

1. **Scale**: SHUT has 40+ screens across auth, onboarding, settings, broadcaster, viewer, and profile sections. Namespace support is essential to keep translations organized and maintainable.

2. **Existing infrastructure**: SHUT already has a PreferencesContext with AsyncStorage persistence for language preference. react-i18next's custom language detector pattern integrates cleanly with this existing setup.

3. **Two-language scope (fr/en)**: The app needs French and English. react-i18next handles this perfectly without the overhead of react-intl's ICU complexity.

4. **No Intl polyfill burden**: Unlike react-intl, react-i18next does NOT require Intl polyfills on Hermes. This avoids the documented performance issues and bundle bloat.

5. **Expo ecosystem alignment**: Expo's own documentation lists react-i18next as a recommended alternative. The community has standardized on this stack.

6. **Hook-based API**: useTranslation() works naturally in functional components, which is what SHUT uses throughout.

### Why NOT the others:

- **i18n-js**: Too simple for 40+ screens. No namespaces, no lazy loading, no hooks. Would require significant custom wrappers to achieve what react-i18next provides out of the box.

- **react-intl**: Overkill ICU support, problematic Hermes polyfills, largest bundle, no namespace concept. The Intl polyfill issues on React Native are a genuine risk.

### Required packages:

```
npx expo install expo-localization
npm install i18next react-i18next
```

expo-localization is already compatible with Expo SDK 57. AsyncStorage is already installed in the project.

---

## 3. Translation File Structure Recommendation

### Recommended: Namespace-based with flat keys (hybrid approach)

For SHUT's current size (~40 screens, 2 languages), a single file per language with logical grouping by feature is the right balance. Full namespace splitting (separate files per feature) is overkill at this stage but can be adopted later without refactoring.

```
src/
  i18n/
    index.ts              # i18next initialization
    locales/
      fr.json             # All French translations
      en.json             # All English translations
```

### JSON structure (flat with dot-separated logical groups):

```json
{
  "common": {
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "save": "Enregistrer",
    "delete": "Supprimer",
    "back": "Retour",
    "loading": "Chargement...",
    "error": "Erreur",
    "retry": "Reessayer"
  },
  "auth": {
    "login": "Se connecter",
    "register": "S'inscrire",
    "logout": "Se deconnecter",
    "forgotPassword": "Mot de passe oublie"
  },
  "settings": {
    "title": "Parametres",
    "language": "Langue",
    "notifications": "Notifications",
    "videoQuality": "Qualite video",
    "account": "Compte",
    "deleteAccount": "Supprimer mon compte"
  },
  "profile": {
    "viewProfile": "Voir le profil",
    "editProfile": "Modifier le profil"
  },
  "live": {
    "goLive": "Lancer le live",
    "endLive": "Terminer le live"
  },
  "location": {
    "selectCity": "Selectionner une ville",
    "searchPlaceholder": "Tape le nom d'une ville...",
    "noResults": "Aucune ville trouvee",
    "minChars": "Tape au moins 2 caracteres",
    "partnerCountries": "Pays partenaires",
    "orSearchCity": "Ou recherche une ville",
    "entireCountry": "Tout le pays"
  }
}
```

### Why this structure:

1. **Single file per language**: Easy to find, easy to diff, easy to hand to a translator. With only 2 languages and ~200-300 keys, a single file stays manageable.

2. **Nested by feature**: Keys are grouped logically (common, auth, settings, profile, live, location, onboarding, etc.) making it easy to find the right key.

3. **Flat within groups**: No more than 2 levels of nesting. Deeply nested keys become hard to reference and maintain.

4. **Migration path**: If the app grows significantly, each top-level group can be extracted into a separate namespace file without changing the key references in components.

### Key naming conventions:

- Use camelCase for keys: `videoQuality`, not `video_quality`
- Use descriptive names: `settings.deleteAccountConfirmTitle`, not `settings.d1`
- Prefix dynamic content: `live.viewerCount_one` / `live.viewerCount_other` for plurals
- Keep alert titles and messages as separate keys: `settings.logoutTitle`, `settings.logoutMessage`

---

## 4. Photon API Language Parameter Handling

### Current state in SHUT:

The LocationSelector component (src/components/ui/LocationSelector.tsx) currently hardcodes `lang=fr` in the Photon API URL (line 59):

```
https://photon.komoot.io/api/?q=...&limit=...&lang=fr&osm_tag=...
```

### How the Photon lang parameter works:

- Accepts a single language code per request (e.g., `fr`, `en`, `de`, `it`)
- Returns city/place names in the requested language when a translation exists in OpenStreetMap data
- Falls back to the server's default language, then to the local place name if no translation exists
- When omitted, uses the Accept-Language HTTP header

### Recommended approach:

1. **Read the current app language** from either the i18next instance or the PreferencesContext
2. **Pass it to the Photon API** as the `lang` parameter
3. **Map i18n language codes** to Photon-compatible codes (they align: 'fr' -> 'fr', 'en' -> 'en')

The implementation would involve:
- Making the `searchCities` function accept a `lang` parameter
- Having `LocationSelector` read the current language from context/i18next and pass it through
- This ensures city names appear in the user's selected language

### Important caveat:

Not all city names have translations in OpenStreetMap. Major cities (Paris, London, Munich/Munchen) will translate correctly. Smaller towns and villages may only have their local name regardless of the language parameter. This is a data completeness issue in OpenStreetMap, not a bug.

---

## 5. Best Practices for React Native i18n

### Architecture:

1. **Initialize i18next early**: Import the i18n config in your root layout/App component before any screen renders. This avoids flash-of-untranslated-content.

2. **Use hooks everywhere**: `const { t } = useTranslation()` in every component that displays text. Never import the i18n instance directly in components.

3. **Integrate with existing PreferencesContext**: Create a custom language detector for i18next that reads from AsyncStorage (where SHUT already stores language preference). When the user changes language in settings, update both the i18next language and the preference.

4. **Device language detection on first launch**: Use `expo-localization`'s `getLocales()[0]?.languageCode` to detect the device language. If it matches a supported language (fr/en), use it. Otherwise, fall back to French (the app's current default).

### Translation strings:

5. **Never concatenate translated strings**: Word order changes across languages. Use interpolation: `t('welcome', { name: 'DJ Nath' })` with `"welcome": "Bienvenue {{name}}"`, not `t('welcome') + name`.

6. **Translate full sentences, not words**: `t('settings.deleteConfirmMessage')` not `t('common.delete') + ' ' + t('common.account')`.

7. **Handle plurals properly**: Use i18next plural suffixes (`_one`, `_other`, `_zero`). Example: `"viewerCount_one": "{{count}} viewer"`, `"viewerCount_other": "{{count}} viewers"`.

8. **Externalize ALL user-facing strings**: Including Alert titles, Alert messages, button labels, placeholder text, error messages, validation messages. The SettingsScreen alone has ~30 hardcoded French strings.

### Platform considerations:

9. **iOS vs Android language change behavior**: On iOS, changing device language restarts the app, so the locale is picked up on startup. On Android, it does NOT restart. Use `useLocales()` hook from expo-localization which auto-rerenders on OS setting changes, or listen to AppState changes.

10. **Do not localize legal/regulatory content carelessly**: Legal screens (Privacy Policy, Terms, RGPD) may need to remain in French for legal compliance in France, or require professionally translated versions. This is a business decision, not a technical one.

11. **Date and number formatting**: Use the native `Intl.DateTimeFormat` and `Intl.NumberFormat` APIs (or date-fns locale support, which SHUT already uses via date-fns). Do not use i18next for date/number formatting.

### Development workflow:

12. **Start with the French JSON**: Export all existing hardcoded strings into fr.json first. Then create en.json as a copy and translate.

13. **Use a missing-key handler**: Configure i18next's `missingKeyHandler` during development to log warnings when a translation key is missing. This catches untranslated strings early.

14. **Consider a lint rule or script**: A simple script that compares keys between fr.json and en.json to ensure both files have identical key sets.

---

## 6. Migration Strategy for SHUT

### Scope assessment:

- **40+ screen files** with hardcoded French strings
- **15+ files** with significant hardcoded text (based on grep analysis)
- **1 component** (LocationSelector) with Photon API language parameter
- **1 context** (PreferencesContext) already managing language preference with AsyncStorage
- **1 screen** (LanguageScreen) already providing language switching UI
- **Multiple Alert.alert() calls** with French strings throughout

### Recommended migration order:

1. Install packages and create i18n configuration
2. Create fr.json with all externalized strings
3. Create en.json as translated copy
4. Integrate i18next language detector with existing PreferencesContext
5. Migrate screens incrementally (settings screens first, then auth, then onboarding, etc.)
6. Update LocationSelector to pass dynamic language to Photon API
7. Test both languages end-to-end

---

## Sources

- Expo Localization Guide: https://docs.expo.dev/guides/localization/
- Expo Localization SDK Reference: https://docs.expo.dev/versions/latest/sdk/localization/
- Photon API Documentation: https://github.com/komoot/photon/blob/master/docs/api-v1.md
- react-i18next Documentation: https://react.i18next.com/
- i18next Documentation: https://www.i18next.com/
- React Native i18n 2026 Playbook: https://dev.to/sophie_fa_6ed935b0601d76/react-native-i18n-in-2026-a-practical-expo-router-playbook-2k8f
- i18n Libraries Comparison 2026: https://dev.to/erayg/best-i18n-libraries-for-nextjs-react-react-native-in-2026-honest-comparison-3m8f
- SimpleLocalize Library Comparison: https://simplelocalize.io/blog/posts/the-most-popular-react-localization-libraries/
- FormatJS/react-intl Hermes Issues: https://github.com/formatjs/formatjs/issues/4276
