import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Search, MapPin, Users, Home, Building2, HousePlus } from "lucide-react";
import { campusLabels, dormitories, listingById, offCampusListings, roommates } from "../data/mockData";
import type { Listing, RutgersCampus } from "../data/mockData";
import { BackgroundLines } from "../components/ui/background-lines";
import { ThreeDMarquee, type MarqueeCard } from "../components/ui/three-d-marquee";
import { ParallaxHeroImages } from "../components/ui/parallax-hero-images";

type HomeSearchMode = "off_campus" | "on_campus" | "roommates" | "houses";
type HomeRoommate = {
  id: string;
  name: string;
  avatar: string;
  year: string;
  major: string;
  budget: number;
  interests: string[];
  traits: string[];
  currentListingId: string;
};
type ListingSummaryLookup = Record<string, { title: string; campus: RutgersCampus }>;

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<HomeSearchMode>("off_campus");
  const [backendHousingListings, setBackendHousingListings] = useState<Listing[] | null>(null);
  const [backendRoommates, setBackendRoommates] = useState<HomeRoommate[] | null>(null);
  const [backendListingLookup, setBackendListingLookup] = useState<ListingSummaryLookup | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadHousingListings = async () => {
      try {
        const response = await fetch("/api/housing/listings");
        if (!response.ok) return;
        const payload = await response.json();
        const items = Array.isArray(payload?.items) ? (payload.items as Listing[]) : [];
        if (!cancelled && items.length > 0) {
          setBackendHousingListings(items);
        }
      } catch {
        // Fall back to local mock listings on any backend failure.
      }
    };

    void loadHousingListings();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRoommatesAndListingMap = async () => {
      try {
        const [roommatesResponse, listingsResponse] = await Promise.all([fetch("/api/roommates"), fetch("/api/listings")]);

        if (roommatesResponse.ok) {
          const roommatePayload = await roommatesResponse.json();
          const roommateItems = Array.isArray(roommatePayload?.items) ? (roommatePayload.items as HomeRoommate[]) : [];
          if (!cancelled && roommateItems.length > 0) {
            setBackendRoommates(roommateItems);
          }
        }

        if (listingsResponse.ok) {
          const listingsPayload = await listingsResponse.json();
          const listingItems = Array.isArray(listingsPayload?.items)
            ? (listingsPayload.items as Array<{ id: string; title: string; campus: RutgersCampus }>)
            : [];
          if (!cancelled && listingItems.length > 0) {
            const lookup: ListingSummaryLookup = {};
            for (const listing of listingItems) {
              lookup[listing.id] = { title: listing.title, campus: listing.campus };
            }
            setBackendListingLookup(lookup);
          }
        }
      } catch {
        // Fall back to local mock roommate profiles and listing summaries.
      }
    };

    void loadRoommatesAndListingMap();
    return () => {
      cancelled = true;
    };
  }, []);

  const housingListingPool = useMemo(
    () => backendHousingListings ?? [...offCampusListings, ...dormitories],
    [backendHousingListings]
  );

  const housingCards = useMemo<MarqueeCard[]>(
    () =>
      housingListingPool.map((listing) => ({
        id: listing.id,
        image: listing.images[0],
        eyebrow: `${campusLabels[listing.campus]} | ${listing.livingType === "on_campus" ? "Dorm" : "Off-campus"}`,
        title: listing.title,
        subtitle: listing.neighborhood,
        tag:
          listing.type === "entire_place"
            ? "Entire house"
            : listing.type === "shared_room"
              ? "Shared room"
              : `${listing.availableRooms} room${listing.availableRooms === 1 ? "" : "s"} open`,
        meta: listing.price > 0 ? `$${listing.price}` : "Price varies",
      })),
    [housingListingPool]
  );

  const roommatePool = useMemo(() => backendRoommates ?? roommates, [backendRoommates]);
  const roommateListingLookup = useMemo<ListingSummaryLookup>(() => {
    if (backendListingLookup) return backendListingLookup;
    const fallbackLookup: ListingSummaryLookup = {};
    Object.values(listingById).forEach((listing) => {
      fallbackLookup[listing.id] = { title: listing.title, campus: listing.campus };
    });
    return fallbackLookup;
  }, [backendListingLookup]);

  const roommateCards = useMemo<MarqueeCard[]>(
    () => {
      const matchPercentFromId = (id: string) => {
        let hash = 0;
        for (let index = 0; index < id.length; index += 1) {
          hash = (hash * 31 + id.charCodeAt(index)) % 997;
        }
        return 68 + (hash % 29);
      };

      return roommatePool.map((roommate) => {
        const listing = roommateListingLookup[roommate.currentListingId];
        const interestSnippet = (roommate.interests ?? []).slice(0, 2).join(" | ");
        const matchPercent = matchPercentFromId(roommate.id);

        return {
          id: roommate.id,
          image: roommate.avatar,
          eyebrow: `${roommate.year} | ${roommate.major}`,
          title: roommate.name,
          subtitle: listing ? `${listing.title} | ${campusLabels[listing.campus]}` : "Rutgers roommate profile",
          tag: interestSnippet || "interests not listed",
          meta: `${matchPercent}% match`,
        };
      });
    },
    [roommateListingLookup, roommatePool]
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    const normalizedQuery = query.trim();
    if (normalizedQuery) {
      params.set("q", normalizedQuery);
    }

    if (mode === "off_campus") {
      params.set("living", "off_campus");
      navigate(`/listings?${params.toString()}`);
      return;
    }

    if (mode === "on_campus") {
      params.set("living", "on_campus");
      navigate(`/listings?${params.toString()}`);
      return;
    }

    if (mode === "houses") {
      params.set("mode", "houses");
      navigate(`/roommates?${params.toString()}`);
      return;
    }

    params.set("mode", "roommates");
    navigate(`/roommates?${params.toString()}`);
  };

  const modePlaceholder = useMemo(() => {
    if (mode === "off_campus") return "Search houses by campus, neighborhood, or trait...";
    if (mode === "on_campus") return "Search dormitories by campus...";
    if (mode === "houses") return "Match to houses by lifestyle and budget...";
    return "Match to roommates by traits, major, or interests...";
  }, [mode]);

  return (
    <div className="min-h-screen bg-white">
      <section className="relative text-white">
        <BackgroundLines className="px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="text-4xl font-bold leading-tight md:text-6xl">
                start fresh.
                <br />
                put down new roots.
              </h1>

              <div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-2 shadow-2xl">
                <div className="mb-2 grid grid-cols-2 gap-1 md:grid-cols-4">
                  {([
                    { key: "off_campus", label: "Off-Campus Houses", icon: Home },
                    { key: "on_campus", label: "Dormitories", icon: Building2 },
                    { key: "roommates", label: "Match Roommates", icon: Users },
                    { key: "houses", label: "Match Houses", icon: HousePlus },
                  ] as const).map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setMode(item.key)}
                      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors md:text-sm ${
                        mode === item.key ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSearch();
                  }}
                >
                  <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={modePlaceholder}
                      className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <Search className="h-4 w-4" />
                    Explore
                  </button>
                </form>
              </div>
            </div>
          </div>
        </BackgroundLines>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-b from-white via-emerald-50/30 to-emerald-100/35 py-16 md:py-20">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-white via-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-emerald-100/35" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-xl shadow-emerald-100/80">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Students facing housing insecurity</p>
              <p className="mt-3 text-7xl font-black leading-none text-emerald-900 md:text-10xl">48%</p>
              <p className="mt-3 text-base font-medium text-emerald-800 md:text-lg">Finding a home that's right matters.</p>
              <p className="mt-4 max-w-xl text-sm text-gray-600 md:text-base">
                <span className="text-gray-600">re</span>
                <span className="text-emerald-600">root</span> helps students compare homes, dorms, and roommate fits in one place so finding stable housing feels possible.
              </p>
            </div>

            <div className="relative h-[32rem] overflow-hidden rounded-3xl sm:h-[36rem]">
              <ThreeDMarquee cards={housingCards} className="h-full" tilt="left" durationBase={40} durationStep={5.8} columns={3} minimumCards={12} />
            </div>
          </div>
        </div>
      </section>

      <section className="relative -mt-6 overflow-hidden bg-gradient-to-b from-emerald-100/35 via-emerald-50/25 to-white py-20 md:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-emerald-100/35 via-emerald-50/30 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div className="relative h-[32rem] overflow-hidden rounded-3xl sm:h-[36rem]">
              <ParallaxHeroImages cards={roommateCards} className="h-full" />
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-white/90 p-8 shadow-xl shadow-emerald-200/70">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">students report roommate conflict</p>
              <p className="mt-3 text-6xl font-black leading-none text-emerald-900 md:text-10xl">47.9%</p>
              <p className="mt-3 text-base font-medium text-emerald-800 md:text-lg">Good roommates matter just as much as rent and location.</p>
              <p className="mt-4 text-sm leading-relaxed text-gray-700 md:text-base">
                <span className="text-gray-600">re</span>
                <span className="text-emerald-600">root</span> combats this by matching students on lifestyle traits, shared interests, budget fit, and house context
                before move-in, then helping roommates align expectations so day-to-day living is more stable.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
