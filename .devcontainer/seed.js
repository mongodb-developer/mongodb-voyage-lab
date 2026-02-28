// .devcontainer/seed.js
'use strict';
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI ?? 'mongodb://admin:mongodb@localhost:27017/?directConnection=true';

// ---------------------------------------------------------------------------
// Lookup tables for generating realistic listings
// ---------------------------------------------------------------------------

const cities = [
  // Europe
  { city: 'London',       country: 'United Kingdom', country_code: 'GB', market: 'London',       coords: [-0.1278,   51.5074] },
  { city: 'Paris',        country: 'France',          country_code: 'FR', market: 'Paris',        coords: [2.3522,   48.8566]  },
  { city: 'Barcelona',    country: 'Spain',           country_code: 'ES', market: 'Barcelona',    coords: [2.1734,   41.3851]  },
  { city: 'Amsterdam',    country: 'Netherlands',     country_code: 'NL', market: 'Amsterdam',    coords: [4.9041,   52.3676]  },
  { city: 'Lisbon',       country: 'Portugal',        country_code: 'PT', market: 'Lisbon',       coords: [-9.1393,  38.7223]  },
  { city: 'Porto',        country: 'Portugal',        country_code: 'PT', market: 'Porto',        coords: [-8.6291,  41.1579]  },
  { city: 'Berlin',       country: 'Germany',         country_code: 'DE', market: 'Berlin',       coords: [13.4050,  52.5200]  },
  { city: 'Rome',         country: 'Italy',           country_code: 'IT', market: 'Rome',         coords: [12.4964,  41.9028]  },
  // North America
  { city: 'New York',     country: 'United States',   country_code: 'US', market: 'New York',     coords: [-73.9857, 40.7484]  },
  { city: 'Toronto',      country: 'Canada',          country_code: 'CA', market: 'Toronto',      coords: [-79.3832, 43.6532]  },
  { city: 'Vancouver',    country: 'Canada',          country_code: 'CA', market: 'Vancouver',    coords: [-123.1216,49.2827]  },
  { city: 'Montreal',     country: 'Canada',          country_code: 'CA', market: 'Montreal',     coords: [-73.5674, 45.5017]  },
  { city: 'Calgary',      country: 'Canada',          country_code: 'CA', market: 'Calgary',      coords: [-114.0719,51.0447]  },
  // South America
  { city: 'Buenos Aires', country: 'Argentina',       country_code: 'AR', market: 'Buenos Aires', coords: [-58.3816, -34.6037] },
  { city: 'São Paulo',    country: 'Brazil',          country_code: 'BR', market: 'São Paulo',    coords: [-46.6333, -23.5505] },
  { city: 'Rio de Janeiro',country:'Brazil',          country_code: 'BR', market: 'Rio de Janeiro',coords:[-43.1729, -22.9068] },
  { city: 'Bogotá',       country: 'Colombia',        country_code: 'CO', market: 'Bogotá',       coords: [-74.0721,  4.7110]  },
  { city: 'Medellín',     country: 'Colombia',        country_code: 'CO', market: 'Medellín',     coords: [-75.5812,  6.2442]  },
  { city: 'Santiago',     country: 'Chile',           country_code: 'CL', market: 'Santiago',     coords: [-70.6483, -33.4569] },
  { city: 'Lima',         country: 'Peru',            country_code: 'PE', market: 'Lima',         coords: [-77.0428, -12.0464] },
  // Asia-Pacific
  { city: 'Tokyo',        country: 'Japan',           country_code: 'JP', market: 'Tokyo',        coords: [139.6917, 35.6895]  },
  { city: 'Sydney',       country: 'Australia',       country_code: 'AU', market: 'Sydney',       coords: [151.2093, -33.8688] },
];

const propertyTypes = ['Apartment', 'House', 'Loft', 'Condo', 'Villa', 'Studio', 'Townhouse', 'Cottage'];
const roomTypes     = ['Entire home/apt', 'Private room', 'Shared room'];
const cancellation  = ['flexible', 'moderate', 'strict', 'super_strict_30'];

