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

3. **Set up the Proxy Server (for API key security)**
   - Navigate to the proxy server directory:
     ```
     cd meeting-point-finder-proxy
     ```
   - Install dependencies:
     ```
     npm install
     ```
   - Create a `.env` file with your Google Maps API key:
     ```
     GOOGLE_MAPS_API_KEY=your_actual_api_key_here
     PORT=3000
     ```
   - Start the proxy server:
     ```
     node server.js
     ```
   - For more details, see the [Proxy Server README](../meeting-point-finder-proxy/README.md)

4. **Generate a favicon (optional)**
   - Open the `favicon.html` file in a web browser
   - Click the "Generate Favicon" button
   - Right-click on the generated icon and select "Save Image As..."
   - Save the file as "favicon.ico" in the root directory of the application

5. **Set up the Frontend Server**
   - Navigate to the main application directory:
     ```
     cd meeting-point-finder
     ```
   - Install dependencies:
     ```
     npm install
     ```
   - Start the frontend server:
     ```
     npm start
     ```
   - The server will start at http://localhost:5000
   - Open your browser to http://localhost:5000 to view the application
   - Make sure the proxy server is also running (step 3)
   - The application will fetch the API key securely from the proxy server

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
- Implements a secure proxy server to protect the Google Maps API key
- Stores favorites in the browser's local storage
- Responsive design using CSS Grid and Flexbox
- Implements the geocentric midpoint calculation algorithm for finding the central point between multiple coordinates

## Security Features

- **API Key Protection**: The Google Maps API key is stored securely on the server side
- **Proxy Server**: All requests to Google APIs are routed through a proxy server
- **Dynamic Loading**: The Google Maps JavaScript API is loaded dynamically with the key from the proxy server
- **Module Architecture**: Uses ES modules for better code organization and security

## Deployment

### Frontend Deployment
- The frontend can be deployed to any static hosting service (GitHub Pages, Netlify, Vercel, etc.)
- Update the proxy server URLs in the JavaScript files to point to your deployed proxy server

### Proxy Server Deployment
- The proxy server can be deployed to a Node.js hosting service (Heroku, Vercel, AWS, etc.)
- Set the `GOOGLE_MAPS_API_KEY` environment variable on your hosting service
- Update the CORS settings in `server.js` to allow requests from your frontend domain

## License

This project is open source and available under the [MIT License](LICENSE).
