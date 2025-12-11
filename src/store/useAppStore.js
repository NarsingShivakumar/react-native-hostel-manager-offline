import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // App Settings
      settings: {
        reminderDaysBefore: 3,
        currency: 'INR',
        dateFormat: 'dd MMM yyyy',
        theme: 'light',
      },
      
      // Filters
      guestFilter: 'all', // all, active, inactive, overdue
      paymentFilter: 'all', // all, paid, pending
      
      // Search
      searchQuery: '',
      
      // Update settings
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      
      // Update filters
      setGuestFilter: (filter) => set({ guestFilter: filter }),
      setPaymentFilter: (filter) => set({ paymentFilter: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Reset all
      reset: () =>
        set({
          guestFilter: 'all',
          paymentFilter: 'all',
          searchQuery: '',
        }),
    }),
    {
      name: 'pg-manager-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
