import { useRef, useEffect } from 'react';
import { PropertyFormData } from '../types';
import { MapPin, Info, Check } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useCities, useCountries, useStates, useVillages } from '@/hooks/use-locations';
import { stripArabicNumerals, blockArabicNumeralKey } from '@/lib/utils/numeric-input';

interface LocationStepProps {
  listing: PropertyFormData;
  setListing: (listing: PropertyFormData) => void;
  isMapLoaded: boolean;
  readOnly?: boolean;
  validationErrors?: Record<string, string>;
  hasAttemptedNext?: boolean;
}

const STATE_SUFFIXES = [
  'governorate',
  'municipality',
  'province',
  'district',
  'region',
  'state',
];

const normalizeStateName = (name: string) => {
  let n = name.toLowerCase().trim();
  for (const suffix of STATE_SUFFIXES) {
    if (n.endsWith(' ' + suffix)) {
      n = n.slice(0, -(suffix.length + 1)).trim();
      break;
    }
  }
  return n;
};

const findStateByName = (states: any[], name: string) => {
  if (!name) return null;
  const n = normalizeStateName(name);
  // 1. exact match after normalization
  const exact = states.find((s: any) => normalizeStateName(s.name) === n);
  if (exact) return exact;
  // 2. contains match
  return (
    states.find(
      (s: any) =>
        normalizeStateName(s.name).includes(n) ||
        n.includes(normalizeStateName(s.name))
    ) || null
  );
};

const findCityByName = (cities: any[], name: string) => {
  if (!name) return null;
  const n = name.toLowerCase();
  // 1. exact match
  const exact = cities.find((c: any) => c.name.toLowerCase() === n);
  if (exact) return exact;
  // 2. one contains the other (handles "Kafr El-Sheikh" vs "Kafr El Sheikh City" etc.)
  return (
    cities.find(
      (c: any) =>
        c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase())
    ) || null
  );
};

