export type ListingType = "private_room" | "shared_room" | "entire_place";

export type RutgersCampus =
  | "livingston"
  | "college_avenue"
  | "cook_douglass"
  | "busch";

export type LivingType = "off_campus" | "on_campus";

export interface Housemate {
  id: string;
  name: string;
  year: "Freshman" | "Sophomore" | "Junior" | "Senior" | "Graduate";
  major: string;
  traits: string[];
  avatar: string;
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  type: ListingType;
  livingType: LivingType;
  neighborhood: string;
  township: string;
  campus: RutgersCampus;
  address: string;
  distanceToCampus: number;
  amenities: string[];
  images: string[];
  isFeatured: boolean;
  availableRooms: number;
  utilitiesIncluded: boolean;
  petsAllowed: boolean;
  furnished: boolean;
  parking: boolean;
  description: string;
  nearestUniversity: "Rutgers University-New Brunswick";
  housemates: Housemate[];
}

export interface Roommate {
  id: string;
  name: string;
  year: "Freshman" | "Sophomore" | "Junior" | "Senior" | "Graduate";
  major: string;
  budget: number;
  bio: string;
  interests: string[];
  traits: string[];
  avatar: string;
  preferredCampuses: RutgersCampus[];
  preferredNeighborhoods: string[];
  moveInWindow: string;
  currentListingId: string;
}

export const campusLabels: Record<RutgersCampus, string> = {
  livingston: "Livingston",
  college_avenue: "College Avenue",
  cook_douglass: "Cook/Douglass",
  busch: "Busch",
};

export const campuses: RutgersCampus[] = [
  "livingston",
  "college_avenue",
  "cook_douglass",
  "busch",
];

export const universities = ["Rutgers University-New Brunswick"];

export const neighborhoods = [
  "College Ave/Easton Ave",
  "Downtown New Brunswick",
  "Socam 290",
  "Highland Park",
  "Piscataway",
  "Cook/Douglass Village",
];

