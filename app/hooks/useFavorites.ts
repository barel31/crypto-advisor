import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Favorite {
  id: string;
  symbol: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// API functions
const fetchFavorites = async (): Promise<Favorite[]> => {
  const response = await fetch('/api/favorites');
  if (!response.ok) {
    throw new Error('Failed to fetch favorites');
  }
  return response.json();
};

const addFavorite = async ({ symbol, name }: { symbol: string; name: string }): Promise<Favorite> => {
  const response = await fetch('/api/favorites', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbol, name }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add favorite');
  }
  
  return response.json();
};

const removeFavorite = async (symbol: string): Promise<void> => {
  const response = await fetch(`/api/favorites?symbol=${encodeURIComponent(symbol)}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove favorite');
  }
};

export function useFavorites() {
  const queryClient = useQueryClient();
  
  // Fetch favorites with React Query
  const {
    data: favorites = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavorites,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: addFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error) => {
      console.error('Error adding favorite:', error);
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error) => {
      console.error('Error removing favorite:', error);
    },
  });

  // Toggle favorite function
  const toggleFavorite = async (symbol: string, name: string) => {
    const exists = favorites.some((fav) => fav.symbol === symbol.toUpperCase());
    
    if (exists) {
      await removeFavoriteMutation.mutateAsync(symbol);
    } else {
      await addFavoriteMutation.mutateAsync({ symbol, name });
    }
  };

  // Check if a symbol is favorited
  const isFavorite = (symbol: string) => {
    return favorites.some((fav) => fav.symbol === symbol.toUpperCase());
  };

  return {
    favorites: favorites.map(fav => ({ symbol: fav.symbol, name: fav.symbol })), // Maintain backward compatibility
    toggleFavorite,
    isFavorite,
    isLoading,
    error,
    isAdding: addFavoriteMutation.isPending,
    isRemoving: removeFavoriteMutation.isPending,
  };
}