export const LocationStep = ({
  listing,
  setListing,
  isMapLoaded,
  readOnly,
  validationErrors = {},
  hasAttemptedNext = false,
}: LocationStepProps) => {
  const { countries } = useCountries();
  const selectedCountryName =
    countries.find((c) => String(c.id) === String(listing.country))?.name || '';
  const isEgyptSelected = selectedCountryName.toLowerCase().includes('egypt');
  const { states, isLoading: loadingStates } = useStates(listing.country);
  const { cities, isLoading: loadingCities } = useCities(listing.state);
  const { villages, isLoading: loadingVillages } = useVillages(listing.city);
  const hasStates = !loadingStates && states.length > 0;
  const hasCities = !loadingCities && cities.length > 0;
  const hasVillages = !loadingVillages && villages.length > 0;

  // District IDs 418-425 are rural areas → label "Village", otherwise "Neighborhood"
  const selectedCityId = Number(listing.city);
  const isRuralDistrict = selectedCityId >= 418 && selectedCityId <= 425;
  const villageLabelText = isRuralDistrict ? 'Village' : 'Neighborhood';
  const areaLabelText = isRuralDistrict ? 'Gate' : 'Area';
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  // Always-fresh refs so the place_changed listener never reads stale data
  const countriesRef = useRef(countries);
  const statesRef = useRef(states);
  const citiesRef = useRef(cities);
  const listingRef = useRef(listing);
  const pendingCityNameRef = useRef<string | null>(null);
  const pendingStateNameRef = useRef<string | null>(null);

  useEffect(() => {
    countriesRef.current = countries;
  }, [countries]);
  useEffect(() => {
    statesRef.current = states;
  }, [states]);
  useEffect(() => {
    citiesRef.current = cities;
  }, [cities]);
  useEffect(() => {
    listingRef.current = listing;
  }, [listing]);

  useEffect(() => {
    if (readOnly) return;
    if (listing.country) return;
    if (countries.length === 0) return;
    const egypt = countries.find((c) =>
      c.name.toLowerCase().includes('egypt')
    );
    if (egypt) {
      setListing({
        ...listingRef.current,
        country: String(egypt.id),
        countryName: egypt.name,
      });
    }
  }, [countries, listing.country, readOnly, setListing]);

  // Once states reload for a new country, resolve any pending state name → ID
  useEffect(() => {
    if (pendingStateNameRef.current && states.length > 0) {
      const name = pendingStateNameRef.current;
      const matched = findStateByName(states, name);
      if (matched) {
        pendingStateNameRef.current = null;
        setListing({ ...listingRef.current, state: String(matched.id) });
      }
    }
  }, [states, setListing]);

  // Once cities reload for a new country, resolve any pending city name → ID
  useEffect(() => {
    if (pendingCityNameRef.current && cities.length > 0) {
      const name = pendingCityNameRef.current;
      const matched = findCityByName(cities, name);
      if (matched) {
        pendingCityNameRef.current = null;
        setListing({ ...listingRef.current, city: String(matched.id) });
      }
    }
  }, [cities, setListing]);

  useEffect(() => {
    if (isMapLoaded && addressInputRef.current && !autocompleteRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          fields: ['address_components', 'formatted_address', 'geometry'],
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        console.log('[Autocomplete] place_changed fired', place);

        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const current = listingRef.current;

          let street = '';
          let cityName = '';
          let state = '';
          let postalCode = '';
          let countryName = '';

          place.address_components?.forEach((component) => {
            const types = component.types;
            if (types.includes('street_number'))
              street = component.long_name + ' ';
            if (types.includes('route')) street += component.long_name;
            if (types.includes('locality')) cityName = component.long_name;
            if (!cityName && types.includes('sublocality_level_1'))
              cityName = component.long_name;
            if (!cityName && types.includes('sublocality'))
              cityName = component.long_name;
            if (!cityName && types.includes('administrative_area_level_2'))
              cityName = component.long_name;
            if (types.includes('administrative_area_level_1'))
              state = component.long_name;
            if (types.includes('postal_code')) postalCode = component.long_name;
            if (types.includes('country')) countryName = component.long_name;
          });

          console.log('[Autocomplete] parsed fields:', {
            street: street.trim(),
            cityName,
            state,
            postalCode,
            countryName,
          });

          // Resolve country → ID using fresh ref
          const matchedCountry = countriesRef.current.find(
            (c) => c.name.toLowerCase() === countryName.toLowerCase()
          );
          const countryId = matchedCountry
            ? String(matchedCountry.id)
            : current.country;

          // Resolve state → ID
          const matchedState = findStateByName(statesRef.current, state);
          const stateId = matchedState ? String(matchedState.id) : '';

          // Resolve city → ID using fresh ref (cities already loaded for this country)
          const matchedCity = findCityByName(citiesRef.current, cityName);
          let cityId: string;
          if (matchedCity) {
            cityId = String(matchedCity.id);
            pendingCityNameRef.current = null;
          } else {
            // Cities for the new country haven't loaded yet — store name and resolve later
            cityId = current.city;
            pendingCityNameRef.current = cityName || null;
          }

          setListing({
            ...current,
            street: street.trim() || current.street,
            state: stateId || current.state,
            postalCode: postalCode || current.postalCode,
            country: countryId,
            latitude: lat,
            longitude: lng,
            city: cityId,
          });
        }
      });

      autocompleteRef.current = autocomplete;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded]);

  const mapCenter = {
    lat: listing.latitude,
    lng: listing.longitude,
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  };

  const updateLocationFromCoordinates = (lat: number, lng: number) => {
    if (!isMapLoaded) {
      setListing({ ...listingRef.current, latitude: lat, longitude: lng });
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      const current = listingRef.current;
      if (status === 'OK' && results && results[0]) {
        let street = '';
        let cityName = '';
        let state = '';
        let postalCode = '';
        let countryName = '';

        results[0].address_components?.forEach((component) => {
          const types = component.types;
          if (types.includes('street_number'))
            street = component.long_name + ' ';
          if (types.includes('route')) street += component.long_name;
          if (types.includes('locality')) cityName = component.long_name;
          if (!cityName && types.includes('sublocality_level_1'))
            cityName = component.long_name;
          if (!cityName && types.includes('sublocality'))
            cityName = component.long_name;
          if (!cityName && types.includes('administrative_area_level_2'))
            cityName = component.long_name;
          if (types.includes('administrative_area_level_1'))
            state = component.long_name;
          if (types.includes('postal_code')) postalCode = component.long_name;
          if (types.includes('country')) countryName = component.long_name;
        });

        const matchedCountry = countriesRef.current.find(
          (c) => c.name.toLowerCase() === countryName.toLowerCase()
        );
        const countryId = matchedCountry
          ? String(matchedCountry.id)
          : current.country;
        const countryChanged = countryId !== current.country;

        // Resolve state → ID (defer if country changed — states not loaded yet)
        const matchedState = findStateByName(statesRef.current, state);
        let stateId: string;
        if (matchedState) {
          stateId = String(matchedState.id);
          pendingStateNameRef.current = null;
        } else if (state && countryChanged) {
          stateId = '';
          pendingStateNameRef.current = state;
        } else {
          stateId = '';
        }

        // Resolve city → ID (defer if country changed — cities not loaded yet)
        const matchedCity = findCityByName(citiesRef.current, cityName);
        let cityId: string;
        if (matchedCity) {
          cityId = String(matchedCity.id);
          pendingCityNameRef.current = null;
        } else if (cityName && countryChanged) {
          cityId = '';
          pendingCityNameRef.current = cityName;
        } else {
          cityId = current.city;
        }

        // If city wasn't found but we have a name (same country), store for deferred resolution
        if (!matchedCity && cityName && !countryChanged) {
          pendingCityNameRef.current = cityName;
        }

        console.log('[Map] Location selected:', {
          lat,
          lng,
          street: street.trim() || current.street,
          city: cityName,
          state,
          country: countryName,
          postalCode,
          cityId,
          countryId,
        });
        setListing({
          ...current,
          latitude: lat,
          longitude: lng,
          street: street.trim() || current.street,
          state: stateId || current.state,
          postalCode: postalCode || current.postalCode,
          country: countryId,
          city: cityId,
        });
      } else {
        console.log('[Map] Location selected (coords only):', { lat, lng });
        setListing({ ...current, latitude: lat, longitude: lng });
      }
    });
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) updateLocationFromCoordinates(e.latLng.lat(), e.latLng.lng());
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) updateLocationFromCoordinates(e.latLng.lat(), e.latLng.lng());
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {'Search for address'}
          <span className="text-gray-400 text-xs ml-2">
            {'Start typing for suggestions'}
          </span>
        </label>
        <input
          ref={addressInputRef}
          type="text"
          disabled={readOnly}
          placeholder="Start typing your address..."
          className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        <p className="text-xs text-gray-500 mt-2">
          <Info className="w-3 h-3 inline mr-1" />
          {'Select an address from suggestions to auto-fill the form'}
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          {'Or enter manually'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {'Country / Region'}<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={listing.country}
              disabled={readOnly}
              onChange={(e) => {
                const selected = countries.find(
                  (c) => String(c.id) === e.target.value
                );
                const updated = {
                  ...listing,
                  country: e.target.value,
                  countryName: selected?.name || '',
                  city: '',
                  cityName: '',
                  street: '',
                  apt: '',
                  state: '',
                  postalCode: '',
                };
                setListing(updated);

                // Move the map to the selected country
                if (selected?.name && isMapLoaded) {
                  const geocoder = new google.maps.Geocoder();
                  geocoder.geocode(
                    { address: selected.name },
                    (results, status) => {
                      if (status === 'OK' && results?.[0]?.geometry?.location) {
                        const lat = results[0].geometry.location.lat();
                        const lng = results[0].geometry.location.lng();
                        setListing({
                          ...updated,
                          latitude: lat,
                          longitude: lng,
                        });
                      }
                    }
                  );
                }
              }}
              className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
              }`}
            >
              <option value="">{"Select country"}</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {'State / Province'}<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              title="State / Province"
              value={listing.state}
              disabled={!listing.country || readOnly}
              onChange={(e) =>
                setListing({
                  ...listing,
                  state: e.target.value,
                  city: '',
                  street: '',
                  apt: '',
                  postalCode: '',
                })
              }
              className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                !listing.country || readOnly
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                  : ''
              }`}
            >
              <option value="">{"Select state"}</option>
              {states.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {'District'}<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              title="District"
              disabled={!listing.state || readOnly || loadingCities}
              value={listing.city}
              onChange={(e) => {
                const selected = cities.find(
                  (c: any) => String(c.id) === e.target.value
                );
                setListing({
                  ...listing,
                  city: e.target.value,
                  cityName: selected?.name || '',
                  villageId: '',
                });
              }}
              className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                !listing.state || readOnly || loadingCities
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                  : ''
              }`}
            >
              <option value="">
                {loadingCities ? 'Loading districts...' : 'Select district'}
              </option>
              {cities.map((city: any) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {listing.city && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {villageLabelText}<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                title={villageLabelText}
                disabled={!listing.city || readOnly || loadingVillages}
                value={listing.villageId}
                onChange={(e) =>
                  setListing({ ...listing, villageId: e.target.value })
                }
                className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                  !listing.city || readOnly
                    ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                    : ''
                }`}
              >
                <option value="">
                  {loadingVillages ? 'Loading...' : `Select ${villageLabelText}`}
                </option>
                {villages.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {listing.city && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {areaLabelText}
              </label>
              <input
                type="text"
                value={listing.area}
                disabled={readOnly}
                onChange={(e) =>
                  setListing({ ...listing, area: e.target.value })
                }
                placeholder={`Enter ${areaLabelText}`}
                className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                  readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                }`}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {'Street Address'}<span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={listing.street}
              disabled={readOnly}
              onChange={(e) =>
                setListing({ ...listing, street: e.target.value })
              }
              placeholder="Enter street address"
              className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
              }`}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {'Building Number'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={listing.buildingNumber}
                disabled={readOnly}
                onKeyDown={blockArabicNumeralKey}
                onChange={(e) =>
                  setListing({ ...listing, buildingNumber: stripArabicNumerals(e.target.value) })
                }
                placeholder="e.g. 12"
                className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                  readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {'Floor Number'}
              </label>
              <input
                type="number"
                value={listing.floorNumber}
                disabled={readOnly}
                onKeyDown={blockArabicNumeralKey}
                onChange={(e) =>
                  setListing({ ...listing, floorNumber: stripArabicNumerals(e.target.value) })
                }
                placeholder="e.g. 3"
                className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                  readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {'Unit Number'}
              </label>
              <input
                type="text"
                value={listing.unitNumber}
                disabled={readOnly}
                onChange={(e) =>
                  setListing({ ...listing, unitNumber: e.target.value })
                }
                placeholder="e.g. 4A"
                className={`w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-lg ${
                  readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {'Postal Code'}
              {isEgyptSelected && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={listing.postalCode}
              disabled={readOnly}
              onKeyDown={blockArabicNumeralKey}
              onChange={(e) =>
                setListing({
                  ...listing,
                  postalCode: stripArabicNumerals(e.target.value),
                })
              }
              placeholder="Enter postal code"
              className={`w-full px-4 py-4 border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none ${
                readOnly
                  ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                  : isEgyptSelected && hasAttemptedNext && !listing.postalCode
                    ? 'border-red-400'
                    : 'border-gray-300'
              }`}
            />
            {isEgyptSelected && hasAttemptedNext && !listing.postalCode && (
              <p className="text-xs text-red-500 mt-1">
                {'Postal code is required for Egypt'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          {'Confirm address on map'}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          <Info className="w-3 h-3 inline mr-1" />
          {'Drag the pin or click on the map to adjust the location'}
        </p>
        <div className="h-80 bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200">
          {isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={15}
              options={{ ...mapOptions, draggable: !readOnly }}
              onClick={readOnly ? undefined : handleMapClick}
            >
              <Marker
                position={mapCenter}
                draggable={!readOnly}
                onDragEnd={readOnly ? undefined : handleMarkerDragEnd}
                animation={google.maps.Animation.DROP}
              />
            </GoogleMap>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg animate-pulse">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <p className="text-gray-600 font-medium">{'Loading map...'}</p>
              </div>
            </div>
          )}
        </div>
        {listing.street && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <span>
              {'Location'}: {listing.street},{' '}
              {cities.find((c: any) => String(c.id) === String(listing.city))
                ?.name || ''}{' '}
              {states.find((s: any) => String(s.id) === String(listing.state))
                ?.name || ''}{' '}
              {countries.find((c) => String(c.id) === String(listing.country))
                ?.name || ''}
            </span>
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {'Coordinates'}: {listing.latitude.toFixed(6)},{' '}
          {listing.longitude.toFixed(6)}
        </p>
      </div>
    </div>
  );
};
