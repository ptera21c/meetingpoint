/**
 * Main Application Module
 * Handles the core application logic and UI interactions
 */

import { initializeGoogleMaps } from './maps-loader.js';
import { initMap, MapManager } from './map.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Google Maps first
        const google = await initializeGoogleMaps();
        
        // Initialize the map
        initMap(google);
        
        // DOM Elements
        const meetingForm = document.getElementById('meeting-form');
        const addressesContainer = document.getElementById('addresses-container');
        const addAddressBtn = document.getElementById('add-address');
        const meetupTypeSelect = document.getElementById('meetup-type');
        const resultsContainer = document.getElementById('results-container');
        const favoritesContainer = document.getElementById('favorites-container');
        
        // Templates
        const venueTemplate = document.getElementById('venue-template');
        const favoriteTemplate = document.getElementById('favorite-template');
        
        // State
        let addressCount = 2; // Start with 2 address fields
        let lastSearchResults = [];
        
        /**
         * Initialize the application
         */
        function init() {
            // Set up event listeners
            meetingForm.addEventListener('submit', handleFormSubmit);
            addAddressBtn.addEventListener('click', addAddressField);
            
            // Load and display favorites
            displayFavorites();
        }
        
        /**
         * Handle form submission
         * @param {Event} event - The submit event
         */
        async function handleFormSubmit(event) {
            event.preventDefault();
            
            // Show loading state
            toggleLoadingState(true);
            
            try {
                // Get all address inputs
                const addressInputs = document.querySelectorAll('.address');
                const addresses = Array.from(addressInputs)
                    .map(input => input.value.trim())
                    .filter(address => address !== '');
                
                // Validate inputs
                if (addresses.length < 2) {
                    throw new Error('Please enter at least two addresses');
                }
                
                const meetupType = meetupTypeSelect.value;
                if (!meetupType) {
                    throw new Error('Please select a meetup type');
                }
                
                // Clear previous results
                clearResults();
                MapManager.clearMarkers();
                
                // Geocode all addresses
                const geocodePromises = addresses.map(address => MapManager.geocodeAddress(address));
                const geocodedAddresses = await Promise.all(geocodePromises);
                
                // Add markers for each address
                geocodedAddresses.forEach(location => {
                    MapManager.addAddressMarker(location, location.formatted_address);
                });
                
                // Calculate midpoint
                const midpoint = MapManager.calculateMidpoint(geocodedAddresses);
                
                // Add midpoint marker
                MapManager.addMidpointMarker(midpoint);
                
                // Fit map to show all markers
                MapManager.fitMapToMarkers();
                
                // Search for places near the midpoint
                const places = await PlacesService.searchPlaces(midpoint, meetupType);
                
                // Store results for later use
                lastSearchResults = places;
                
                // Display results
                displayResults(places, meetupType);
                
            } catch (error) {
                showError(error.message);
            } finally {
                // Hide loading state
                toggleLoadingState(false);
            }
        }
        
        /**
         * Add a new address input field
         */
        function addAddressField() {
            addressCount++;
            
            const addressDiv = document.createElement('div');
            addressDiv.className = 'address-input';
            
            addressDiv.innerHTML = `
                <label for="address${addressCount}">Address ${addressCount}</label>
                <input type="text" id="address${addressCount}" class="address" placeholder="Enter an address" required>
            `;
            
            addressesContainer.appendChild(addressDiv);
            
            // Initialize autocomplete for the new address input
            const newInput = addressDiv.querySelector('.address');
            if (newInput && typeof MapManager !== 'undefined' && MapManager.initAutocomplete) {
                MapManager.initAutocomplete(newInput);
            }
        }
        
        /**
         * Display search results
         * @param {Array} places - Array of place objects
         * @param {string} meetupType - The selected meetup type
         */
        function displayResults(places, meetupType) {
            if (!places || places.length === 0) {
                resultsContainer.innerHTML = `<p>No ${meetupType} places found in this area. Try a different meetup type or location.</p>`;
                return;
            }
            
            // Clear previous results
            clearResults();
            
            // Display up to 10 places
            const placesToShow = places.slice(0, 10);
            
            placesToShow.forEach(place => {
                // Create venue card from template
                const venueCard = createVenueCard(place);
                
                // Add to results container
                resultsContainer.appendChild(venueCard);
                
                // Add marker to map
                MapManager.addVenueMarker(place);
            });
        }
        
        /**
         * Create a venue card from the template
         * @param {Object} place - The place object
         * @returns {HTMLElement} The venue card element
         */
        function createVenueCard(place) {
            // Clone the template
            const venueCard = document.importNode(venueTemplate.content, true).querySelector('.venue-card');
            
            // Set venue details
            const venueName = venueCard.querySelector('.venue-name');
            const venueRating = venueCard.querySelector('.venue-rating');
            const venueAddress = venueCard.querySelector('.venue-address');
            const venueType = venueCard.querySelector('.venue-type');
            const venueImage = venueCard.querySelector('.venue-image');
            const favoriteBtn = venueCard.querySelector('.btn-favorite');
            
            // Set content
            venueName.textContent = place.name;
            
            // Set rating with stars
            if (place.rating) {
                venueRating.textContent = `${place.rating} ⭐`;
            } else {
                venueRating.textContent = 'No ratings yet';
            }
            
            // Set address
            venueAddress.textContent = place.vicinity || place.formatted_address || '';
            
            // Set type
            venueType.textContent = PlacesService.getPrimaryType(place.types);
            
            // Set image if available
            if (place.photos && place.photos.length > 0) {
                const photoUrl = PlacesService.getPhotoUrl(place.photos[0]);
                if (photoUrl) {
                    venueImage.style.backgroundImage = `url(${photoUrl})`;
                } else {
                    // If photo URL is not available yet, try again after a short delay
                    setTimeout(() => {
                        const retryUrl = PlacesService.getPhotoUrl(place.photos[0]);
                        if (retryUrl) {
                            venueImage.style.backgroundImage = `url(${retryUrl})`;
                        } else {
                            venueImage.style.backgroundImage = 'url(https://via.placeholder.com/400x150?text=No+Image)';
                        }
                    }, 1000);
                    venueImage.style.backgroundImage = 'url(https://via.placeholder.com/400x150?text=Loading...)';
                }
            } else {
                venueImage.style.backgroundImage = 'url(https://via.placeholder.com/400x150?text=No+Image)';
            }
            
            // Set favorite button state
            if (StorageManager.isFavorite(place.place_id)) {
                favoriteBtn.textContent = 'Remove from Favorites';
                favoriteBtn.classList.add('active');
            }
            
            // Add favorite button event listener
            favoriteBtn.addEventListener('click', () => {
                toggleFavorite(place, favoriteBtn);
            });
            
            // Store place data in the card for later use
            venueCard.dataset.placeId = place.place_id;
            
            return venueCard;
        }
        
        /**
         * Toggle a place as favorite
         * @param {Object} place - The place object
         * @param {HTMLElement} button - The favorite button element
         */
        function toggleFavorite(place, button) {
            const isFav = StorageManager.isFavorite(place.place_id);
            
            if (isFav) {
                // Remove from favorites
                StorageManager.removeFavorite(place.place_id);
                button.textContent = 'Add to Favorites';
                button.classList.remove('active');
            } else {
                // Add to favorites
                StorageManager.addFavorite(place);
                button.textContent = 'Remove from Favorites';
                button.classList.add('active');
            }
            
            // Refresh favorites display
            displayFavorites();
        }
        
        /**
         * Display saved favorites
         */
        function displayFavorites() {
            // Clear favorites container
            favoritesContainer.innerHTML = '';
            
            // Get favorites from storage
            const favorites = StorageManager.getFavorites();
            
            if (favorites.length === 0) {
                favoritesContainer.innerHTML = '<p>No favorite places saved yet.</p>';
                return;
            }
            
            // Create and append favorite cards
            favorites.forEach(place => {
                const favoriteCard = createFavoriteCard(place);
                favoritesContainer.appendChild(favoriteCard);
            });
        }
        
        /**
         * Create a favorite card from the template
         * @param {Object} place - The place object
         * @returns {HTMLElement} The favorite card element
         */
        function createFavoriteCard(place) {
            // Clone the template
            const favoriteCard = document.importNode(favoriteTemplate.content, true).querySelector('.favorite-card');
            
            // Set favorite details
            const favoriteName = favoriteCard.querySelector('.favorite-name');
            const favoriteAddress = favoriteCard.querySelector('.favorite-address');
            const favoriteType = favoriteCard.querySelector('.favorite-type');
            const favoriteImage = favoriteCard.querySelector('.favorite-image');
            const removeBtn = favoriteCard.querySelector('.btn-remove');
            
            // Set content
            favoriteName.textContent = place.name;
            favoriteAddress.textContent = place.vicinity || place.formatted_address || '';
            favoriteType.textContent = PlacesService.getPrimaryType(place.types);
            
            // Set image if available
            if (place.photos && place.photos.length > 0) {
                const photoUrl = PlacesService.getPhotoUrl(place.photos[0]);
                favoriteImage.style.backgroundImage = `url(${photoUrl})`;
            } else {
                favoriteImage.style.backgroundImage = 'url(https://via.placeholder.com/400x150?text=No+Image)';
            }
            
            // Add remove button event listener
            removeBtn.addEventListener('click', () => {
                StorageManager.removeFavorite(place.place_id);
                displayFavorites();
                
                // Update any matching venue cards in the results
                const venueCard = document.querySelector(`.venue-card[data-place-id="${place.place_id}"]`);
                if (venueCard) {
                    const favoriteBtn = venueCard.querySelector('.btn-favorite');
                    favoriteBtn.textContent = 'Add to Favorites';
                    favoriteBtn.classList.remove('active');
                }
            });
            
            return favoriteCard;
        }
        
        /**
         * Clear the results container
         */
        function clearResults() {
            resultsContainer.innerHTML = '';
        }
        
        /**
         * Toggle loading state
         * @param {boolean} isLoading - Whether the app is in a loading state
         */
        function toggleLoadingState(isLoading) {
            const submitBtn = document.getElementById('find-places');
            
            if (isLoading) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Finding Places...';
                // Could add a loading spinner here
            } else {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Find Meeting Places';
            }
        }
        
        /**
         * Show an error message
         * @param {string} message - The error message to display
         */
        function showError(message) {
            // Clear results and show error
            clearResults();
            
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            
            resultsContainer.appendChild(errorElement);
        }
        
        // Initialize the app
        init();
    } catch (error) {
        console.error("Failed to initialize application:", error);
    }
});
