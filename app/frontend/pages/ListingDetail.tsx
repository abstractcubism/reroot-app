import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, MapPin, GraduationCap, Users, Building2 } from "lucide-react";
import { campusLabels, listings } from "../data/mockData";
import type { Listing } from "../data/mockData";

const listingTypeLabels: Record<Listing["type"], string> = {
  private_room: "Private Room (Your Own Bedroom)",
  shared_room: "Shared Room (With Roommate)",
  entire_place: "Entire House Rental",
};

export function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(() => listings.find((item) => item.id === id) ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setListing(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const loadListing = async () => {
      try {
        const response = await fetch(`/api/housing/listings/${id}`);
        if (!response.ok) throw new Error(`Listing request failed: ${response.status}`);
        const payload = await response.json();
        const item = payload?.item as Listing | undefined;
        if (!cancelled && item) {
          setListing(item);
          return;
        }
      } catch {
        // Fall back to local mock listing if live API lookup fails.
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (!cancelled) {
        setListing(listings.find((entry) => entry.id === id) ?? null);
      }
    };

    void loadListing();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!listing && !loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Listing not found</h1>
        <p className="mt-2 text-gray-600">The listing may have been removed or the link is invalid.</p>
        <Link
          to="/listings"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-gray-600">Loading listing...</p>
      </div>
    );
  }

  const inRoomRoommate = listing.type === "shared_room" ? listing.housemates[0] : null;
  const [image1, image2, image3] = [listing.images[0], listing.images[1] ?? listing.images[0], listing.images[2] ?? listing.images[0]];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/listings" className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800">
        <ArrowLeft className="h-4 w-4" />
        All listings
      </Link>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <img src={image1} alt={listing.title} className="h-80 w-full rounded-2xl object-cover md:col-span-2" />
        <div className="grid grid-rows-2 gap-4">
          <img src={image2} alt={listing.title} className="h-full w-full rounded-2xl object-cover" />
          <img src={image3} alt={listing.title} className="h-full w-full rounded-2xl object-cover" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {listing.neighborhood}
            </span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              Campus: {campusLabels[listing.campus]}
            </span>
            <span>{listing.distanceToCampus} miles from campus</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700">
              {listing.livingType === "on_campus" ? "On-Campus Dormitory" : "Off-Campus Housing"}
            </span>
            {listing.livingType === "off_campus" ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                {listingTypeLabels[listing.type]}
              </span>
            ) : null}
          </div>

          <p className="mt-6 leading-relaxed text-gray-700">{listing.description}</p>

          <h2 className="mt-8 text-xl font-semibold text-gray-900">Amenities</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {listing.amenities.map((amenity) => (
              <span key={amenity} className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                {amenity}
              </span>
            ))}
          </div>

          {listing.livingType === "off_campus" && (
            <>
              <h2 className="mt-8 text-xl font-semibold text-gray-900">People in this house</h2>
              <p className="mt-2 text-sm font-medium text-emerald-700">{listingTypeLabels[listing.type]}</p>
              {listing.type === "entire_place" ? (
                <p className="mt-3 text-sm text-gray-600">
                  This listing is for the entire house. No fixed housemates are assigned.
                </p>
              ) : listing.housemates.length === 0 ? (
                <p className="mt-3 text-sm text-gray-600">
                  No housemates listed yet. This unit is still open for roommate matching.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {inRoomRoommate ? (
                    <article className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">In-room roommate</p>
                      <div className="flex items-center gap-2">
                        <img
                          src={inRoomRoommate.avatar}
                          alt={inRoomRoommate.name}
                          className="h-9 w-9 rounded-full bg-white object-cover"
                        />
                        <div>
                          <p className="font-semibold text-emerald-900">{inRoomRoommate.name}</p>
                          <p className="mt-0.5 text-xs text-emerald-700">
                            {inRoomRoommate.year} - {inRoomRoommate.major}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {inRoomRoommate.traits.map((trait) => (
                          <span key={trait} className="rounded-full bg-white px-2 py-0.5 text-xs text-emerald-700">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </article>
                  ) : null}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {listing.housemates.slice(inRoomRoommate ? 1 : 0).map((person) => (
                    <article key={person.id} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="h-9 w-9 rounded-full bg-white object-cover"
                        />
                        <div>
                          <p className="font-semibold text-emerald-900">{person.name}</p>
                          <p className="mt-0.5 text-xs text-emerald-700">
                            {person.year} - {person.major}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {person.traits.map((trait) => (
                          <span key={trait} className="rounded-full bg-white px-2 py-0.5 text-xs text-emerald-700">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Monthly Rent</p>
          {listing.price > 0 ? (
            <p className="mt-1 text-3xl font-bold text-gray-900">${listing.price}</p>
          ) : (
            <p className="mt-1 text-lg font-semibold text-gray-700">Price varies by unit</p>
          )}

          <div className="mt-5 space-y-2 text-sm text-gray-700">
            <p>
              {listing.bedrooms} bedrooms, {listing.bathrooms} bathrooms
            </p>
            <p>{listingTypeLabels[listing.type]}</p>
            <p>{listing.availableRooms} room(s) currently available</p>
            <p>{listing.utilitiesIncluded ? "Utilities included" : "Utilities not included"}</p>
            <p>{listing.furnished ? "Furnished" : "Unfurnished"}</p>
            <p>{listing.parking ? "Parking available" : "No parking"}</p>
            <p>{listing.petsAllowed ? "Pets allowed" : "No pets"}</p>
          </div>

          <button className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 text-white hover:bg-emerald-700">
            Request a Tour
          </button>
          <button className="mt-3 w-full rounded-lg border border-gray-200 py-2.5 text-gray-700 hover:bg-gray-50">
            Message Contact
          </button>

          <div className="mt-5 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
            <div className="flex items-center gap-2 text-emerald-800">
              <GraduationCap className="h-3.5 w-3.5" />
              Campus: {campusLabels[listing.campus]}
            </div>
            {listing.livingType === "off_campus" ? (
              <div className="mt-1 flex items-center gap-2 text-emerald-800">
                <Users className="h-3.5 w-3.5" />
                {listing.housemates.length} listed housemate profile(s)
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2 text-emerald-800">
                <Building2 className="h-3.5 w-3.5" />
                On-campus dormitory option
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
