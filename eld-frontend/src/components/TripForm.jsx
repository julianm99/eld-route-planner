import { useState } from "react";
import { getCoordinates } from "../services/geocoding";
import { getRoute } from "../services/routeService";
import { getStops } from "../services/stopsService";
import LocationInput from "./LocationInput";


export default function TripForm({setRoute,setMarkers,setTripInfo,setFuelStops,setEldSheets,setRestStops}) {
  const [formData, setFormData] = useState({
    currentLocation: "",
    pickupLocation: "",
    dropoffLocation: "",
    cycleUsed: ""
  });

const [loading, setLoading] = useState(false);

const handleChange = (e) => {

  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

  setRoute([]);
  setMarkers([]);
  setFuelStops([]);
  setRestStops([]);
  setEldSheets([]);
  setTripInfo(null);
  setLoading(true);
    try {

      const location = await getCoordinates(formData.currentLocation);
      const pickup = await getCoordinates(formData.pickupLocation);
      const dropoff = await getCoordinates(formData.dropoffLocation);


  if (
    !formData.currentLocation.trim() ||
    !formData.pickupLocation.trim() ||
    !formData.dropoffLocation.trim()
  ) {
    alert("⚠️ You must complete all locations.");
    return;
  }
    if (
    formData.cycleUsed === "" ||
    formData.cycleUsed === null ||
    formData.cycleUsed === undefined
  ) {
    alert("⚠️ You must enter the hours worked during the current cycle.");
    return;
  }
      const orsCoordinates = [
        [Number(location.lon || location.lng), Number(location.lat)],
        [Number(pickup.lon || pickup.lng), Number(pickup.lat)],
        [Number(dropoff.lon || dropoff.lng), Number(dropoff.lat)]
      ];

      if (orsCoordinates.flat().some(num => isNaN(num))) {
        console.error("Invalid coordinates detected numerically.");
        return;
      }

     
      const routeData = await getRoute(orsCoordinates);

      if (!routeData?.features?.[0]?.geometry?.coordinates) {
        alert("❌ Could not trace a valid route between these points.");
        return;
      }

     
      const leafletRoute = routeData.features[0].geometry.coordinates
        .map((coord) => {
          if (Array.isArray(coord) && coord.length >= 2) {
            const lon = coord[0];
            const lat = coord[1];
            
            if (lat !== undefined && lat !== null && !isNaN(lat) &&
                lon !== undefined && lon !== null && !isNaN(lon)) {
              return [Number(lat), Number(lon)]; 
            }
          }
          return null;
        })
        .filter((point) => point !== null);

      if (leafletRoute.length === 0) {
        alert("❌ The geometric data of the route is corrupted.");
        return;
      }

     
      const summary = routeData.features[0].properties.summary;
      const distanceMiles = (summary.distance / 1609.34).toFixed(2);
      const durationHours = (summary.duration / 3600).toFixed(2);

      setTripInfo({ distanceMiles, durationHours });

    
const markers = [
  [Number(location.lat), Number(location.lon || location.lng)],
  [Number(pickup.lat), Number(pickup.lon || pickup.lng)],
  [Number(dropoff.lat), Number(dropoff.lon || dropoff.lng)]
];

const validMarkers = markers.filter(
  ([lat, lon]) => !isNaN(lat) && !isNaN(lon)
);

setMarkers(validMarkers);
setRoute(leafletRoute);

const simplifiedRoute = leafletRoute.filter(
  (_, index) => index % 10 === 0
);

const stops = await getStops(simplifiedRoute);

setFuelStops(stops.fuelStops);

setRestStops(stops.restStops);


const responseEld = await fetch(
  `${import.meta.env.VITE_API_URL}/api/calculate-eld-logs/`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      distanceMiles: Number(distanceMiles),
      durationHours: Number(durationHours),
      cycleUsed: Number(formData.cycleUsed) || 0
    })
  }
);

if (!responseEld.ok) {
  throw new Error(
    "❌ Failed to calculate ELD logs. Server responded with status: " +
      responseEld.status
  );
}

const generatedLogs = await responseEld.json();

setEldSheets(generatedLogs);

console.log("PUNTOS REDUCIDOS:",simplifiedRoute.length);

console.log("FUEL STOPS:",stops.fuelStops);
console.log("REST STOPS:",stops.restStops);
console.log(
  "LOGS RECIBIDOS DE DJANGO:",
   generatedLogs
);
  } catch (error) {
    console.error("Error processing the form:", error);
    alert("❌ An error occurred while processing your request. Check the console for more details.");
  }
  finally {
    setLoading(false);
  }
}

return (
  <form onSubmit={handleSubmit} className="trip-form">

    <div className="form-row">

      <LocationInput
        value={formData.currentLocation}
        placeholder="Current Location"
        onSelect={(value) =>
          setFormData((prev) => ({
            ...prev,
            currentLocation: value
          }))
        }
      />

      <LocationInput
        value={formData.pickupLocation}
        placeholder="Pickup Location"
        onSelect={(value) =>
          setFormData((prev) => ({
            ...prev,
            pickupLocation: value
          }))
        }
      />

      <LocationInput
        value={formData.dropoffLocation}
        placeholder="Dropoff Location"
        onSelect={(value) =>
          setFormData((prev) => ({
            ...prev,
            dropoffLocation: value
          }))
        }
      />

      <input
        value={formData.cycleUsed}
        name="cycleUsed"
        type="number"
        min="0"
        max="70"
        placeholder="Current Cycle Used (Hours)"
        onChange={handleChange}
        required
      />

      <button
        type="submit"
        disabled={loading}
      >
        {loading
          ? "Calculating..."
          : "Calculate Route"}
      </button>

    </div>

  </form>
);
}