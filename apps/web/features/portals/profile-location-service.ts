import 'server-only';
import { City, State } from 'country-state-city';

export type LocationOption = { value: string; label: string };

function options(names: string[]): LocationOption[] {
  return [...new Set(names)]
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((name) => ({ value: name, label: name }));
}

export function getProfileStates(): LocationOption[] {
  const states = State.getStatesOfCountry('IN');
  if (!states.length) throw new Error('India state catalogue is unavailable');
  return options(states.map((state) => state.name));
}

export function getProfileCities(stateName: string): LocationOption[] {
  const state = State.getStatesOfCountry('IN').find((item) => item.name === stateName);
  if (!state) throw new Error('Unknown profile state');
  return options(City.getCitiesOfState('IN', state.isoCode).map((city) => city.name));
}
