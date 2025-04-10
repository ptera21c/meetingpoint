/**
 * Places Module
 * Handles Google Places API integration for finding venues
 */

const PlacesService = (function() {
    let placesService;
    let apiKey = null;
    
    /**
     * Initialize the Places service
     * @param {Object} map - Google Maps instance
     */
    function init(map) {
        placesService = new google.maps.places.PlacesService(map);
        // Get the API key from our server
        fetch('http://localhost:5000/api/maps-api-key')
            .then(response => response.json())
            .then(data => {
                apiKey = data.apiKey;
            })
            .catch(error => {
                console.error('Failed to get API key:', error);
            });
    }
    
    /**
     * Map meetup types to Google Places types
     * @param {string} meetupType - The selected meetup type
     * @returns {Object} Search parameters for the Places API
     */
    function getMeetupTypeParams(meetupType) {
        const typeMap = {
            coffee: {
                type: 'cafe',
                keyword: 'coffee',
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: 1500
            },
            brunch: {
                type: 'restaurant',
                keyword: 'brunch breakfast',
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: 1500
            },
            lunch: {
                type: 'restaurant',
                keyword: 'lunch',
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: 1500
            },
            dinner: {
                type: 'restaurant',
                keyword: 'dinner',
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: 1500
            },
            bar: {
                type: 'bar',
                keyword: 'drinks',
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: 1500
            },
            dessert: {
                type: 'cafe',
                keyword: 'dessert ice cream',
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: 1500
            },
            shopping: {
                type: 'shopping_mall',
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: 2000
            },
            park: {
                type: 'park',
                rankBy: google.maps.places.RankBy.PROMINENCE,
                radius: 2000
            }
        };
        
        return typeMap[meetupType] || {
            type: 'restaurant',
            rankBy: google.maps.places.RankBy.PROMINENCE,
            radius: 1500
        };
    }
    
    /**
     * Search for places near a location
     * @param {Object} location - The location {lat, lng} to search near
     * @param {string} meetupType - The type of meetup
     * @returns {Promise} Promise resolving to an array of places
     */
    function searchPlaces(location, meetupType) {
        return new Promise((resolve, reject) => {
            const params = getMeetupTypeParams(meetupType);
            
             // Build query string
            const queryParams = new URLSearchParams({
                location: `${location.lat},${location.lng}`,
                radius: params.radius || 1500,
                type: params.type || '',
                keyword: params.keyword || ''
            }).toString();


            // Call your proxy server
        fetch(`http://localhost:3000/api/places/nearby?${queryParams}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'OK' && data.results) {
                    // Convert the results to match the format expected by your app
                    const places = data.results.map(place => {
                        // Transform the place object to match what your app expects
                        return {
                            ...place,
                            geometry: {
                                ...place.geometry,
                                location: {
                                    lat: () => place.geometry.location.lat,
                                    lng: () => place.geometry.location.lng
                                }
                            }
                        };
                    });
                    resolve(places);
                } else {
                    reject(new Error(`Places search failed. Status: ${data.status}`));
                }
            })
            .catch(error => {
                reject(new Error(`Places request failed: ${error.message}`));
            });
    });
}
    
    /**
     * Get details for a specific place
     * @param {string} placeId - The place ID
     * @returns {Promise} Promise resolving to place details
     */
    function getPlaceDetails(placeId) {
        return new Promise((resolve, reject) => {
            if (!placesService) {
                reject(new Error('Places service not initialized'));
                return;
            }
            
            const request = {
                placeId,
                fields: [
                    'name', 'place_id', 'formatted_address', 'geometry', 'rating',
                    'photos', 'vicinity', 'website', 'formatted_phone_number',
                    'opening_hours', 'price_level', 'types', 'url'
                ]
            };
            
            placesService.getDetails(request, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    resolve(place);
                } else {
                    reject(new Error(`Place details request failed. Status: ${status}`));
                }
            });
        });
    }
    
    /**
     * Get a photo URL for a place
     * @param {Object} photo - Google Places photo object
     * @param {number} maxWidth - Maximum width for the photo
     * @returns {string} URL for the photo
     */
    function getPhotoUrl(photo, maxWidth = 400) {
        if (!photo) return null;
        
        // If the photo object has a getUrl method (direct from Places API)
        if (typeof photo.getUrl === 'function') {
            return photo.getUrl({ maxWidth });
        }
        
        // If we have a photo reference (from our proxy)
        if (photo.photo_reference && apiKey) {
            return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photo.photo_reference}&key=${apiKey}`;
        }
        
        return null;
    }
    
    /**
     * Format a place type for display
     * @param {string} type - The place type from Google Places API
     * @returns {string} Formatted type for display
     */
    function formatPlaceType(type) {
        // Replace underscores with spaces and capitalize each word
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
    }
    
    /**
     * Get the primary type of a place for display
     * @param {Array} types - Array of place types
     * @returns {string} Primary type for display
     */
    function getPrimaryType(types) {
        if (!types || types.length === 0) return '';
        
        // Priority list of types to display
        const priorityTypes = [
            'cafe', 'restaurant', 'bar', 'bakery', 'food',
            'shopping_mall', 'store', 'park', 'museum', 'art_gallery'
        ];
        
        // Find the first type that matches our priority list
        for (const priorityType of priorityTypes) {
            if (types.includes(priorityType)) {
                return formatPlaceType(priorityType);
            }
        }
        
        // If no priority type is found, use the first non-generic type
        const genericTypes = ['point_of_interest', 'establishment', 'premise', 'political'];
        for (const type of types) {
            if (!genericTypes.includes(type)) {
                return formatPlaceType(type);
            }
        }
        
        // Fallback to the first type
        return formatPlaceType(types[0]);
    }
    
    // Public API
    return {
        init,
        searchPlaces,
        getPlaceDetails,
        getPhotoUrl,
        getPrimaryType
    };
})();
