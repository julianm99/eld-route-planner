import axios from 'axios';

const API_KEY="eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6Ijg5NjYzM2I3MzNlMTRjMThhYjIzY2ViYjIzMjM2MDRkIiwiaCI6Im11cm11cjY0In0="

export async function getRoute(coordinates) {
    const response = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-hgv/geojson",
        {
            coordinates: coordinates
        },
        {
            headers: {
                Authorization:API_KEY,
                "Content-Type": "application/json"
            }
        }
    );
    return response.data;
}