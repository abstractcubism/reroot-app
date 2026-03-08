import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Search,
  MapPin,
  SlidersHorizontal,
  X,
  Wifi,
  Car,
  Shirt,
  Dumbbell,
  ChevronDown,
  Users,
  Building2,
  Home,
} from "lucide-react";
import { campusLabels, campuses, listings as fallbackListings, neighborhoods } from "../data/mockData";
import type { Listing, LivingType, RutgersCampus } from "../data/mockData";

const amenityIcons: Record<string, ReactNode> = {
  WiFi: <Wifi className="h-3.5 w-3.5" />,
  Parking: <Car className="h-3.5 w-3.5" />,
  "Washer/Dryer": <Shirt className="h-3.5 w-3.5" />,
  "Gym Access": <Dumbbell className="h-3.5 w-3.5" />,
};
const listingTypeLabels: Record<Listing["type"], string> = {
  private_room: "Private Room",
  shared_room: "Shared Room",
  entire_place: "Entire House",
};
const listingTypeDetails: Record<Listing["type"], string> = {
  private_room: "Your own bedroom in a shared house.",
  shared_room: "Shared bedroom with another student.",
  entire_place: "Entire home rental, no fixed housemates required.",
};

type SortOption = "price_asc" | "price_desc" | "distance";
type ListingTypeFilter = Listing["type"] | "all";

const isLivingType = (value: string | null): value is LivingType => value === "off_campus" || value === "on_campus";
const isSortOption = (value: string | null): value is SortOption =>
  value === "distance" || value === "price_asc" || value === "price_desc";
const isListingTypeFilter = (value: string | null): value is ListingTypeFilter =>
  value === "all" || value === "private_room" || value === "shared_room" || value === "entire_place";

const DEFAULT_MIN_PRICE = 600;
const DEFAULT_MAX_PRICE = 1500;
const DEFAULT_MAX_DISTANCE = 2;

