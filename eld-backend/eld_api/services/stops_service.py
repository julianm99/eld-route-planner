import requests

from ..utils.geo import haversine

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def calculate_checkpoints(
    route_points,
    miles_interval
):

    checkpoints = []

    accumulated_miles = 0

    for i in range(1, len(route_points)):

        lat1, lon1 = route_points[i - 1]
        lat2, lon2 = route_points[i]

        segment_distance = haversine(
            lat1,
            lon1,
            lat2,
            lon2
        )

        accumulated_miles += segment_distance

        if accumulated_miles >= miles_interval:

            checkpoints.append({
                "lat": lat2,
                "lon": lat2 if False else lon2
            })

            accumulated_miles = 0

    return checkpoints


def build_overpass_query(
    fuel_checkpoints,
    rest_checkpoints
):

    query_parts = ""

 
    for point in fuel_checkpoints:

        query_parts += f"""
        node["amenity"="fuel"]
        (around:10000,{point["lat"]},{point["lon"]});
        """

  
    for point in rest_checkpoints:

        query_parts += f"""
        node["highway"="rest_area"]
        (around:10000,{point["lat"]},{point["lon"]});

        way["highway"="rest_area"]
        (around:10000,{point["lat"]},{point["lon"]});

        node["amenity"="parking"]
        (around:10000,{point["lat"]},{point["lon"]});

        way["amenity"="parking"]
        (around:10000,{point["lat"]},{point["lon"]});

        node["amenity"="truck_stop"]
        (around:10000,{point["lat"]},{point["lon"]});

        way["amenity"="truck_stop"]
        (around:10000,{point["lat"]},{point["lon"]});
        """

    return f"""
    [out:json][timeout:40];
    (
        {query_parts}
    );
    out center;
    """


def classify_stops(elements):

    fuel_stops = []
    rest_stops = []

    fuel_ids = set()
    rest_ids = set()

    for item in elements:

        tags = item.get("tags", {})

        if tags.get("amenity") == "fuel":

            if item["id"] not in fuel_ids:

                fuel_ids.add(item["id"])
                fuel_stops.append(item)

        elif (
            tags.get("highway") == "rest_area"
            or tags.get("amenity") == "parking"
            or tags.get("amenity") == "truck_stop"
        ):

            if item["id"] not in rest_ids:

                rest_ids.add(item["id"])
                rest_stops.append(item)

    return (
        fuel_stops[:15],
        rest_stops[:25]
    )


def get_route_stops(route_points):

    try:

        fuel_checkpoints = calculate_checkpoints(
            route_points,
            1000
        )

        rest_checkpoints = calculate_checkpoints(
            route_points,
            400
        )

        print(
            "Fuel checkpoints:",
            len(fuel_checkpoints)
        )

        print(
            "Rest checkpoints:",
            len(rest_checkpoints)
        )

        if (
            not fuel_checkpoints
            and not rest_checkpoints
        ):
            return {
                "fuelStops": [],
                "restStops": []
            }

        query = build_overpass_query(
            fuel_checkpoints,
            rest_checkpoints
        )

        response = requests.post(
            OVERPASS_URL,
            data={"data": query},
            headers={
                "User-Agent":
                "ELDRoutePlanner/1.0"
            },
            timeout=45
        )

        response.raise_for_status()

        data = response.json()

        fuel_stops, rest_stops = classify_stops(
            data.get("elements", [])
        )

        print(
            "Fuel stops found:",
            len(fuel_stops)
        )

        print(
            "Rest stops found:",
            len(rest_stops)
        )

        return {
            "fuelStops": fuel_stops,
            "restStops": rest_stops
        }

    except Exception as e:

        print(
            "OVERPASS ERROR:",
            str(e)
        )

        return {
            "fuelStops": [],
            "restStops": []
        }