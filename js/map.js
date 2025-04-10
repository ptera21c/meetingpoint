/**
 * Map Module
 * Handles Google Maps integration, geocoding, and midpoint calculation
 */

let map;
let markers = [];
let infoWindow;
let autocompletes = [];
let googleMaps;

/**
 * Initialize the Google Map
 * @param {Object} google - The Google Maps object
 */
export function initMap(google) {
    if (!google || !google.maps) {
        console.error("Google Maps object is not properly initialized");
        return;
    }

    googleMaps = google;
    
    // Default center (will be updated based on user input)
    const defaultCenter = { lat: -37.8136, lng: 144.9631 }; // Melbourne, Australia
    
    // Create a new map instance
    map = new googleMaps.maps.Map(document.getElementById('map'), {
        center: defaultCenter,
        zoom: 12,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        mapTypeControlOptions: {
            style: googleMaps.maps.MapTypeControlStyle.DROPDOWN_MENU
        }
    });
    
    // Create a single info window to be reused for markers
    infoWindow = new googleMaps.maps.InfoWindow();
    
    // Initialize the Places service
    PlacesService.init(map);
    
    // Initialize autocomplete for existing address inputs
    initAutocompleteForAddressInputs();
}

/**
 * Initialize autocomplete for all address input fields
 */
function initAutocompleteForAddressInputs() {
    const addressInputs = document.querySelectorAll('.address');
    addressInputs.forEach(input => {
        if (!input.dataset.hasAutocomplete) {
            MapManager.initAutocomplete(input);
        }
    });
}

/**
 * Map Manager Module
 * Handles map operations and calculations
 */
