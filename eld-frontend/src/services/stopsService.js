export async function getStops(routePoints) {

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/api/stops/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          points: routePoints
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status}`
      );
    }

    const data = await response.json();

    return {

      fuelStops:
        data.fuelStops?.map((station) => ({
          id: station.id,
          lat: Number(
            station.center?.lat ??
            station.lat
          ),
          lon: Number(
            station.center?.lon ??
            station.lon
          ),
          name:
            station.tags?.name ??
            "Fuel Station"
        })) || [],

      restStops:
        data.restStops?.map((stop) => ({
          id: stop.id,
          lat: Number(
            stop.center?.lat ??
            stop.lat
          ),
          lon: Number(
            stop.center?.lon ??
            stop.lon
          ),
          name:
            stop.tags?.name ??
            "Rest Area"
        })) || []
    };

  } catch (error) {

    console.error(
      "Error fetching stops:",
      error
    );

    return {
      fuelStops: [],
      restStops: []
    };
  }
}