const summaries = [
  'A stunning apartment in the heart of the city, steps from top restaurants and museums. Enjoy panoramic views and modern amenities in this beautifully renovated space.',
  'Charming historic home with original architectural details. High ceilings, exposed brick, and a sun-drenched living room make this the perfect urban retreat.',
  'Modern loft-style apartment with floor-to-ceiling windows. Fully equipped kitchen, fast WiFi, and a dedicated workspace ideal for digital nomads.',
  'Cozy boutique retreat in a quiet neighbourhood. Walking distance to parks, cafés, and public transport. Perfect for couples or solo travellers.',
  'Elegant and spacious villa with private garden. Professionally decorated with premium furnishings, offering a luxury stay in an unbeatable location.',
  'Minimalist studio with everything you need. Smart TV, Netflix, espresso machine, and blackout curtains for a restful stay.',
  'Quaint cottage with rustic charm and modern comforts. Fireplace, fully stocked kitchen, and a garden patio ideal for relaxing evenings.',
  'Contemporary condo on a high floor with city skyline views. Gym and pool access included. Business-friendly with concierge service.',
  'Sun-filled townhouse spread across three floors. Pet-friendly, with a private rooftop terrace and dedicated parking.',
  'Welcoming apartment in a lively cultural district. Local galleries, markets, and independent coffee shops right at your doorstep.',
  'Sleek waterfront condo with floor-to-ceiling glass and sweeping harbour views. Fall asleep to the sound of the water and wake up to stunning sunrises.',
  'Bright and airy suite in a heritage building, blending period architecture with contemporary interiors. Exposed stone walls and hardwood floors throughout.',
  'Private garden apartment tucked away on a leafy residential street. A genuine home-away-from-home, ideal for long stays and remote workers.',
  'Rooftop penthouse with 360-degree city views and a private terrace. Entertain, sunbathe, or stargaze from your personal outdoor sanctuary.',
  'Vibrant neighbourhood flat with colourful street art at every corner. Close to the best local food markets, craft beer bars, and live music venues.',
  'Architect-designed open-plan home featuring bespoke furniture and curated original artwork. Sophisticated, calm, and entirely unique.',
  'Tropical hideaway with lush jungle surroundings, a hammock on the veranda, and outdoor shower. The sounds of nature replace the city hum.',
  'Classic brownstone apartment on a tree-lined avenue, lovingly restored with original parquet floors and tall sash windows. The ideal base for city explorers.',
  'Bright mountain-view suite with ski-in access in winter and hiking trails at the door in summer. A four-season retreat with a wood-burning stove.',
  'Bohemian artist studio with high raftered ceilings, skylights, and creative vibes. Located steps from galleries, antique shops, and the weekend flea market.',
];

const descriptions = [
  'The space is thoughtfully designed to balance comfort and style. Natural light floods every room, and the layout ensures plenty of privacy.',
  'Guests will have the entire place to themselves. The open-plan kitchen is well-stocked, and the bedroom features a premium mattress and hotel-quality linens.',
  'A fully self-contained unit with private entrance. The living area opens onto a private balcony with views over the neighbourhood.',
  'High-speed fibre WiFi throughout. Laptop-friendly desks in two rooms. The kitchen includes a barista-grade coffee machine and a full suite of appliances.',
  'The garden is maintained weekly and is perfect for morning coffee or evening wine. Outdoor dining furniture and a BBQ grill are provided.',
  'Ample storage space, a full-size washing machine and dryer, and an iron are available for longer stays.',
  'The bedroom is separated from the living area by solid doors, providing a genuine separation of rest and relaxation zones.',
  'Local artwork curated by the host adorns the walls. Every piece has a story — ask about them at check-in.',
  'The building is serviced by a 24-hour concierge, and secure underground parking is available on request. Contactless self check-in via smart lock.',
  'Floor-to-ceiling bookshelves line the main wall. A curated selection of travel literature and local history books is free for guests to enjoy.',
  'The kitchen is stocked with local spices, fresh coffee, and a welcome basket of regional produce on arrival. A love letter to local food culture.',
  'Heated bathroom floors, rainfall shower, and a deep soaking tub make this one of the most spa-like private rentals in the city.',
  'The terrace faces west for golden-hour sunsets. A telescope, outdoor heaters, and a fire pit are set up year-round for evening gatherings.',
  'Soundproofed walls and blackout blinds ensure complete rest. The building is set back from the road and surrounded by mature trees.',
  'Bike rentals are available through the host at a discount. The neighbourhood is flat and criss-crossed with dedicated cycling lanes.',
  'The host has prepared a detailed digital guidebook with neighbourhood restaurant picks, transport tips, and day-trip suggestions tailored to every interest.',
];

