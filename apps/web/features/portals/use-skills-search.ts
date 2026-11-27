'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import type { JobSeekerSkillsResponse } from '@repo/contracts';
import { searchSkillsAction } from './portal-actions';
import { runPortalAction } from './portal-client';

const useSkillsSearchStore = create<{
  search: string; page: number; setSearch: (value: string) => void; setPage: (page: number) => void;
}>((set) => ({
  search: '', page: 1,
  setSearch: (search) => set({ search, page: 1 }),
  setPage: (page) => set({ page }),
}));

export function useSkillsSearch(initialData: JobSeekerSkillsResponse) {
  const state = useSkillsSearchStore();
  const [search, setSearch] = useState(state.search);
  useEffect(() => {
    const timer = setTimeout(() => setSearch(state.search.trim()), 300);
    return () => clearTimeout(timer);
  }, [state.search]);
  const query = useQuery({
    queryKey: ['portal', 'skills', search, state.page],
    queryFn: () => runPortalAction(() => searchSkillsAction({
      page: state.page, pageSize: 25, ...(search ? { search } : {}),
    })),
    initialData: !search && state.page === 1 ? initialData : undefined,
    staleTime: 30_000,
    retry: false,
  });
  return { ...state, query };
}
