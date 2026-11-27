'use client';

import { useQuery } from '@tanstack/react-query';
import { loadProfileCitiesAction, loadProfileStatesAction } from './profile-location-actions';

export function useProfileLocations(stateName: string) {
  const states = useQuery({
    queryKey: ['locations', 'IN', 'states'],
    queryFn: async () => {
      const result = await loadProfileStatesAction();
      if (!result.ok) throw new Error('Profile state catalogue failed');
      return result.options;
    },
    staleTime: Infinity,
    retry: false,
  });
  const cities = useQuery({
    queryKey: ['locations', 'IN', 'cities', stateName],
    queryFn: async () => {
      const result = await loadProfileCitiesAction(stateName);
      if (!result.ok) throw new Error('Profile city catalogue failed');
      return result.options;
    },
    enabled: !!stateName && !!states.data?.some((option) => option.value === stateName),
    staleTime: Infinity,
    retry: false,
  });
  return { states, cities };
}
