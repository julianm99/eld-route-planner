import { useState } from "react";
import TripForm from '../components/TripForm';
import RouteMap from '../components/RouteMap';
import DailyLogs from '../components/DailyLogs';


export default function Home() {
  const [route, setRoute] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [tripInfo, setTripInfo] = useState(null);
  const [fuelStops, setFuelStops] = useState([]);
  const [eldSheets, setEldSheets] = useState([]); // Aquí se guardará lo de Django
  const [restStops, setRestStops] = useState([]); // Aquí se guardarán las paradas de descanso
  return (
    <div className="home">

      <header>
      <h1>ELD Router Planner</h1>
      </header>

    <main>
      <TripForm
        setRoute={setRoute}
        setMarkers={setMarkers}
        setTripInfo={setTripInfo}
        setFuelStops={setFuelStops}
        setEldSheets={setEldSheets} 
        setRestStops={setRestStops}
      />

      <RouteMap class="map-wrapper"
        route={route}
        markers={markers}
        fuelStops={fuelStops}
        restStops={restStops}
      />

      {tripInfo && (
        <div className="trip-info">
          <h2>Trip Information</h2>
          <p>Distance: {tripInfo.distanceMiles} miles</p>
          <p>Driving Time: {tripInfo.durationHours} hours</p>
        </div>
      )}


       <DailyLogs logs={eldSheets} />
      </main>

        <footer>
          <p>&copy; 2024 ELD Router Planner. All rights reserved.</p>
        </footer>


    </div>
  );
}