const parseNumberParam = (value: string | null, fallback: number, min: number, max: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const parseListParam = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    : [];

const parseBooleanParam = (value: string | null) => value === "1";

export function ListingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [livingType, setLivingType] = useState<LivingType>(() =>
    isLivingType(searchParams.get("living")) ? (searchParams.get("living") as LivingType) : "off_campus"
  );
  const [apiListings, setApiListings] = useState<Listing[] | null>(null);
  const [listingsSource, setListingsSource] = useState<string>("fallback");
  const [listingsLoadError, setListingsLoadError] = useState<string | null>(null);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const minPrice = parseNumberParam(searchParams.get("minPrice"), DEFAULT_MIN_PRICE, 0, 3000);
    const maxPrice = parseNumberParam(searchParams.get("maxPrice"), DEFAULT_MAX_PRICE, minPrice, 3000);
    return [minPrice, maxPrice];
  });
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>(() =>
    parseListParam(searchParams.get("neighborhoods"))
  );
  const [selectedCampuses, setSelectedCampuses] = useState<RutgersCampus[]>(() =>
    parseListParam(searchParams.get("campuses")).filter((campus): campus is RutgersCampus =>
      campuses.includes(campus as RutgersCampus)
    )
  );
  const [listingType, setListingType] = useState<ListingTypeFilter>(() =>
    isListingTypeFilter(searchParams.get("type")) ? (searchParams.get("type") as ListingTypeFilter) : "all"
  );
  const [maxDistance, setMaxDistance] = useState<number>(() =>
    parseNumberParam(searchParams.get("maxDistance"), DEFAULT_MAX_DISTANCE, 0.1, 5)
  );
  const [sortBy, setSortBy] = useState<SortOption>(() =>
    isSortOption(searchParams.get("sort")) ? (searchParams.get("sort") as SortOption) : "distance"
  );
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(() => parseBooleanParam(searchParams.get("utilities")));
  const [petsAllowed, setPetsAllowed] = useState(() => parseBooleanParam(searchParams.get("pets")));
  const [furnished, setFurnished] = useState(() => parseBooleanParam(searchParams.get("furnished")));
  const [parking, setParking] = useState(() => parseBooleanParam(searchParams.get("parking")));
  const listingPool = apiListings && apiListings.length > 0 ? apiListings : fallbackListings;
  const currentSearch = searchParams.toString();

  useEffect(() => {
    const nextParams = new URLSearchParams();
    nextParams.set("living", livingType);

    const normalizedQuery = query.trim();
    if (normalizedQuery) nextParams.set("q", normalizedQuery);
    if (sortBy !== "distance") nextParams.set("sort", sortBy);
    if (priceRange[0] !== DEFAULT_MIN_PRICE) nextParams.set("minPrice", String(priceRange[0]));
    if (priceRange[1] !== DEFAULT_MAX_PRICE) nextParams.set("maxPrice", String(priceRange[1]));
    if (maxDistance !== DEFAULT_MAX_DISTANCE) nextParams.set("maxDistance", String(maxDistance));
    if (listingType !== "all") nextParams.set("type", listingType);
    if (selectedNeighborhoods.length > 0) nextParams.set("neighborhoods", selectedNeighborhoods.join(","));
    if (selectedCampuses.length > 0) nextParams.set("campuses", selectedCampuses.join(","));
    if (utilitiesIncluded) nextParams.set("utilities", "1");
    if (petsAllowed) nextParams.set("pets", "1");
    if (furnished) nextParams.set("furnished", "1");
    if (parking) nextParams.set("parking", "1");

    if (nextParams.toString() !== currentSearch) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    currentSearch,
    furnished,
    listingType,
    livingType,
    maxDistance,
    parking,
    petsAllowed,
    priceRange,
    query,
    selectedCampuses,
    selectedNeighborhoods,
    setSearchParams,
    sortBy,
    utilitiesIncluded,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadListings = async () => {
      setIsLoadingListings(true);
      try {
        const response = await fetch("/api/housing/listings");
        if (!response.ok) throw new Error(`Listing request failed: ${response.status}`);
        const payload = await response.json();
        const items = Array.isArray(payload?.items) ? (payload.items as Listing[]) : [];
        const source = typeof payload?.source === "string" ? payload.source : "backend-seeded";

        if (!cancelled) {
          if (items.length > 0) {
            setApiListings(items);
            setListingsSource(source);
            setListingsLoadError(null);
          } else {
            setApiListings(null);
            setListingsSource("fallback");
          }
        }
      } catch {
        if (!cancelled) {
          setApiListings(null);
          setListingsSource("fallback");
          setListingsLoadError("Backend unavailable. Showing local fallback listings.");
        }
      } finally {
        if (!cancelled) setIsLoadingListings(false);
      }
    };

    void loadListings();
    return () => {
      cancelled = true;
    };
  }, []);

  const neighborhoodOptions = useMemo(() => {
    return Array.from(new Set([...neighborhoods, ...listingPool.map((listing) => listing.neighborhood)])).sort();
  }, [listingPool]);

  const filtered = useMemo(() => {
    let result: Listing[] = listingPool.filter((listing) => listing.livingType === livingType);

    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.neighborhood.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          campusLabels[l.campus].toLowerCase().includes(q) ||
          l.housemates.some((person) => `${person.name} ${person.major} ${person.traits.join(" ")}`.toLowerCase().includes(q))
      );
    }

    result = result.filter((l) => l.price <= 0 || (l.price >= priceRange[0] && l.price <= priceRange[1]));
    result = result.filter((l) => l.distanceToCampus <= maxDistance);

    if (selectedNeighborhoods.length > 0) result = result.filter((l) => selectedNeighborhoods.includes(l.neighborhood));
    if (selectedCampuses.length > 0) result = result.filter((l) => selectedCampuses.includes(l.campus));
    if (listingType !== "all") result = result.filter((l) => l.type === listingType);
    if (utilitiesIncluded) result = result.filter((l) => l.utilitiesIncluded);
    if (petsAllowed) result = result.filter((l) => l.petsAllowed);
    if (furnished) result = result.filter((l) => l.furnished);
    if (parking) result = result.filter((l) => l.parking);

    return [...result].sort((a, b) => {
      if (sortBy === "price_asc") {
        const aPrice = a.price > 0 ? a.price : Number.MAX_SAFE_INTEGER;
        const bPrice = b.price > 0 ? b.price : Number.MAX_SAFE_INTEGER;
        return aPrice - bPrice;
      }
      if (sortBy === "price_desc") {
        const aPrice = a.price > 0 ? a.price : -1;
        const bPrice = b.price > 0 ? b.price : -1;
        return bPrice - aPrice;
      }
      return a.distanceToCampus - b.distanceToCampus;
    });
  }, [
    livingType,
    query,
    priceRange,
    selectedNeighborhoods,
    selectedCampuses,
    listingType,
    maxDistance,
    sortBy,
    utilitiesIncluded,
    petsAllowed,
    furnished,
    parking,
    listingPool,
  ]);

  const toggleNeighborhood = (value: string) => {
    setSelectedNeighborhoods((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const toggleCampus = (value: RutgersCampus) => {
    setSelectedCampuses((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const clearFilters = () => {
    setPriceRange([DEFAULT_MIN_PRICE, DEFAULT_MAX_PRICE]);
    setSelectedNeighborhoods([]);
    setSelectedCampuses([]);
    setListingType("all");
    setMaxDistance(DEFAULT_MAX_DISTANCE);
    setUtilitiesIncluded(false);
    setPetsAllowed(false);
    setFurnished(false);
    setParking(false);
  };

  const activeFilterCount = [
    priceRange[0] !== DEFAULT_MIN_PRICE || priceRange[1] !== DEFAULT_MAX_PRICE,
    selectedNeighborhoods.length > 0,
    selectedCampuses.length > 0,
    listingType !== "all",
    maxDistance !== DEFAULT_MAX_DISTANCE,
    utilitiesIncluded,
    petsAllowed,
    furnished,
    parking,
  ].filter(Boolean).length;
  const listingsSourceLabel = useMemo(() => {
    if (isLoadingListings) return "Loading seeded listings...";
    if (listingsSource === "rutgers-dataset") return "Source: Rutgers housing dataset";
    if (listingsSource === "local-snapshot") return "Source: Local imported snapshot";
    if (listingsSource === "demo-seeded") return "Source: Demo seed data";
    if (listingsSource === "fallback") return "Source: Local fallback";
    return "Source: Backend listings";
  }, [isLoadingListings, listingsSource]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-16 z-30 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-3 grid grid-cols-2 gap-2 md:w-[420px]">
            <button
              type="button"
              onClick={() => setLivingType("off_campus")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                livingType === "off_campus" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Home className="h-4 w-4" /> Off-Campus Houses
            </button>
            <button
              type="button"
              onClick={() => setLivingType("on_campus")}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                livingType === "on_campus" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Building2 className="h-4 w-4" /> Dormitories
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5">
              <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <input
                type="text"
                placeholder={livingType === "off_campus" ? "Search houses, campus, or traits..." : "Search dorms by campus..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-emerald-600">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="relative hidden md:block">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-8 text-sm text-gray-700 outline-none hover:border-gray-300"
              >
                <option value="distance">Nearest Campus</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mx-auto mt-4 max-w-7xl rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => {
                      const nextMin = parseNumberParam(e.target.value, priceRange[0], 0, priceRange[1]);
                      setPriceRange([nextMin, priceRange[1]]);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                    min={0}
                    max={priceRange[1]}
                  />
                  <span className="flex-shrink-0 text-sm text-gray-400">-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => {
                      const nextMax = parseNumberParam(e.target.value, priceRange[1], priceRange[0], 3000);
                      setPriceRange([priceRange[0], nextMax]);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                    min={priceRange[0]}
                    max={3000}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700">Max Distance: {maxDistance} mi</label>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.1}
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(+e.target.value)}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700">Listing Type</label>
                <div className="flex flex-col gap-1.5">
                  {([
                    { value: "all", label: "All Types" },
                    { value: "private_room", label: "Private Room (Your Own)" },
                    { value: "entire_place", label: "Entire House" },
                    { value: "shared_room", label: "Shared Room (With Roommate)" },
                  ] as const).map((opt) => (
                    <label key={opt.value} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="type"
                        value={opt.value}
                        checked={listingType === opt.value}
                        onChange={() => setListingType(opt.value)}
                        className="accent-emerald-600"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700">Extras</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: utilitiesIncluded, setter: setUtilitiesIncluded, label: "Utilities Included" },
                    { value: petsAllowed, setter: setPetsAllowed, label: "Pets Allowed" },
                    { value: furnished, setter: setFurnished, label: "Furnished" },
                    { value: parking, setter: setParking, label: "Parking" },
                  ].map((extra) => (
                    <label key={extra.label} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={extra.value}
                        onChange={(e) => extra.setter(e.target.checked)}
                        className="accent-emerald-600"
                      />
                      <span className="text-sm text-gray-700">{extra.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700">Rutgers Campuses</label>
              <div className="flex flex-wrap gap-2">
                {campuses.map((campus) => (
                  <button
                    key={campus}
                    type="button"
                    onClick={() => toggleCampus(campus)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selectedCampuses.includes(campus)
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                    }`}
                  >
                    {campusLabels[campus]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700">Neighborhoods</label>
              <div className="flex flex-wrap gap-2">
                {neighborhoodOptions.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleNeighborhood(value)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selectedNeighborhoods.includes(value)
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="mt-4 text-sm font-medium text-red-500 hover:text-red-700">
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <strong className="text-gray-900">{filtered.length}</strong> results in {livingType === "off_campus" ? "off-campus houses" : "dormitories"}
          </p>
          <div className="text-right text-xs text-gray-500">
            {listingsSourceLabel}
            {listingsLoadError ? <p className="mt-1 text-red-500">{listingsLoadError}</p> : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <h3 className="mb-2 font-semibold text-gray-900">No listings match your filters</h3>
            <p className="mb-4 text-sm text-gray-500">Try adjusting your search or clearing some filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-lg border border-emerald-200 px-4 py-2 text-sm text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const inRoomRoommate = listing.type === "shared_room" ? listing.housemates[0] : null;
  const listingTypeLabel = listingTypeLabels[listing.type];
  const roomsLabel = listing.type === "entire_place"
    ? "Entire House Available"
    : listing.availableRooms === 1
      ? "1 Room Available"
      : `${listing.availableRooms} Rooms Available`;

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group self-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={listing.images[0]}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 flex gap-1.5">
          {listing.isFeatured && (
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">Featured</span>
          )}
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
            {campusLabels[listing.campus]}
          </span>
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-emerald-800">
          {roomsLabel}
        </div>
        <div className="absolute bottom-3 left-3 rounded-full bg-emerald-600/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {listingTypeLabel}
        </div>
        <div className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-3 py-1.5 text-sm font-bold text-gray-900 backdrop-blur-sm">
          {listing.price > 0 ? `$${listing.price}` : (
            <span className="text-xs font-semibold text-gray-600">Price varies</span>
          )}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-gray-900 transition-colors group-hover:text-emerald-700">
            {listing.title}
          </h3>
          <p className="shrink-0 text-right text-xs font-semibold text-gray-600">
            {listing.bedrooms} bd - {listing.bathrooms} ba
          </p>
        </div>

        <div className="mb-3 mt-2 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{listing.township}</span>
          <span className="ml-auto flex-shrink-0 text-xs font-medium text-emerald-600">{listing.distanceToCampus} mi</span>
        </div>

        {listing.livingType === "off_campus" ? (
          <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 p-2.5">
            <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              <Users className="h-3.5 w-3.5" /> People in house
            </p>
            <p className="mb-2 text-xs font-medium text-emerald-800">{listingTypeDetails[listing.type]}</p>
            {listing.type === "entire_place" ? (
              <p className="text-xs text-emerald-700">Lease the whole property; no existing housemates assigned.</p>
            ) : listing.housemates.length === 0 ? (
              <p className="text-xs text-emerald-700">No housemates listed yet. Listing is still active for roommates.</p>
            ) : (
              <div className="space-y-2">
                {inRoomRoommate ? (
                  <div className="rounded-lg border border-emerald-300 bg-white p-2.5">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">In-room roommate</p>
                    <div className="flex items-center gap-2 text-xs text-emerald-900">
                      <img
                        src={inRoomRoommate.avatar}
                        alt={inRoomRoommate.name}
                        className="h-7 w-7 rounded-full bg-white object-cover"
                      />
                      <div>
                        <span className="font-semibold">{inRoomRoommate.name}</span>
                        <span className="ml-1 text-emerald-700">{inRoomRoommate.traits.slice(0, 2).join(" + ")}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
                {listing.housemates.slice(inRoomRoommate ? 1 : 0, inRoomRoommate ? 3 : 2).map((person) => (
                  <div key={person.id} className="flex items-center gap-2 text-xs text-emerald-900">
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="h-6 w-6 rounded-full bg-white object-cover"
                    />
                    <div>
                      <span className="font-medium">{person.name}</span>
                      <span className="ml-1 text-emerald-700">{person.traits.slice(0, 2).join(" + ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            On-campus residence hall with student-support amenities.
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-1.5">
          {listing.amenities.slice(0, 3).map((item) => (
            <span key={item} className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
              {amenityIcons[item]}
              {item}
            </span>
          ))}
          {listing.amenities.length > 3 && (
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500">+{listing.amenities.length - 3}</span>
          )}
        </div>

      </div>
    </Link>
  );
}