export const MapManager = (function() {
    /**
     * Initialize Google Places Autocomplete for an input field
     * @param {HTMLElement} inputElement - The input element to attach autocomplete to
     */
    function initAutocomplete(inputElement) {
        // Skip if already initialized
        if (inputElement.dataset.hasAutocomplete) return;
        
        // Set options for autocomplete (bias towards Australia)
        const options = {
            types: ['address'],
            componentRestrictions: { country: 'au' } // Restrict to Australia, remove or change as needed
        };
        
        // Create the autocomplete instance
        const autocomplete = new googleMaps.maps.places.Autocomplete(inputElement, options);
        
        // Store the autocomplete instance
        autocompletes.push(autocomplete);
        
        // Mark the input as having autocomplete
        inputElement.dataset.hasAutocomplete = 'true';
        
        // Add place_changed event listener
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            // If the place has a geometry, update the input value with the formatted address
            if (place.geometry) {
                inputElement.value = place.formatted_address || place.name;
            }
        });
    }
    /**
     * Geocode an address to get coordinates
     * @param {string} address - The address to geocode
     * @returns {Promise} Promise resolving to coordinates {lat, lng}
     */
    function geocodeAddress(address) {
        return new Promise((resolve, reject) => {
            fetch(`http://localhost:3000/api/geocode?address=${encodeURIComponent(address)}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'OK' && data.results[0]) {
                    const result = data.results[0];
                    const location = result.geometry.location;
                    resolve({
                        lat: location.lat,
                        lng: location.lng,
                        formatted_address: result.formatted_address
                    });
                } else {
                    let errorMessage = `Geocoding failed for address: ${address}`;
                    if (data.error_message) {
                        errorMessage += `. ${data.error_message}`;
                    }
                    reject(new Error(errorMessage));
                }
            })
            .catch(error => {
                reject(new Error(`Geocoding request failed: ${error.message}`));
            });
    });
}
    
    
    /**
     * Calculate the midpoint between multiple coordinates
     * @param {Array} coordinates - Array of {lat, lng} objects
     * @returns {Object} Midpoint coordinates {lat, lng}
     */
    function calculateMidpoint(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            throw new Error('No coordinates provided');
        }
        
        // For a single coordinate, return it as is
        if (coordinates.length === 1) {
            return coordinates[0];
        }
        
        // Convert lat/lng to Cartesian coordinates
        const cartesianCoords = coordinates.map(coord => {
            const latRad = coord.lat * Math.PI / 180;
            const lngRad = coord.lng * Math.PI / 180;
            
            // Convert to Cartesian coordinates
            return {
                x: Math.cos(latRad) * Math.cos(lngRad),
                y: Math.cos(latRad) * Math.sin(lngRad),
                z: Math.sin(latRad)
            };
        });
        
        // Calculate the average of Cartesian coordinates
        const sumX = cartesianCoords.reduce((sum, coord) => sum + coord.x, 0);
        const sumY = cartesianCoords.reduce((sum, coord) => sum + coord.y, 0);
        const sumZ = cartesianCoords.reduce((sum, coord) => sum + coord.z, 0);
        
        const avgX = sumX / cartesianCoords.length;
        const avgY = sumY / cartesianCoords.length;
        const avgZ = sumZ / cartesianCoords.length;
        
        // Convert back to lat/lng
        const hyp = Math.sqrt(avgX * avgX + avgY * avgY);
        const lng = Math.atan2(avgY, avgX) * 180 / Math.PI;
        const lat = Math.atan2(avgZ, hyp) * 180 / Math.PI;
        
        return { lat, lng };
    }
    
    /**
     * Clear all markers from the map
     */
    function clearMarkers() {
        markers.forEach(marker => marker.setMap(null));
        markers = [];
    }
    
    /**
     * Add a marker to the map
     * @param {Object} position - The position {lat, lng} for the marker
     * @param {string} title - The title for the marker
     * @param {string} icon - Optional icon URL
     * @returns {Object} The created marker
     */
    function addMarker(position, title, icon = null) {
        const markerOptions = {
            position,
            map,
            title,
            animation: googleMaps.maps.Animation.DROP
        };
        
        if (icon) {
            markerOptions.icon = {
                url: icon,
                scaledSize: new googleMaps.maps.Size(30, 30)
            };
        }
        
        const marker = new googleMaps.maps.Marker(markerOptions);
        markers.push(marker);
        
        return marker;
    }
    
    /**
     * Add an address marker to the map
     * @param {Object} position - The position {lat, lng} for the marker
     * @param {string} address - The formatted address
     */
    function addAddressMarker(position, address) {
        const marker = addMarker(
            position, 
            address,
            'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        );
        
        // Add click listener to show info window
        marker.addListener('click', () => {
            infoWindow.setContent(`<div><strong>Address:</strong> ${address}</div>`);
            infoWindow.open(map, marker);
        });
        
        return marker;
    }
    
    /**
     * Add a midpoint marker to the map
     * @param {Object} position - The position {lat, lng} for the marker
     */
    function addMidpointMarker(position) {
        const marker = addMarker(
            position, 
            'Midpoint',
            'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        );
        
        // Add click listener to show info window
        marker.addListener('click', () => {
            infoWindow.setContent('<div><strong>Midpoint</strong><br>Calculated center point</div>');
            infoWindow.open(map, marker);
        });
        
        return marker;
    }
    
    /**
     * Add a venue marker to the map
     * @param {Object} venue - The venue object from Places API
     */
    function addVenueMarker(venue) {
        const position = {
            lat: venue.geometry.location.lat(),
            lng: venue.geometry.location.lng()
        };
        
        const marker = addMarker(
            position, 
            venue.name,
            'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        );
        
        // Create info window content
        const content = `
            <div class="info-window">
                <h3>${venue.name}</h3>
                <div>${venue.vicinity || venue.formatted_address || ''}</div>
                ${venue.rating ? `<div>Rating: ${venue.rating} ⭐</div>` : ''}
                ${venue.price_level ? `<div>Price: ${getPrice(venue.price_level)}</div>` : ''}
                ${venue.opening_hours ? (venue.opening_hours.open_now ? '<div>Open now</div>' : '<div>Closed</div>') : ''}
            </div>
        `;
        
        // Add click listener to show info window
        marker.addListener('click', () => {
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        });
        
        return marker;
    }
    
    /**
     * Get price level representation
     * @param {number} level - Price level (1-4)
     * @returns {string} Price representation as $, $$, $$$, or $$$$
     */
    function getPrice(level) {
        return '$'.repeat(level);
    }
    
    /**
     * Fit map bounds to include all markers
     */
    function fitMapToMarkers() {
        if (markers.length === 0) return;
        
        const bounds = new googleMaps.maps.LatLngBounds();
        
        markers.forEach(marker => {
            bounds.extend(marker.getPosition());
        });
        
        map.fitBounds(bounds);
        
        // If zoom is too close, zoom out a bit
        const listener = googleMaps.maps.event.addListener(map, 'idle', () => {
            if (map.getZoom() > 16) {
                map.setZoom(16);
            }
            googleMaps.maps.event.removeListener(listener);
        });
    }
    
    // Public API
    return {
        geocodeAddress,
        calculateMidpoint,
        clearMarkers,
        addMarker,
        addAddressMarker,
        addMidpointMarker,
        addVenueMarker,
        fitMapToMarkers,
        initAutocomplete
    };
})();
