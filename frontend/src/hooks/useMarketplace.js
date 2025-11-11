import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketplaceService } from "@/services/marketplace.service";

/**
 * Custom hook for fetching marketplace listings
 */
export const useMarketplaceListings = (filters = {}) => {
  return useQuery({
    queryKey: ["marketplace", "listings", filters],
    queryFn: () => marketplaceService.getListings(filters),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Custom hook for fetching a single marketplace listing
 */
export const useMarketplaceListing = (id) => {
  return useQuery({
    queryKey: ["marketplace", "listing", id],
    queryFn: () => marketplaceService.getListingById(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Custom hook for creating a marketplace listing
 */
export const useCreateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingData) => marketplaceService.createListing(listingData),
    onSuccess: () => {
      // Invalidate and refetch listings
      queryClient.invalidateQueries({ queryKey: ["marketplace", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "my-listings"] });
    },
  });
};

/**
 * Custom hook for updating a marketplace listing
 */
export const useUpdateListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => marketplaceService.updateListing(id, data),
    onSuccess: (_, variables) => {
      // Update specific listing cache
      queryClient.invalidateQueries({ 
        queryKey: ["marketplace", "listing", variables.id] 
      });
      // Invalidate listings cache
      queryClient.invalidateQueries({ queryKey: ["marketplace", "listings"] });
    },
  });
};

/**
 * Custom hook for deleting a marketplace listing
 */
export const useDeleteListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => marketplaceService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "my-listings"] });
    },
  });
};

/**
 * Custom hook for searching marketplace listings
 */
export const useSearchListings = (query, filters = {}, enabled = true) => {
  return useQuery({
    queryKey: ["marketplace", "search", query, filters],
    queryFn: () => marketplaceService.searchListings(query, filters),
    enabled: enabled && !!query,
    staleTime: 30000,
  });
};

/**
 * Custom hook for fetching my listings (seller)
 */
export const useMyListings = () => {
  return useQuery({
    queryKey: ["marketplace", "my-listings"],
    queryFn: () => marketplaceService.getMyListings(),
    staleTime: 60000, // 1 minute
  });
};