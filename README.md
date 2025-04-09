# Meeting Point Finder

A web application that helps users find the perfect meeting place between multiple addresses. The app calculates a central point between all provided addresses and recommends venues based on the selected meetup type (coffee, dinner, brunch, etc.).

## Features

- Enter 2 or more addresses to find a central meeting point
- Google Places Autocomplete for address inputs to ensure accurate addresses
- Select from various meetup types (coffee, brunch, lunch, dinner, drinks, dessert, shopping, parks)
- View recommended venues near the midpoint on a map and in a list
- Save favorite meeting places for future reference
- Responsive design that works on both desktop and mobile devices

## Setup Instructions

1. **Clone or download this repository**

2. **Get a Google Maps API Key**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Navigate to APIs & Services > Library
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - Create an API key under APIs & Services > Credentials
   - Restrict the API key to the APIs mentioned above for security
   - Make sure billing is enabled for your Google Cloud project (required for the APIs to work)
   - If you're getting a "REQUEST_DENIED" error, check that all the above steps are completed correctly

3. **Generate a favicon (optional)**
   - Open the `favicon.html` file in a web browser
   - Click the "Generate Favicon" button
   - Right-click on the generated icon and select "Save Image As..."
   - Save the file as "favicon.ico" in the root directory of the application

4. **Add your API Key to the application**
   - Open `index.html` in a text editor
   - Find the Google Maps script tag near the bottom of the file
   - Replace `YOUR_API_KEY` with your actual API key:
     ```html
     <script async defer
         src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places&callback=initMap">
     </script>
     ```

5. **Open the application**
   - Simply open the `index.html` file in a web browser
   - No server setup is required as this is a client-side application

## How to Use

1. Enter at least two addresses in the address input fields (use the autocomplete suggestions for accurate results)
2. Click "+ Add Another Address" if you need to add more than two addresses
3. Select a meetup type from the dropdown menu
4. Click "Find Meeting Places" to calculate the midpoint and find venues
5. View the results on the map and in the recommended places section
6. Click on markers or venue cards to see more details
7. Add places to your favorites by clicking the "Add to Favorites" button
8. View and manage your saved favorites in the Favorites section

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses the Google Maps JavaScript API for mapping and geocoding
- Uses the Google Places API for finding venues and address autocomplete
- Stores favorites in the browser's local storage
- Responsive design using CSS Grid and Flexbox
- Implements the geocentric midpoint calculation algorithm for finding the central point between multiple coordinates

## License

This project is open source and available under the [MIT License](LICENSE).
