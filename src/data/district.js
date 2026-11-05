// Civic District boundary, traced to match the roots.gov.sg trail-area map:
// Penang Rd → Bras Basah Rd → Beach Rd → Esplanade Dr → round the Fullerton
// → upstream along the Singapore River → Clemenceau Ave. Approximate
// (traced from OpenStreetMap road and river geometry). All 22 sites are inside.
//
// Entering this polygon (or any site's geofence) triggers the
// "You're entering the Civic District" prompt. Pure client-side maths.

export const DISTRICT_POLYGON = [
  [1.2976, 103.8437], // Clemenceau Ave / Penang Rd
  [1.2976, 103.8462], // Penang Rd / Fort Canning Rd
  [1.2983, 103.8482], // Orchard Rd / Bras Basah Rd
  [1.2937, 103.8548], // Bras Basah Rd / Beach Rd
  [1.2925, 103.8538], // Beach Rd / Stamford Rd
  [1.2915, 103.8544], // Esplanade Dr
  [1.2885, 103.8541], // Esplanade Dr at the river
  [1.287, 103.8537], // Fullerton Rd
  [1.2857, 103.8538], // round the Fullerton
  [1.2852, 103.8524], // Collyer Quay / Battery Rd
  [1.2858, 103.8512], // river, south bank
  [1.2867, 103.8506],
  [1.2878, 103.85],
  [1.2888, 103.8496],
  [1.2896, 103.8485], // Elgin Bridge
  [1.2898, 103.8472],
  [1.2897, 103.8465], // Coleman Bridge
  [1.2891, 103.8454],
  [1.2894, 103.8448],
  [1.2906, 103.8444], // Clarke Quay
  [1.291, 103.8439],
  [1.2903, 103.843], // river at Clemenceau Ave
  [1.2935, 103.8433], // Clemenceau Ave
].map(([lat, lng]) => ({ lat, lng }));

// Where the "Civic District" label sits on the map.
export const DISTRICT_LABEL_AT = { lat: 1.2955, lng: 103.8462 };
