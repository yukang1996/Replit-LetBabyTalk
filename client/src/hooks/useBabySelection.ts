
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface BabyProfile {
  id: number;
  name: string;
  dateOfBirth: string;
  gender: string;
  photoUrl?: string;
}

const SELECTED_BABY_KEY = 'selectedBabyId';

export function useBabySelection() {
  const [selectedBabyId, setSelectedBabyId] = useState<number | null>(() => {
    const stored = localStorage.getItem(SELECTED_BABY_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  const { data: profiles = [] } = useQuery<BabyProfile[]>({
    queryKey: ["/api/baby-profiles"],
  });

  const selectedBaby = profiles.find(profile => profile.id === selectedBabyId) || null;

  const selectBaby = (babyId: number | null) => {
    setSelectedBabyId(babyId);
    if (babyId) {
      localStorage.setItem(SELECTED_BABY_KEY, babyId.toString());
    } else {
      localStorage.removeItem(SELECTED_BABY_KEY);
    }
  };

  // Auto-select first baby if none selected and profiles exist
  useEffect(() => {
    if (!selectedBabyId && profiles.length > 0) {
      selectBaby(profiles[0].id);
    }
  }, [selectedBabyId, profiles]);

  // Clear selection if selected baby no longer exists
  useEffect(() => {
    if (selectedBabyId && profiles.length > 0 && !profiles.find(p => p.id === selectedBabyId)) {
      selectBaby(profiles.length > 0 ? profiles[0].id : null);
    }
  }, [selectedBabyId, profiles]);

  return {
    selectedBabyId,
    selectedBaby,
    selectBaby,
    profiles,
  };
}
