import { useState } from 'react';

interface LocalStorageFavorite {
  symbol: string;
  name: string;
}

export function useFavoritesMigration() {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');

  const migrateFromLocalStorage = async () => {
    try {
      setMigrationStatus('migrating');
      
      // Get favorites from localStorage
      const storedFavorites = localStorage.getItem('favorites');
      if (!storedFavorites) {
        setMigrationStatus('completed');
        return;
      }

      const localFavorites: LocalStorageFavorite[] = JSON.parse(storedFavorites);
      
      // Migrate each favorite to the database
      for (const favorite of localFavorites) {
        try {
          await fetch('/api/favorites', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              symbol: favorite.symbol,
              name: favorite.name,
            }),
          });
        } catch (error) {
          console.warn('Failed to migrate favorite:', favorite.symbol, error);
        }
      }

      // Clear localStorage after successful migration
      localStorage.removeItem('favorites');
      setMigrationStatus('completed');
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus('error');
    }
  };

  return {
    migrationStatus,
    migrateFromLocalStorage,
  };
}
