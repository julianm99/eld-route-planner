import {MapContainer,TileLayer,Polyline,Marker,Popup} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


const fuelStationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/483/483497.png', 
  iconSize: [26, 26],         
  iconAnchor: [13, 26],       
  popupAnchor: [0, -26]      
});

const restStopIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1841/1841652.png', 
  iconSize: [26, 26],         
  iconAnchor: [13, 26],       
  popupAnchor: [0, -26]       
});
const currentLocationIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const pickupIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/685/685388.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const dropoffIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1505/1505471.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

export default function RouteMap({route,markers, fuelStops,restStops}) {

  return (
    <MapContainer
      center={[32.7762, -96.7968]}
      zoom={5}
      style={{
        height: "500px",
        width: "100%"
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {route && (
        <Polyline positions={route} />
      )}

      {markers?.[0] && (
  <Marker
    position={markers[0]}
    icon={currentLocationIcon}
  >
    <Popup>
      Current Location
    </Popup>
  </Marker>
)}

{markers?.[1] && (
  <Marker
    position={markers[1]}
    icon={pickupIcon}
  >
    <Popup>
      Pickup Location
    </Popup>
  </Marker>
)}

{markers?.[2] && (
  <Marker
    position={markers[2]}
    icon={dropoffIcon}
  >
    <Popup>
      Dropoff Location
    </Popup>
  </Marker>
)}


{fuelStops?.map((station) => (
  <Marker
    key={station.id}
    position={[station.lat, station.lon]}
    icon={fuelStationIcon}
  >
    <Popup>
      <strong>Fuel Stop</strong>
      <br />
      {station.name}
    </Popup>
  </Marker>
))}


{restStops?.map((stop) => (
  <Marker
    key={stop.id}
    position={[stop.lat, stop.lon]}
    icon={restStopIcon}
  >
    <Popup>
      <strong>Rest Stop</strong>
      <br />
      {stop.name}
    </Popup>
  </Marker>
))}

    </MapContainer>
  );
}