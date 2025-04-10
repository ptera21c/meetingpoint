// maps-loader.js
import { Loader } from "https://unpkg.com/@googlemaps/js-api-loader@1.15.1/dist/index.esm.js";

export async function initializeGoogleMaps() {
    try {
        // Fetch the API key from your backend proxy
        const response = await fetch('http://localhost:5000/api/maps-api-key');
        const data = await response.json();
        const apiKey = data.apiKey;

        if (!apiKey) throw new Error("API key not found");

        const loader = new Loader({
            apiKey: apiKey,
            version: "weekly",
            libraries: ["places"]
        });

        const google = await loader.load();
        console.log("Google Maps loaded successfully");
        return google;
    } catch (error) {
        console.error("Failed to load Google Maps:", error);
        throw error;
    }
}
