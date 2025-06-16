export async function reverseGeocode(lat: string, lon: string): Promise<string> {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );

    if (!response.ok) {
        throw new Error("Failed to reverse geocode");
    }

    const data = await response.json();
    return data.display_name;
}