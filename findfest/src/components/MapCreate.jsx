import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import debounce from 'lodash.debounce';

const MapFlyTo = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 13);
    }
  }, [lat, lng, map]);

  return null;
};

const VenueSearchMap = ({ eventData, setEventData, showGeolocation = false }) => {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const mapRef = useRef(null);

  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`
        );
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to fetch venue suggestions.');
      } finally {
        setLoading(false);
      }
    }, 1000), // 1 second debounce
    []
  );

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchInput(query);
    debouncedSearch(query);
  };

  const handleSuggestionClick = (venue) => {
    const { display_name, lat, lon } = venue;
    setEventData({
      ...eventData,
      venue: display_name,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
    });

    setSearchInput(display_name);
    setSuggestions([]);
  };

  const handleSearchButtonClick = async () => {
    if (!searchInput.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchInput}&addressdetails=1&limit=5`
      );
      const data = await response.json();

      if (data.length > 0) {
        const first = data[0];
        handleSuggestionClick(first);
      } else {
        setError('Venue not found.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while searching.');
    } finally {
      setLoading(false);
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setEventData({
          ...eventData,
          venue: 'Selected on map',
          latitude: lat,
          longitude: lng,
        });
        setSearchInput('');
        setSuggestions([]);
      },
    });
    return null;
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lon: longitude });
          setEventData({
            ...eventData,
            latitude,
            longitude,
            venue: 'Current Location',
          });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setError('Could not get your current location.');
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    // If a currentLocation is set, update the map view
    if (currentLocation && currentLocation.lat && currentLocation.lon) {
      setEventData({
        ...eventData,
        latitude: currentLocation.lat,
        longitude: currentLocation.lon,
        venue: 'Current Location',
      });
    }
  }, [currentLocation, eventData, setEventData]);

  return (
    <div>
      <input
        type="text"
        value={searchInput}
        onChange={handleSearchInput}
        placeholder="Enter venue name"
      />
      <button onClick={handleSearchButtonClick}>Search Venue</button>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      {suggestions.length > 0 && !loading && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              style={{ cursor: 'pointer', padding: '5px', borderBottom: '1px solid #ddd' }}
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}

      {suggestions.length === 0 && !loading && searchInput.trim() !== '' && (
        <div>No suggestions found</div>
      )}

      {/* Render the "Use My Current Location" button only if showGeolocation is true */}
      {showGeolocation && !currentLocation && (
        <button onClick={getCurrentLocation}>Use My Current Location</button>
      )}

      <MapContainer
        center={[eventData.latitude || -1.2921, eventData.longitude || 36.8219]}
        zoom={13}
        style={{ height: '400px' }}
        whenCreated={(map) => {
          mapRef.current = map;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <MapFlyTo lat={eventData.latitude} lng={eventData.longitude} />

        {eventData.latitude && eventData.longitude && (
          <Marker position={[eventData.latitude, eventData.longitude]}>
            <Popup>{eventData.venue || 'Selected Location'}</Popup>
          </Marker>
        )}

        <MapEvents />
      </MapContainer>
    </div>
  );
};

export default VenueSearchMap;