const hostNames  = [
  'Alice', 'Marco', 'Sophie', 'David', 'Yuki', 'Elena', 'Carlos', 'Priya', 'Luca', 'Amara',
  'James', 'Mei', 'Valentina', 'Sebastián', 'Isabelle', 'Kwame', 'Natasha', 'Diego', 'Aiko',
  'Camille', 'Rafael', 'Nadia', 'Patrick', 'Lucía', 'Omar', 'Ingrid', 'Felipe', 'Zara', 'Hiroshi', 'Chloe',
];
const hostAbouts = [
  'I love welcoming guests from around the world and sharing local tips. Ask me anything about the neighbourhood!',
  'Superhost for 5 years. I live nearby and am always happy to help make your stay memorable.',
  'Travel enthusiast and interior designer. I put a lot of care into every detail of this space.',
  'Local food blogger and tour guide. I can recommend the best hidden gems in the city.',
  'Architect by profession. This property is my passion project — every corner is intentional.',
  'Born and raised here, I know every shortcut, secret viewpoint, and hole-in-the-wall restaurant. Let me share them with you.',
  'I work in hospitality and bring that professional attention to detail to every stay. Your comfort is my priority.',
  'Passionate about sustainable travel. This property uses solar power, filtered tap water, and 100% recycled linens.',
  'Artist and musician. The apartment reflects my love of colour, texture, and creativity. I hope it inspires you too.',
  'I manage several properties but treat each guest as if they are staying in my own home. Reviews speak for themselves!',
  'Retired teacher and lifelong host. I genuinely enjoy meeting people and love helping guests discover the real city.',
  'Digital nomad for 10 years before settling here. I understand exactly what remote workers need — fast WiFi, a great desk, and strong coffee.',
];

const amenityPool = [
  'WiFi', 'Kitchen', 'TV', 'Washing machine', 'Air conditioning', 'Heating', 'Dedicated workspace',
  'Hair dryer', 'Iron', 'Hangers', 'Coffee maker', 'Microwave', 'Refrigerator', 'Dishwasher',
  'Essentials', 'Shampoo', 'Hot water', 'Bed linens', 'Extra pillows and blankets',
  'First aid kit', 'Fire extinguisher', 'Smoke alarm', 'Carbon monoxide alarm',
  'Long term stays allowed', 'Self check-in', 'Lock box', 'Luggage dropoff allowed',
  'Garden', 'Balcony', 'Patio', 'BBQ grill', 'Pool', 'Gym', 'Elevator', 'Parking',
  'Pets allowed', 'Children friendly', 'Crib', 'High chair',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick(arr)   { return arr[Math.floor(Math.random() * arr.length)]; }
function rand(a, b)  { return Math.floor(Math.random() * (b - a + 1)) + a; }
function randF(a, b) { return Math.round((Math.random() * (b - a) + a) * 100) / 100; }
function jitter([lng, lat], r = 0.05) {
  return [
    Math.round((lng + (Math.random() - 0.5) * r) * 10000) / 10000,
    Math.round((lat + (Math.random() - 0.5) * r) * 10000) / 10000,
  ];
}
function pickMany(arr, min, max) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, rand(min, max));
}
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// ---------------------------------------------------------------------------
// Generate 100 listings
// ---------------------------------------------------------------------------

