function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  // 🔥 Dynamic sigmoid-like weighting
  function getDistanceWeight(distanceKm) {
    const steepness = 5; // Controls how fast it drops
    const shift = 10;    // 10km = ideal
    const raw = 1 / (1 + Math.exp((distanceKm - shift) / steepness));
    return raw * 2; // Normalize so 10km ≈ 1
  }
  
  function calculateDistanceAndWeight(userCoords, eventCoords) {
    const distanceKm = getDistanceInKm(
      userCoords.lat,
      userCoords.lon,
      eventCoords.lat,
      eventCoords.lon
    );
    const weight = getDistanceWeight(distanceKm);
    return { distanceKm, weight };
  }
  
  module.exports = calculateDistanceAndWeight;
  