export const listings: Listing[] = [
  {
    id: "l1",
    title: "112 Sicard St",
    price: 920,
    bedrooms: 3,
    bathrooms: 2,
    type: "private_room",
    livingType: "off_campus",
    neighborhood: "College Ave/Easton Ave",
    township: "New Brunswick",
    campus: "college_avenue",
    address: "112 Sicard St, New Brunswick, NJ",
    distanceToCampus: 0.4,
    amenities: ["WiFi", "Washer/Dryer", "Furnished", "Study Room"],
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
    ],
    isFeatured: true,
    availableRooms: 1,
    utilitiesIncluded: true,
    petsAllowed: false,
    furnished: true,
    parking: false,
    description:
      "Walkable to College Ave classes, buses, and dining. Quiet weekday rhythm and organized shared kitchen.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [
      {
        id: "h11",
        name: "Nia",
        year: "Junior",
        major: "Biology",
        traits: ["clean", "early-riser", "quiet"],
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
      },
      {
        id: "h12",
        name: "Sam",
        year: "Senior",
        major: "Economics",
        traits: ["social", "gym", "respectful"],
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
      },
    ],
  },
  {
    id: "l2",
    title: "55 Bartholomew Rd",
    price: 860,
    bedrooms: 4,
    bathrooms: 2,
    type: "private_room",
    livingType: "off_campus",
    neighborhood: "Piscataway",
    township: "Piscataway",
    campus: "busch",
    address: "55 Bartholomew Rd, Piscataway, NJ",
    distanceToCampus: 0.7,
    amenities: ["WiFi", "Parking", "Dishwasher", "Gym Access"],
    images: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
      "https://images.unsplash.com/photo-1486304873000-235643847519?w=1200",
    ],
    isFeatured: true,
    availableRooms: 2,
    utilitiesIncluded: false,
    petsAllowed: false,
    furnished: false,
    parking: true,
    description:
      "Strong fit for Busch commuters. Includes driveway parking and a large common room for project work.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [
      {
        id: "h21",
        name: "Owen",
        year: "Junior",
        major: "Mechanical Engineering",
        traits: ["tidy", "night-owl", "focused"],
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
      },
      {
        id: "h22",
        name: "Priya",
        year: "Senior",
        major: "CS",
        traits: ["friendly", "planner", "cook"],
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
      },
      {
        id: "h23",
        name: "Leo",
        year: "Graduate",
        major: "Data Science",
        traits: ["quiet", "clean", "runner"],
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
      },
    ],
  },
  {
    id: "l3",
    title: "40 George St",
    price: 710,
    bedrooms: 3,
    bathrooms: 1,
    type: "shared_room",
    livingType: "off_campus",
    neighborhood: "Cook/Douglass Village",
    township: "New Brunswick",
    campus: "cook_douglass",
    address: "40 George St, New Brunswick, NJ",
    distanceToCampus: 0.5,
    amenities: ["WiFi", "Bike Storage", "Washer/Dryer", "Backyard"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200",
      "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=1200",
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200",
    ],
    isFeatured: false,
    availableRooms: 1,
    utilitiesIncluded: true,
    petsAllowed: true,
    furnished: true,
    parking: false,
    description:
      "Cozy shared setup close to Cook/Douglass routes. Relaxed house culture with a simple chore rotation.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [
      {
        id: "h31",
        name: "Mia",
        year: "Sophomore",
        major: "Nutrition",
        traits: ["creative", "clean", "veggie-cook"],
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
      },
      {
        id: "h32",
        name: "Drew",
        year: "Junior",
        major: "Environmental Science",
        traits: ["outdoorsy", "quiet", "organized"],
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
      },
    ],
  },
  {
    id: "l4",
    title: "290 George St",
    price: 980,
    bedrooms: 2,
    bathrooms: 1,
    type: "private_room",
    livingType: "off_campus",
    neighborhood: "Socam 290",
    township: "New Brunswick",
    campus: "livingston",
    address: "290 George St, New Brunswick, NJ",
    distanceToCampus: 0.8,
    amenities: ["WiFi", "Furnished", "Laundry in Building", "Study Room"],
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200",
    ],
    isFeatured: false,
    availableRooms: 1,
    utilitiesIncluded: true,
    petsAllowed: false,
    furnished: true,
    parking: false,
    description:
      "Modern and calm setup with strong WiFi and dedicated desk area, ideal for Livingston routines.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [
      {
        id: "h41",
        name: "Aria",
        year: "Graduate",
        major: "Public Health",
        traits: ["quiet", "morning-runner", "clean"],
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
      },
    ],
  },
  {
    id: "l5",
    title: "311 Raritan Ave",
    price: 790,
    bedrooms: 5,
    bathrooms: 2,
    type: "private_room",
    livingType: "off_campus",
    neighborhood: "Highland Park",
    township: "Highland Park",
    campus: "college_avenue",
    address: "311 Raritan Ave, Highland Park, NJ",
    distanceToCampus: 1.4,
    amenities: ["WiFi", "Parking", "Washer/Dryer", "Porch", "Study Room"],
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1486304873000-235643847519?w=1200",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200",
    ],
    isFeatured: true,
    availableRooms: 2,
    utilitiesIncluded: false,
    petsAllowed: true,
    furnished: false,
    parking: true,
    description:
      "Larger shared house with porch, driveway parking, and a social + focused roommate mix.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [
      {
        id: "h51",
        name: "Ethan",
        year: "Junior",
        major: "Finance",
        traits: ["social", "sports-fan", "respectful"],
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
      },
      {
        id: "h52",
        name: "Noor",
        year: "Senior",
        major: "Chemistry",
        traits: ["quiet", "clean", "planner"],
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
      },
      {
        id: "h53",
        name: "Kai",
        year: "Sophomore",
        major: "Psychology",
        traits: ["friendly", "night-owl", "gamer"],
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
      },
    ],
  },
  {
    id: "l6",
    title: "780 George St",
    price: 1030,
    bedrooms: 3,
    bathrooms: 2,
    type: "entire_place",
    livingType: "off_campus",
    neighborhood: "Downtown New Brunswick",
    township: "New Brunswick",
    campus: "college_avenue",
    address: "780 George St, New Brunswick, NJ",
    distanceToCampus: 0.9,
    amenities: ["WiFi", "Gym Access", "Dishwasher", "Furnished"],
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=1200",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
    ],
    isFeatured: false,
    availableRooms: 1,
    utilitiesIncluded: true,
    petsAllowed: false,
    furnished: true,
    parking: false,
    description:
      "Quick access to New Brunswick station and Rutgers buses. Great fit for students splitting a full unit.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [],
  },
  {
    id: "d1",
    title: "B.E.S.T. Hall",
    price: 1450,
    bedrooms: 1,
    bathrooms: 1,
    type: "shared_room",
    livingType: "on_campus",
    neighborhood: "Livingston Campus",
    township: "Piscataway",
    campus: "livingston",
    address: "BEST Hall, Livingston Campus",
    distanceToCampus: 0.1,
    amenities: ["WiFi", "Study Lounges", "Dining Hall Nearby"],
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e460b8d5?w=1200",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200",
      "https://images.unsplash.com/photo-1616594039964-99852f0f0e6d?w=1200",
    ],
    isFeatured: true,
    availableRooms: 8,
    utilitiesIncluded: true,
    petsAllowed: false,
    furnished: true,
    parking: false,
    description: "Modern dorm option close to classes, dining, and student resources.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [],
  },
  {
    id: "d2",
    title: "Brower / Hardenbergh Halls",
    price: 1280,
    bedrooms: 1,
    bathrooms: 1,
    type: "shared_room",
    livingType: "on_campus",
    neighborhood: "College Avenue Campus",
    township: "New Brunswick",
    campus: "college_avenue",
    address: "College Avenue Residence Halls",
    distanceToCampus: 0.1,
    amenities: ["WiFi", "Dining Hall Nearby", "Laundry in Building"],
    images: [
      "https://images.unsplash.com/photo-1520986606214-8b456906c813?w=1200",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200",
      "https://images.unsplash.com/photo-1529429617124-aee711c44ed9?w=1200",
    ],
    isFeatured: false,
    availableRooms: 14,
    utilitiesIncluded: true,
    petsAllowed: false,
    furnished: true,
    parking: false,
    description: "Classic College Ave living close to classes, events, and transit.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [],
  },
  {
    id: "d3",
    title: "Starkey Apartments",
    price: 1360,
    bedrooms: 2,
    bathrooms: 1,
    type: "shared_room",
    livingType: "on_campus",
    neighborhood: "Cook/Douglass Campus",
    township: "New Brunswick",
    campus: "cook_douglass",
    address: "Starkey Apartments, Cook/Douglass",
    distanceToCampus: 0.2,
    amenities: ["WiFi", "Kitchen", "Laundry in Building"],
    images: [
      "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200",
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
    ],
    isFeatured: false,
    availableRooms: 6,
    utilitiesIncluded: true,
    petsAllowed: false,
    furnished: true,
    parking: false,
    description: "Apartment-style dorm living with kitchen access and quieter surroundings.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [],
  },
  {
    id: "d4",
    title: "Busch Suites",
    price: 1390,
    bedrooms: 2,
    bathrooms: 1,
    type: "shared_room",
    livingType: "on_campus",
    neighborhood: "Busch Campus",
    township: "Piscataway",
    campus: "busch",
    address: "Busch Residence Suites",
    distanceToCampus: 0.2,
    amenities: ["WiFi", "Suite Common Area", "Study Lounges"],
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200",
    ],
    isFeatured: true,
    availableRooms: 10,
    utilitiesIncluded: true,
    petsAllowed: false,
    furnished: true,
    parking: false,
    description: "Suite-style dorm option designed for practical campus living and easy routines.",
    nearestUniversity: "Rutgers University-New Brunswick",
    housemates: [],
  },
];