function generateListings(n = 100) {
  const listings = [];

  for (let i = 0; i < n; i++) {
    const id         = String(10000000 + i);
    const loc        = pick(cities);
    const propType   = pick(propertyTypes);
    const roomType   = pick(roomTypes);
    const bedrooms   = rand(1, 5);
    const beds       = rand(bedrooms, bedrooms + 2);
    const bathrooms  = randF(1, 3);
    const accommodates = rand(2, bedrooms * 2 + 2);
    const price      = rand(40, 450);
    const deposit    = rand(50, 500);
    const cleanFee   = rand(20, 120);
    const extraPpl   = rand(0, 30);
    const minNights  = pick([1, 2, 3, 5, 7]);
    const maxNights  = pick([14, 30, 60, 90, 365]);
    const numReviews = rand(0, 180);
    const hostId     = String(50000000 + rand(0, 999999));
    const hostName   = pick(hostNames);
    const coords     = jitter(loc.coords);

    const reviewScores = numReviews > 0 ? {
      review_scores_accuracy:      rand(7, 10),
      review_scores_cleanliness:   rand(7, 10),
      review_scores_checkin:       rand(8, 10),
      review_scores_communication: rand(8, 10),
      review_scores_location:      rand(8, 10),
      review_scores_value:         rand(7, 10),
      review_scores_rating:        rand(75, 100),
    } : {};

    // Generate a small number of embedded reviews
    const reviews = [];
    const reviewCount = Math.min(numReviews, rand(0, 5));
    for (let r = 0; r < reviewCount; r++) {
      reviews.push({
        _id: String(360000000 + rand(0, 9999999)),
        date: randomDate(new Date('2022-01-01'), new Date('2024-12-31')),
        listing_id: id,
        reviewer_id: String(10000000 + rand(0, 9999999)),
        reviewer_name: pick(hostNames),
        comments: pick([
          'Absolutely wonderful place — clean, comfortable, and perfectly located.',
          'The host was incredibly responsive and the apartment exceeded expectations.',
          'Great value for money. Would definitely stay here again.',
          'Exactly as described. The neighbourhood is fantastic and very walkable.',
          'Beautifully decorated space. The bed was incredibly comfortable.',
          'Perfect for our weekend trip. Check-in was seamless and the place was spotless.',
          'Some minor issues with noise from the street but overall a great stay.',
          'Host provided great local tips. The apartment has everything you need.',
        ]),
      });
    }

    // Build a human-readable description for embedding demos
    const description = `${pick(summaries)} ${pick(descriptions)}`;

    listings.push({
      _id: id,
      listing_url: `https://www.airbnb.com/rooms/${id}`,
      name: `${propType} in ${loc.city} — ${bedrooms}BR ${roomType}`,
      summary: pick(summaries),
      description,
      interaction: 'Happy to give local recommendations. Self check-in available.',
      house_rules: 'No parties or events. No smoking inside. Pets allowed with prior approval.',
      property_type: propType,
      room_type: roomType,
      bed_type: 'Real Bed',
      minimum_nights: String(minNights),
      maximum_nights: String(maxNights),
      cancellation_policy: pick(cancellation),
      accommodates,
      bedrooms,
      beds,
      number_of_reviews: numReviews,
      bathrooms,
      amenities: pickMany(amenityPool, 8, 20),
      price,
      security_deposit: deposit,
      cleaning_fee: cleanFee,
      extra_people: extraPpl,
      guests_included: rand(1, 4),
      images: {
        thumbnail_url: '',
        medium_url: '',
        picture_url: `https://picsum.photos/seed/${id}/800/600`,
        xl_picture_url: `https://picsum.photos/seed/${id}x/1200/800`,
      },
      host: {
        host_id: hostId,
        host_url: `https://www.airbnb.com/users/show/${hostId}`,
        host_name: hostName,
        host_location: `${loc.city}, ${loc.country}`,
        host_about: pick(hostAbouts),
        host_response_time: pick(['within an hour', 'within a few hours', 'within a day']),
        host_thumbnail_url: `https://i.pravatar.cc/150?u=${hostId}`,
        host_picture_url: `https://i.pravatar.cc/300?u=${hostId}`,
        host_neighbourhood: '',
        host_response_rate: rand(80, 100),
        host_is_superhost: Math.random() > 0.7,
        host_has_profile_pic: true,
        host_identity_verified: Math.random() > 0.2,
        host_listings_count: rand(1, 8),
        host_total_listings_count: rand(1, 10),
        host_verifications: pickMany(['email', 'phone', 'reviews', 'government_id', 'jumio'], 2, 5),
      },
      address: {
        street: `${loc.city}, ${loc.country}`,
        suburb: '',
        government_area: loc.city,
        market: loc.market,
        country: loc.country,
        country_code: loc.country_code,
        location: {
          type: 'Point',
          coordinates: coords,
          is_location_exact: Math.random() > 0.5,
        },
      },
      review_scores: reviewScores,
      reviews,
    });
  }

  return listings;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB.');

  const db  = client.db('voyage_lab');
  const col = db.collection('listings');

  await col.drop().catch(() => {});
  console.log('Dropped existing listings collection.');

  const listings = generateListings(100);
  await col.insertMany(listings);
  console.log(`Inserted ${listings.length} listings.`);

  // Indexes useful for the lab exercises
  await col.createIndex({ 'address.location': '2dsphere' });
  await col.createIndex({ price: 1 });
  await col.createIndex({ 'address.country_code': 1 });
  await col.createIndex({ property_type: 1, room_type: 1 });
  console.log('Indexes created.');

  await client.close();
  console.log('Seed complete.');
}

seed().catch(err => { console.error(err); process.exit(1); });
