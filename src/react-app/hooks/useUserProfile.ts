import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserProfile } from '@/shared/types';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedUserId, setLastFetchedUserId] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLastFetchedUserId(null);
      return;
    }
    
    // Avoid refetching for the same user
    if (lastFetchedUserId === user.id && profile) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user-profiles/me', {
        headers: {
          'Cache-Control': 'max-age=300' // Cache for 5 minutes
        }
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setLastFetchedUserId(user.id);
      } else if (response.status === 404) {
        setProfile(null);
        setLastFetchedUserId(user.id);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      setError('Failed to fetch profile');
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, lastFetchedUserId, profile]);

  const createProfile = useCallback(async (data: { role: 'interviewer' | 'admin'; name: string; phone?: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/user-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const newProfile = await response.json();
        setProfile(newProfile);
        if (user) {
          setLastFetchedUserId(user.id);
        }
        return newProfile;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    profile,
    isLoading,
    error,
    fetchProfile,
    createProfile,
    refetch: fetchProfile,
  }), [profile, isLoading, error, fetchProfile, createProfile]);
}
