import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapClientProps {
    center : [number, number];
    zoom : number;
    radius : number;
}

export default function MapClient({center,radius = 50 , zoom =15 } : MapClientProps) {


    return (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {/* <Marker position={[51.505, -0.09]}>
                <Popup>Hello Leaflet</Popup>
            </Marker> */}

            <Circle
                center={center}
                radius={radius} // in meters
                pathOptions={{ color: 'blue', fillColor: 'lightblue', fillOpacity: 0.4 }}
            />
        </MapContainer>
    );
}

