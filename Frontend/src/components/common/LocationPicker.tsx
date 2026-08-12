import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Input from '../form/input/InputField';
import Button from '../ui/button/Button';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  initialLat?: string;
  initialLong?: string;
  initialName?: string;
  initialAddress?: string;
  onChange: (data: { lat: string; long: string; name: string; address: string }) => void;
}

// Component to handle map clicks
function MapEvents({ setPosition, fetchAddress }: { setPosition: (p: L.LatLng) => void, fetchAddress: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      fetchAddress(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to programmatically fly to a location
function MapRelocator({ position }: { position: L.LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom() || 13);
    }
  }, [position, map]);
  return null;
}

export default function LocationPicker({
  initialLat,
  initialLong,
  initialName,
  initialAddress,
  onChange
}: LocationPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLong ? new L.LatLng(parseFloat(initialLat), parseFloat(initialLong)) : null
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [name, setName] = useState(initialName || '');
  const [address, setAddress] = useState(initialAddress || '');

  // Notify parent on changes
  useEffect(() => {
    if (position) {
      onChange({
        lat: position.lat.toString(),
        long: position.lng.toString(),
        name,
        address
      });
    } else {
      // If position is cleared, but there's still text
      onChange({ lat: '', long: '', name, address });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, name, address]);

  const formatCleanAddress = (item: any) => {
    if (item && item.address) {
      const addr = item.address;
      const venue = addr.railway || addr.amenity || addr.building || addr.shop || addr.office || addr.aerodrome || addr.station || item.name || '';
      const street = addr.road || addr.street || addr.pedestrian || addr.suburb || addr.neighbourhood || '';
      const area = addr.suburb || addr.locality || addr.district || '';
      const city = addr.city || addr.town || addr.village || addr.county || '';
      const state = addr.state || '';
      const postcode = addr.postcode || '';
      const country = addr.country || '';

      const rawParts = [venue, street, area, city, state, postcode, country];
      const cleanParts: string[] = [];
      
      rawParts.forEach(part => {
        if (!part) return;
        const str = part.toString().trim();
        if (/tehsil|subdistrict|taluk|mandal|ward|division/i.test(str)) return;
        if (!cleanParts.some(existing => existing.toLowerCase() === str.toLowerCase())) {
          cleanParts.push(str);
        }
      });

      if (cleanParts.length > 0) {
        return cleanParts.join(', ');
      }
    }
    const raw = item.display_name || '';
    return raw.split(',').map((s: string) => s.trim()).filter((s: string) => !/tehsil|subdistrict|taluk|mandal|ward/i.test(s)).join(', ');
  };

  const fetchAddress = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          const shortName = data.name || (data.display_name ? data.display_name.split(',')[0] : '');
          setName(shortName);
          setAddress(formatCleanAddress(data));
          return;
        }
      }
      const fallbackRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const props = data.features?.[0]?.properties;
        if (props) {
          const shortName = props.name || '';
          const addressParts = [props.street, props.city, props.state, props.postcode, props.country].filter(Boolean);
          setName(shortName);
          setAddress(addressParts.join(', '));
        }
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e);
    }
  };

  const selectResult = (item: any, clearResults = true) => {
    const newPos = new L.LatLng(item.lat, item.lon);
    setPosition(newPos);
    setName(item.name);
    setAddress(item.address);
    if (clearResults) {
      setSearchResults([]);
    }
  };

  // Live autocomplete suggestions as user types
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      if (searchQuery.trim().toLowerCase() === name.trim().toLowerCase()) return;
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.trim())}&addressdetails=1&limit=6&accept-language=en`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const formatted = data.map((item: any) => {
              const lat = parseFloat(item.lat);
              const lon = parseFloat(item.lon);
              const shortName = item.name || (item.display_name ? item.display_name.split(',')[0] : searchQuery);
              return {
                id: item.place_id || `${lat}-${lon}`,
                lat,
                lon,
                name: shortName,
                address: formatCleanAddress(item)
              };
            });
            setSearchResults(formatted);
          }
        }
      } catch (e) {
        console.error("Autocomplete failed", e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, name]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=6&accept-language=en`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const formatted = data.map((item: any) => {
            const lat = parseFloat(item.lat);
            const lon = parseFloat(item.lon);
            const shortName = item.name || item.display_name.split(',')[0];
            return {
              id: item.place_id || `${lat}-${lon}`,
              lat,
              lon,
              name: shortName,
              address: formatCleanAddress(item)
            };
          });

          if (formatted.length === 1) {
            selectResult(formatted[0]);
          } else {
            setSearchResults(formatted);
            selectResult(formatted[0], false);
          }
          return;
        }
      }

      const fallbackRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=6`);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        const features = fallbackData.features || [];
        if (features.length > 0) {
          const formatted = features.map((f: any, idx: number) => {
            const lon = parseFloat(f.geometry.coordinates[0]);
            const lat = parseFloat(f.geometry.coordinates[1]);
            const props = f.properties;
            const shortName = props.name || searchQuery;
            const addressParts = [props.street, props.city, props.state, props.postcode, props.country].filter(Boolean);
            return {
              id: idx,
              lat,
              lon,
              name: shortName,
              address: addressParts.join(', ')
            };
          });
          if (formatted.length === 1) {
            selectResult(formatted[0]);
          } else {
            setSearchResults(formatted);
            selectResult(formatted[0], false);
          }
        } else {
          alert("Location not found. Please try a different search term.");
        }
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCurrentLocation = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          setPosition(newPos);
          fetchAddress(pos.coords.latitude, pos.coords.longitude);
          setIsLocating(false);
        },
        (err) => {
          console.error(err);
          alert("Could not get your location. Please check browser permissions.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setIsLocating(false);
    }
  };

  // Default to London if no position is set yet, just so map shows something
  const defaultCenter = new L.LatLng(51.505, -0.09);

  return (
    <div className="flex flex-col gap-4">
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for a place or address..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          />
          <Button onClick={handleSearch} disabled={isSearching} variant="primary">
             {isSearching ? '...' : 'Search'}
          </Button>
        </div>
        <button 
          type="button" 
          onClick={handleCurrentLocation} 
          disabled={isLocating} 
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold text-sm transition shadow-xs border border-gray-200 dark:border-gray-700 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {isLocating ? 'Locating...' : 'Use My Location'}
        </button>
      </div>

      {/* Search Results Dropdown */}
      {searchResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60 z-50">
          <div className="px-3.5 py-2.5 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 flex justify-between items-center sticky top-0 z-10">
            <span>Select matching location ({searchResults.length} matches found):</span>
            <button type="button" onClick={() => setSearchResults([])} className="text-gray-400 hover:text-gray-600 dark:hover:text-white font-medium cursor-pointer px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition">Close ✕</button>
          </div>
          {searchResults.map((item, idx) => (
            <div 
              key={item.id || idx}
              onClick={() => selectResult(item, true)}
              className="p-3 hover:bg-brand-50/70 dark:hover:bg-brand-900/30 cursor-pointer transition flex items-start gap-3 group"
            >
              <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/60 transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">{item.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{item.address}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div className="w-full h-72 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative z-0">
        <MapContainer 
          center={position || defaultCenter} 
          zoom={position ? 15 : 2} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {position && <Marker position={position} />}
          <MapEvents setPosition={setPosition} fetchAddress={fetchAddress} />
          <MapRelocator position={position} />
        </MapContainer>
      </div>
      
      <p className="text-xs text-gray-500 text-center">Click anywhere on the map to drop a pin.</p>

      {/* Edit Coordinates / Name Manually */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Office" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Main St..." />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Latitude</label>
          <input type="text" value={position?.lat?.toFixed(6) || ''} readOnly className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Longitude</label>
          <input type="text" value={position?.lng?.toFixed(6) || ''} readOnly className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm focus:outline-none" />
        </div>
      </div>

    </div>
  );
}

