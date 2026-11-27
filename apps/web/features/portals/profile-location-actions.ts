'use server';

import {
  getProfileCities,
  getProfileStates,
  type LocationOption,
} from './profile-location-service';

type LocationResult = { ok: true; options: LocationOption[] } | { ok: false };

export async function loadProfileStatesAction(): Promise<LocationResult> {
  try {
    return { ok: true, options: getProfileStates() };
  } catch (error) {
    console.error('Profile state catalogue failed', error);
    return { ok: false };
  }
}

export async function loadProfileCitiesAction(stateName: string): Promise<LocationResult> {
  try {
    return { ok: true, options: getProfileCities(stateName) };
  } catch (error) {
    console.error('Profile city catalogue failed', error);
    return { ok: false };
  }
}
