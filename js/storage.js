/**
 * Storage Module
 * Handles saving and retrieving data from local storage
 */

const StorageManager = (function() {
    // Key for storing favorites in local storage
    const FAVORITES_KEY = 'meeting_point_finder_favorites';
    
    /**
     * Get all saved favorites from local storage
     * @returns {Array} Array of favorite venues
     */
    function getFavorites() {
        const favoritesJson = localStorage.getItem(FAVORITES_KEY);
        return favoritesJson ? JSON.parse(favoritesJson) : [];
    }
    
    /**
     * Save a venue to favorites
     * @param {Object} venue - The venue object to save
     * @returns {boolean} True if saved successfully
     */
    function addFavorite(venue) {
        try {
            const favorites = getFavorites();
            
            // Check if venue is already in favorites
            const existingIndex = favorites.findIndex(fav => fav.place_id === venue.place_id);
            
            if (existingIndex >= 0) {
                return false; // Already exists
            }
            
            // Add venue to favorites
            favorites.push(venue);
            
            // Save to local storage
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
            return true;
        } catch (error) {
            console.error('Error saving favorite:', error);
            return false;
        }
    }
    
    /**
     * Remove a venue from favorites
     * @param {string} placeId - The place_id of the venue to remove
     * @returns {boolean} True if removed successfully
     */
    function removeFavorite(placeId) {
        try {
            const favorites = getFavorites();
            
            // Filter out the venue with the matching place_id
            const updatedFavorites = favorites.filter(venue => venue.place_id !== placeId);
            
            // If no change in length, venue wasn't found
            if (updatedFavorites.length === favorites.length) {
                return false;
            }
            
            // Save updated favorites to local storage
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
            return true;
        } catch (error) {
            console.error('Error removing favorite:', error);
            return false;
        }
    }
    
    /**
     * Check if a venue is in favorites
     * @param {string} placeId - The place_id to check
     * @returns {boolean} True if the venue is in favorites
     */
    function isFavorite(placeId) {
        const favorites = getFavorites();
        return favorites.some(venue => venue.place_id === placeId);
    }
    
    /**
     * Clear all favorites
     * @returns {boolean} True if cleared successfully
     */
    function clearFavorites() {
        try {
            localStorage.removeItem(FAVORITES_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing favorites:', error);
            return false;
        }
    }
    
    // Public API
    return {
        getFavorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        clearFavorites
    };
})();