export const offCampusListings = listings.filter((listing) => listing.livingType === "off_campus");
export const dormitories = listings.filter((listing) => listing.livingType === "on_campus");

export const roommates: Roommate[] = [
  {
    id: "r1",
    name: "Alex Carter",
    year: "Junior",
    major: "Computer Science",
    budget: 950,
    bio: "Busch student who likes clean common spaces and calm weeknights.",
    interests: ["coding", "basketball", "coffee"],
    traits: ["clean", "quiet", "organized"],
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    preferredCampuses: ["busch", "livingston"],
    preferredNeighborhoods: ["Piscataway", "Socam 290"],
    moveInWindow: "Aug 10 - Aug 28",
    currentListingId: "l2",
  },
  {
    id: "r2",
    name: "Maya Patel",
    year: "Senior",
    major: "Biology",
    budget: 1100,
    bio: "Pre-med on Cook/Douglass looking for respectful roommates and early sleep schedule.",
    interests: ["running", "meal prep", "podcasts"],
    traits: ["early-riser", "quiet", "clean"],
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    preferredCampuses: ["cook_douglass", "college_avenue"],
    preferredNeighborhoods: ["Cook/Douglass Village", "College Ave/Easton Ave"],
    moveInWindow: "Jul 20 - Aug 15",
    currentListingId: "l3",
  },
  {
    id: "r3",
    name: "Jordan Lee",
    year: "Graduate",
    major: "Architecture",
    budget: 1200,
    bio: "Design grad student who keeps things low-key during the week.",
    interests: ["photography", "design", "climbing"],
    traits: ["night-owl", "respectful", "quiet"],
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
    preferredCampuses: ["college_avenue"],
    preferredNeighborhoods: ["Downtown New Brunswick"],
    moveInWindow: "Anytime",
    currentListingId: "l1",
  },
  {
    id: "r4",
    name: "Sofia Nguyen",
    year: "Sophomore",
    major: "Finance",
    budget: 860,
    bio: "Livingston-based student, social but consistent about chores and house rules.",
    interests: ["gym", "cooking", "movies"],
    traits: ["social", "clean", "planner"],
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
    preferredCampuses: ["livingston", "busch"],
    preferredNeighborhoods: ["Socam 290", "Piscataway"],
    moveInWindow: "Aug 1 - Sep 1",
    currentListingId: "l4",
  },
  {
    id: "r5",
    name: "Daniel Brooks",
    year: "Junior",
    major: "Mechanical Engineering",
    budget: 920,
    bio: "Busch engineering student, friendly and usually in labs or library on weekdays.",
    interests: ["gaming", "basketball", "3D printing"],
    traits: ["night-owl", "friendly", "respectful"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    preferredCampuses: ["busch"],
    preferredNeighborhoods: ["Piscataway"],
    moveInWindow: "Aug 15 - Sep 10",
    currentListingId: "l2",
  },
  {
    id: "r6",
    name: "Hannah Kim",
    year: "Senior",
    major: "Psychology",
    budget: 980,
    bio: "College Ave student who balances study routines with a social weekend schedule.",
    interests: ["reading", "yoga", "music"],
    traits: ["clean", "social", "organized"],
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
    preferredCampuses: ["college_avenue", "cook_douglass"],
    preferredNeighborhoods: ["College Ave/Easton Ave", "Downtown New Brunswick"],
    moveInWindow: "Aug 1 - Aug 25",
    currentListingId: "l5",
  },
];

export const listingById = Object.fromEntries(listings.map((listing) => [listing.id, listing]));
