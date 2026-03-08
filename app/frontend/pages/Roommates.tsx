import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  MapPin,
  ThumbsDown,
  ThumbsUp,
  Sparkles,
  RefreshCw,
  Home,
  Users,
  Building2,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  LayoutList,
  Map as MapIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  campusLabels,
  campuses,
  listingById,
  listings,
  roommates,
  type LivingType,
  type RutgersCampus,
} from "../data/mockData";

type MatchMode = "roommates" | "houses";
type FeedbackVerdict = "like" | "dislike";
type HouseView = "list" | "map";

type LinkedHouse = {
  id: string;
  title: string;
  neighborhood: string;
  campus: RutgersCampus;
  livingType: LivingType;
  price: number;
};

type RoommateMatchSuggestion = {
  id: string;
  name: string;
  avatar: string;
  year: string;
  major: string;
  budget: number;
  bio: string;
  interests: string[];
  traits: string[];
  preferredCampuses: RutgersCampus[];
  moveInWindow: string;
  currentListingId: string;
  linkedHouse?: LinkedHouse | null;
  matchScore: number;
  matchReason: string;
  matchSignals?: string[];
};

type HouseMatchSuggestion = {
  id: string;
  title: string;
  price: number;
  neighborhood: string;
  campus: RutgersCampus;
  livingType: LivingType;
  distanceToCampus: number;
  availableRooms: number;
  recommendedRoommates: string[];
  matchScore: number;
  matchReason: string;
  matchSignals?: string[];
};

type SavedState = Record<MatchMode, Record<string, true>>;

const TRAIT_OPTIONS = [
  "clean",
  "quiet",
  "social",
  "early-riser",
  "night-owl",
  "organized",
  "friendly",
  "study-focused",
  "communicative",
  "respectful",
  "pet-friendly",
  "no-smoking",
  "guest-friendly",
  "low-key",
  "outgoing",
  "tidy kitchen",
  "chore-consistent",
  "budget-aware",
];
const INTEREST_OPTIONS = [
  "coding",
  "gym",
  "music",
  "running",
  "basketball",
  "gaming",
  "cooking",
  "reading",
  "movies",
  "photography",
  "hiking",
  "fashion",
  "campus events",
  "coffee",
  "meal prep",
  "volunteering",
  "entrepreneurship",
  "podcasts",
];
const HOUSE_FEATURE_OPTIONS = [
  "near campus",
  "budget friendly",
  "multiple rooms",
  "single room",
  "wifi",
  "washer/dryer",
  "parking",
  "furnished",
  "utilities included",
  "study space",
  "off campus",
  "on campus",
  "college avenue",
  "cook douglass",
  "busch",
  "livingston",
];
const LOCAL_SAVED_KEY = "reroot:saved:v1";

const CAMPUS_MAP_POINTS: Record<RutgersCampus, { x: number; y: number; label: string }> = {
  college_avenue: { x: 28, y: 72, label: "College Ave" },
  cook_douglass: { x: 42, y: 82, label: "Cook/Douglass" },
  busch: { x: 65, y: 35, label: "Busch" },
  livingston: { x: 76, y: 52, label: "Livingston" },
};

const isMatchMode = (value: string | null): value is MatchMode => value === "roommates" || value === "houses";

const emptySavedState = (): SavedState => ({ roommates: {}, houses: {} });

const hashToUnit = (text: string): number => {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 1000003;
  }
  return (hash % 1000) / 1000;
};

const tokenizeQuery = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);

const coveragePoints = (matchedCount: number, requestedCount: number, maxPoints: number) => {
  if (requestedCount <= 0) return 0;
  return Math.round((matchedCount / requestedCount) * maxPoints);
};

const houseFeaturesForListing = (listing: {
  distanceToCampus: number;
  price: number;
  availableRooms: number;
  livingType: LivingType;
  campus: RutgersCampus;
}) =>
  new Set(
    [
      listing.distanceToCampus <= 0.6 ? "near campus" : "farther from campus",
      listing.price <= 900 ? "budget friendly" : "premium pricing",
      listing.availableRooms >= 2 ? "multiple rooms" : "single room",
      listing.livingType === "off_campus" ? "off campus" : "on campus",
      listing.campus === "busch" || listing.campus === "livingston" || listing.livingType === "off_campus" ? "parking" : "",
      listing.livingType === "on_campus" ? "furnished" : "",
      listing.livingType === "on_campus" ? "utilities included" : "",
      "wifi",
      "washer/dryer",
      "study space",
      campusLabels[listing.campus].toLowerCase().replace("/", " "),
    ].filter((feature) => feature.length > 0)
  );

export function RoommatesPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState<MatchMode>(isMatchMode(params.get("mode")) ? (params.get("mode") as MatchMode) : "roommates");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [selectedCampus, setSelectedCampus] = useState<RutgersCampus | "any">("any");
  const [housingMode, setHousingMode] = useState<LivingType | "any">("off_campus");
  const [maxBudget, setMaxBudget] = useState(1200);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedHouseFeatures, setSelectedHouseFeatures] = useState<string[]>([]);

  const [sessionId, setSessionId] = useState<string>("");
  const [roommateMatches, setRoommateMatches] = useState<RoommateMatchSuggestion[]>([]);
  const [houseMatches, setHouseMatches] = useState<HouseMatchSuggestion[]>([]);
  const [strategy, setStrategy] = useState<string>("heuristic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [feedbackById, setFeedbackById] = useState<Record<string, FeedbackVerdict>>({});

  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});
  const [savedByMode, setSavedByMode] = useState<SavedState>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SAVED_KEY);
      if (!raw) return emptySavedState();
      const parsed = JSON.parse(raw) as Partial<SavedState>;
      return {
        roommates: parsed.roommates ?? {},
        houses: parsed.houses ?? {},
      };
    } catch {
      return emptySavedState();
    }
  });
  const [savedOnly, setSavedOnly] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [houseView, setHouseView] = useState<HouseView>("list");
  const [selectedMapHouseId, setSelectedMapHouseId] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const latestRequestRef = useRef(0);

  const sortedTraits = useMemo(() => [...selectedTraits].sort(), [selectedTraits]);
  const sortedInterests = useMemo(() => [...selectedInterests].sort(), [selectedInterests]);
  const sortedHouseFeatures = useMemo(() => [...selectedHouseFeatures].sort(), [selectedHouseFeatures]);
  const selectedHouseFeatureSet = useMemo(
    () => new Set(sortedHouseFeatures.map((feature) => feature.toLowerCase())),
    [sortedHouseFeatures]
  );
  const queryTokens = useMemo(() => tokenizeQuery(query), [query]);
  const criteriaKey = useMemo(
    () =>
      JSON.stringify({
        mode,
        query: query.trim(),
        campus: selectedCampus,
        housingMode,
        maxBudget,
        traits: sortedTraits,
        interests: sortedInterests,
        features: sortedHouseFeatures,
      }),
    [housingMode, maxBudget, mode, query, selectedCampus, sortedHouseFeatures, sortedInterests, sortedTraits]
  );

  const persistSavedState = useCallback((nextState: SavedState) => {
    setSavedByMode(nextState);
    localStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(nextState));
  }, []);

  const buildPreferences = useCallback(
    () => ({
      query,
      campus: selectedCampus === "any" ? "" : selectedCampus,
      housingMode: housingMode === "any" ? "" : housingMode,
      maxBudget,
      traits: mode === "roommates" ? sortedTraits : [],
      interests: mode === "roommates" ? sortedInterests : [],
      features: mode === "houses" ? sortedHouseFeatures : [],
    }),
    [housingMode, maxBudget, mode, query, selectedCampus, sortedHouseFeatures, sortedInterests, sortedTraits]
  );

  const fallbackRoommateMatches = useCallback((): RoommateMatchSuggestion[] => {
    return roommates
      .filter((candidate) => {
        if (housingMode !== "any") {
          const linked = listingById[candidate.currentListingId];
          if (linked && linked.livingType !== housingMode) return false;
        }
        if (selectedCampus !== "any" && !candidate.preferredCampuses.includes(selectedCampus)) return false;
        if (candidate.budget > maxBudget + 250) return false;

        const lowercaseQuery = query.trim().toLowerCase();
        if (!lowercaseQuery) return true;
        const searchable = `${candidate.name} ${candidate.major} ${candidate.bio} ${candidate.interests.join(" ")} ${candidate.traits.join(" ")}`.toLowerCase();
        return searchable.includes(lowercaseQuery);
      })
      .map((candidate) => {
        const linkedHouse = listingById[candidate.currentListingId];
        const traitSet = new Set(candidate.traits.map((item) => item.toLowerCase()));
        const interestSet = new Set(candidate.interests.map((item) => item.toLowerCase()));
        const requestedTraits = selectedTraits.map((item) => item.toLowerCase());
        const requestedInterests = selectedInterests.map((item) => item.toLowerCase());
        const matchedTraits = requestedTraits.filter((trait) => traitSet.has(trait));
        const matchedInterests = requestedInterests.filter((interest) => interestSet.has(interest));

        let score = 34;
        const signals: string[] = [];
        const reasons: string[] = [];

        if (housingMode !== "any" && linkedHouse) {
          if (linkedHouse.livingType === housingMode) {
            score += 12;
            reasons.push("matches housing mode");
            signals.push("Matches housing mode");
          } else {
            score -= 8;
          }
        }

        if (selectedCampus !== "any") {
          if (candidate.preferredCampuses.includes(selectedCampus)) {
            score += 14;
            reasons.push("same campus preference");
            signals.push("Same campus");
          } else {
            score -= 8;
          }
        }

        const budgetDelta = candidate.budget - maxBudget;
        if (budgetDelta <= 0) {
          score += 14;
          reasons.push("fits budget");
          signals.push("Budget fit");
        } else if (budgetDelta <= 75) {
          score += 10;
          reasons.push("close to budget");
          signals.push("Near budget");
        } else if (budgetDelta <= 150) {
          score += 6;
          reasons.push("manageable budget stretch");
          signals.push("Slight budget stretch");
        } else if (budgetDelta <= 250) {
          score += 2;
          signals.push("Budget stretch");
        } else if (budgetDelta <= 400) {
          score -= 6;
        } else {
          score -= 12;
        }

        if (linkedHouse) {
          const commutePoints = Math.max(0, Math.round((1.2 - Math.min(linkedHouse.distanceToCampus, 1.2)) * 5));
          if (commutePoints > 0) {
            score += commutePoints;
            signals.push("Short campus commute");
          }
        }

        const queryText = query.trim().toLowerCase();
        if (queryText) {
          const searchable = `${candidate.name} ${candidate.major} ${candidate.bio} ${candidate.traits.join(" ")} ${candidate.interests.join(" ")}`.toLowerCase();
          if (searchable.includes(queryText)) {
            score += 6;
            reasons.push("matches your search");
            signals.push("Matches search");
          } else {
            const overlapCount = new Set(tokenizeQuery(queryText).filter((token) => searchable.includes(token))).size;
            if (overlapCount > 0) {
              score += Math.min(10, overlapCount * 3);
              reasons.push("query term overlap");
              signals.push(`Query overlap: ${overlapCount} terms`);
            }
          }
        }

        if (requestedTraits.length > 0) {
          score += coveragePoints(matchedTraits.length, requestedTraits.length, 24);
        }
        if (matchedTraits.length > 0) {
          const topTraits = matchedTraits.slice(0, 3).join(", ");
          reasons.push(`shared traits: ${topTraits}`);
          signals.push(`Shared traits: ${topTraits}`);
        } else if (requestedTraits.length > 0) {
          score -= 4;
        }

        if (requestedInterests.length > 0) {
          score += coveragePoints(matchedInterests.length, requestedInterests.length, 16);
        }
        if (matchedInterests.length > 0) {
          const topInterests = matchedInterests.slice(0, 3).join(", ");
          reasons.push(`shared interests: ${topInterests}`);
          signals.push(`Shared interests: ${topInterests}`);
        } else if (requestedInterests.length > 0) {
          score -= 3;
        }

        if (matchedTraits.length > 0 && matchedInterests.length > 0) {
          score += 4;
          signals.push("Strong lifestyle overlap");
        }

        if (feedbackById[`roommates:${candidate.id}`] === "like") {
          score += 14;
          reasons.push("based on your previous likes");
          signals.push("Aligned with your likes");
        }

        const reason = reasons[0] ?? "overall lifestyle compatibility";

        return {
          ...candidate,
          linkedHouse,
          matchScore: Math.min(99, Math.max(1, score)),
          matchReason: reason,
          matchSignals: signals.slice(0, 3),
        };
      })
      .filter((candidate) => feedbackById[`roommates:${candidate.id}`] !== "dislike")
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        const budgetDeltaA = Math.abs(a.budget - maxBudget);
        const budgetDeltaB = Math.abs(b.budget - maxBudget);
        if (budgetDeltaA !== budgetDeltaB) return budgetDeltaA - budgetDeltaB;
        const distanceA = a.linkedHouse?.distanceToCampus ?? 99;
        const distanceB = b.linkedHouse?.distanceToCampus ?? 99;
        if (distanceA !== distanceB) return distanceA - distanceB;
        return a.id.localeCompare(b.id);
      })
      .map((candidate, index, sortedList) => {
        if (index === 0) return candidate;
        const previous = sortedList[index - 1];
        if (candidate.matchScore >= previous.matchScore) {
          return { ...candidate, matchScore: Math.max(1, previous.matchScore - 1) };
        }
        return candidate;
      })
      .slice(0, 6);
  }, [feedbackById, housingMode, maxBudget, query, selectedCampus, selectedInterests, selectedTraits]);

  const fallbackHouseMatches = useCallback((): HouseMatchSuggestion[] => {
    return listings
      .filter((listing) => {
        if (housingMode !== "any" && listing.livingType !== housingMode) return false;
        if (selectedCampus !== "any" && listing.campus !== selectedCampus) return false;
        if (listing.price > maxBudget + 300) return false;

        if (selectedHouseFeatures.length > 0) {
          const listingFeatureSet = houseFeaturesForListing(listing);
          const hasAnyFeature = selectedHouseFeatures.some((feature) => listingFeatureSet.has(feature));
          if (!hasAnyFeature) return false;
        }

        const lowercaseQuery = query.trim().toLowerCase();
        if (!lowercaseQuery) return true;
        return `${listing.title} ${listing.neighborhood}`.toLowerCase().includes(lowercaseQuery);
      })
      .map((listing) => {
        let score = 32;
        const reasons: string[] = [];
        const signals: string[] = [];

        if (housingMode !== "any") {
          if (listing.livingType === housingMode) {
            score += 14;
            reasons.push("matches housing mode");
            signals.push("Matches housing mode");
          } else {
            score -= 8;
          }
        }
        if (selectedCampus !== "any") {
          if (listing.campus === selectedCampus) {
            score += 14;
            reasons.push("same campus");
            signals.push("Same campus");
          } else {
            score -= 6;
          }
        }

        const budgetDelta = listing.price - maxBudget;
        if (budgetDelta <= 0) {
          score += 14;
          reasons.push("fits budget");
          signals.push("Budget fit");
        } else if (budgetDelta <= 75) {
          score += 10;
          reasons.push("close to budget");
          signals.push("Near budget");
        } else if (budgetDelta <= 150) {
          score += 6;
          reasons.push("manageable budget stretch");
          signals.push("Slight budget stretch");
        } else if (budgetDelta <= 250) {
          score += 2;
          signals.push("Budget stretch");
        } else if (budgetDelta <= 400) {
          score -= 6;
        } else {
          score -= 12;
        }

        const commutePoints = Math.max(0, Math.round((1.4 - Math.min(listing.distanceToCampus, 1.4)) * 5));
        if (commutePoints > 0) {
          score += commutePoints;
          signals.push("Short campus commute");
        }

        const queryText = query.trim().toLowerCase();
        if (queryText) {
          const searchable = `${listing.title} ${listing.neighborhood}`.toLowerCase();
          if (searchable.includes(queryText)) {
            score += 6;
            reasons.push("matches your search");
            signals.push("Matches search");
          } else {
            const overlapCount = new Set(tokenizeQuery(queryText).filter((token) => searchable.includes(token))).size;
            if (overlapCount > 0) {
              score += Math.min(10, overlapCount * 3);
              reasons.push("query term overlap");
              signals.push(`Query overlap: ${overlapCount} terms`);
            }
          }
        }

        const listingFeatureSet = houseFeaturesForListing(listing);
        if (selectedHouseFeatures.length > 0) {
          const normalizedSelected = selectedHouseFeatures.map((feature) => feature.toLowerCase());
          const overlap = normalizedSelected.filter((feature) => listingFeatureSet.has(feature));
          score += coveragePoints(overlap.length, normalizedSelected.length, 24);
          if (overlap.length > 0) {
            const topFeatures = overlap.slice(0, 3).join(", ");
            reasons.push(`house feature fit: ${topFeatures}`);
            signals.push(`House features: ${topFeatures}`);
          } else {
            score -= 4;
          }
        }

        if (feedbackById[`houses:${listing.id}`] === "like") {
          score += 14;
          reasons.push("based on your previous likes");
          signals.push("Aligned with your likes");
        }

        const recommended = roommates
          .filter((person) => person.currentListingId === listing.id)
          .slice(0, 3)
          .map((person) => person.name);

        return {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          neighborhood: listing.neighborhood,
          campus: listing.campus,
          livingType: listing.livingType,
          distanceToCampus: listing.distanceToCampus,
          availableRooms: listing.availableRooms,
          recommendedRoommates: recommended,
          matchScore: Math.min(99, Math.max(1, score)),
          matchReason: reasons[0] ?? "overall housing fit",
          matchSignals: signals.slice(0, 3),
        };
      })
      .filter((candidate) => feedbackById[`houses:${candidate.id}`] !== "dislike")
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        const budgetDeltaA = Math.abs(a.price - maxBudget);
        const budgetDeltaB = Math.abs(b.price - maxBudget);
        if (budgetDeltaA !== budgetDeltaB) return budgetDeltaA - budgetDeltaB;
        if (a.distanceToCampus !== b.distanceToCampus) return a.distanceToCampus - b.distanceToCampus;
        return a.id.localeCompare(b.id);
      })
      .map((candidate, index, sortedList) => {
        if (index === 0) return candidate;
        const previous = sortedList[index - 1];
        if (candidate.matchScore >= previous.matchScore) {
          return { ...candidate, matchScore: Math.max(1, previous.matchScore - 1) };
        }
        return candidate;
      })
      .slice(0, 6);
  }, [feedbackById, housingMode, maxBudget, query, selectedCampus, selectedHouseFeatures]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  const runMatchFetch = useCallback(async () => {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/matchmaking/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current || undefined,
          mode,
          preferences: buildPreferences(),
        }),
      });

      if (!response.ok) throw new Error(`Failed to fetch matches: ${response.status}`);

      const payload = (await response.json()) as {
        sessionId?: string;
        mode?: MatchMode;
        strategy?: string;
        items?: RoommateMatchSuggestion[] | HouseMatchSuggestion[];
      };

      if (requestId !== latestRequestRef.current) return;

      setSessionId(payload.sessionId ?? sessionIdRef.current);
      setStrategy(payload.strategy ?? "heuristic");

      if ((payload.mode ?? mode) === "houses") {
        setHouseMatches((payload.items as HouseMatchSuggestion[]) ?? []);
      } else {
        setRoommateMatches((payload.items as RoommateMatchSuggestion[]) ?? []);
      }
    } catch {
      setStrategy("local-fallback");
      if (mode === "houses") {
        setHouseMatches(fallbackHouseMatches());
      } else {
        setRoommateMatches(fallbackRoommateMatches());
      }
      setError("Backend unavailable. Showing local fallback matches.");
    } finally {
      if (requestId === latestRequestRef.current) {
        setLoading(false);
      }
    }
  }, [buildPreferences, fallbackHouseMatches, fallbackRoommateMatches, mode]);

  useEffect(() => {
    void runMatchFetch();
  }, [criteriaKey]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const loadSaved = async () => {
      try {
        const response = await fetch(`/api/matchmaking/saved?sessionId=${encodeURIComponent(sessionId)}&mode=${mode}`);
        if (!response.ok) return;
        const payload = (await response.json()) as { savedIds?: string[]; mode?: MatchMode };
        const ids = Array.isArray(payload.savedIds) ? payload.savedIds : [];
        if (cancelled) return;

        const nextState: SavedState = {
          roommates: { ...savedByMode.roommates },
          houses: { ...savedByMode.houses },
        };
        const targetMode = (payload.mode ?? mode) as MatchMode;
        nextState[targetMode] = {};
        ids.forEach((id) => {
          nextState[targetMode][id] = true;
        });
        persistSavedState(nextState);
      } catch {
        // Keep local saved state if backend saved sync fails.
      }
    };

    void loadSaved();
    return () => {
      cancelled = true;
    };
  }, [mode, persistSavedState, savedByMode.houses, savedByMode.roommates, sessionId]);

  useEffect(() => {
    if (mode !== "roommates") {
      setCompareIds([]);
      setShowCompare(false);
    }
  }, [mode]);

  const toggleTag = (current: string[], setter: (value: string[]) => void, value: string) => {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const toggleSaved = async (targetId: string) => {
    const currentlySaved = Boolean(savedByMode[mode][targetId]);
    const nextState: SavedState = {
      roommates: { ...savedByMode.roommates },
      houses: { ...savedByMode.houses },
    };

    if (currentlySaved) {
      delete nextState[mode][targetId];
    } else {
      nextState[mode][targetId] = true;
    }

    persistSavedState(nextState);

    if (!sessionId) return;

    try {
      await fetch("/api/matchmaking/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          mode,
          targetId,
          saved: !currentlySaved,
        }),
      });
    } catch {
      // Local state stays as fallback.
    }
  };

  const toggleCompare = (targetId: string) => {
    setCompareIds((previous) => {
      if (previous.includes(targetId)) return previous.filter((id) => id !== targetId);
      if (previous.length >= 3) {
        setError("You can compare up to 3 roommates at a time.");
        return previous;
      }
      return [...previous, targetId];
    });
  };

  const sendFeedback = async (targetId: string, verdict: FeedbackVerdict) => {
    const feedbackKey = `${mode}:${targetId}`;
    const alreadySet = feedbackById[feedbackKey] === verdict;
    const nextVerdict: FeedbackVerdict | null = alreadySet ? null : verdict;
    setFeedbackById((previous) => {
      const next = { ...previous };
      if (nextVerdict) next[feedbackKey] = nextVerdict;
      else delete next[feedbackKey];
      return next;
    });

    if (!sessionId) {
      if (mode === "houses") setHouseMatches(fallbackHouseMatches());
      else setRoommateMatches(fallbackRoommateMatches());
      return;
    }

    try {
      const response = await fetch("/api/matchmaking/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          mode,
          targetId,
          verdict: nextVerdict ?? "clear",
          preferences: buildPreferences(),
        }),
      });

      if (!response.ok) throw new Error(`Feedback failed: ${response.status}`);

      const payload = (await response.json()) as {
        mode?: MatchMode;
        items?: RoommateMatchSuggestion[] | HouseMatchSuggestion[];
        strategy?: string;
      };

      setStrategy(payload.strategy ?? strategy);
      if ((payload.mode ?? mode) === "houses") {
        setHouseMatches((payload.items as HouseMatchSuggestion[]) ?? []);
      } else {
        setRoommateMatches((payload.items as RoommateMatchSuggestion[]) ?? []);
      }
    } catch {
      if (mode === "houses") setHouseMatches(fallbackHouseMatches());
      else setRoommateMatches(fallbackRoommateMatches());
      setError("Could not sync feedback with backend. Using local updates.");
    }
  };

  const activePreferenceCount = [
    selectedCampus !== "any",
    housingMode !== "any",
    maxBudget !== 1200,
    mode === "roommates" ? selectedTraits.length > 0 : selectedHouseFeatures.length > 0,
    mode === "roommates" ? selectedInterests.length > 0 : false,
    query.trim().length > 0,
  ].filter(Boolean).length;

  const resolvedRoommateMatches = useMemo(
    () =>
      roommateMatches.filter((person) => {
        const linkedHouse = person.linkedHouse ?? listingById[person.currentListingId];
        return Boolean(linkedHouse);
      }),
    [roommateMatches]
  );

  const visibleRoommateMatches = useMemo(() => {
    if (!savedOnly) return resolvedRoommateMatches;
    return resolvedRoommateMatches.filter((person) => Boolean(savedByMode.roommates[person.id]));
  }, [resolvedRoommateMatches, savedByMode.roommates, savedOnly]);

  const visibleHouseMatches = useMemo(() => {
    if (!savedOnly) return houseMatches;
    return houseMatches.filter((house) => Boolean(savedByMode.houses[house.id]));
  }, [houseMatches, savedByMode.houses, savedOnly]);

  const compareCandidates = useMemo(
    () => visibleRoommateMatches.filter((person) => compareIds.includes(person.id)),
    [compareIds, visibleRoommateMatches]
  );

  const selectedMapHouse = useMemo(
    () => visibleHouseMatches.find((house) => house.id === selectedMapHouseId) ?? null,
    [selectedMapHouseId, visibleHouseMatches]
  );

  const housePins = useMemo(() => {
    return visibleHouseMatches.map((house) => {
      const basePoint = CAMPUS_MAP_POINTS[house.campus];
      const jitterX = (hashToUnit(`${house.id}:x`) - 0.5) * 18;
      const jitterY = (hashToUnit(`${house.id}:y`) - 0.5) * 16;
      const distanceFactor = Math.min(14, house.distanceToCampus * 4.5);
      const x = Math.max(8, Math.min(92, basePoint.x + jitterX + distanceFactor));
      const y = Math.max(8, Math.min(92, basePoint.y + jitterY - distanceFactor * 0.5));
      return { ...house, x, y };
    });
  }, [visibleHouseMatches]);

  const renderSignalChips = (signals: string[] | undefined, fallbackReason: string) => {
    const chips = (signals && signals.length > 0 ? signals : [fallbackReason]).slice(0, 3);
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span key={chip} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
            {chip}
          </span>
        ))}
      </div>
    );
  };

  const deriveHouseFeatureChips = (house: HouseMatchSuggestion) => {
    const featureSet = houseFeaturesForListing({
      distanceToCampus: house.distanceToCampus,
      price: house.price,
      availableRooms: house.availableRooms,
      livingType: house.livingType,
      campus: house.campus,
    });

    const ordered = [
      "near campus",
      "budget friendly",
      "multiple rooms",
      "single room",
      "parking",
      "furnished",
      "utilities included",
      "wifi",
      "washer/dryer",
      "study space",
      "off campus",
      "on campus",
      "college avenue",
      "cook douglass",
      "busch",
      "livingston",
    ];

    return ordered.filter((feature) => featureSet.has(feature)).slice(0, 6);
  };

  const renderHouseOccupants = (house: HouseMatchSuggestion, compact = false) => {
    const linkedListing = listingById[house.id];
    const fallbackResidentNames = house.recommendedRoommates ?? [];
    const sectionSpacing = compact ? "mt-3" : "mt-4";

    if (!linkedListing) {
      return (
        <div className={`${sectionSpacing} rounded-xl border border-emerald-100 bg-emerald-50 p-3`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">People in this house</p>
          {fallbackResidentNames.length === 0 ? (
            <p className="mt-1 text-xs text-emerald-700">No current resident profiles available yet.</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {fallbackResidentNames.map((name) => (
                <span key={name} className="rounded-full bg-white px-2 py-1 text-xs text-emerald-700">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (linkedListing.livingType === "on_campus") {
      return (
        <div className={`${sectionSpacing} rounded-xl border border-emerald-100 bg-emerald-50 p-3`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">People in this house</p>
          <p className="mt-1 text-xs text-emerald-700">On-campus residence hall with no fixed housemate roster.</p>
        </div>
      );
    }

    if (linkedListing.type === "entire_place") {
      return (
        <div className={`${sectionSpacing} rounded-xl border border-emerald-100 bg-emerald-50 p-3`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">People in this house</p>
          <p className="mt-1 text-xs text-emerald-700">Entire house listing. No fixed housemates assigned yet.</p>
        </div>
      );
    }

    if (linkedListing.housemates.length === 0) {
      return (
        <div className={`${sectionSpacing} rounded-xl border border-emerald-100 bg-emerald-50 p-3`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">People in this house</p>
          <p className="mt-1 text-xs text-emerald-700">No housemates listed yet. Listing is still active for roommates.</p>
        </div>
      );
    }

    const inRoomHousemate = linkedListing.type === "shared_room" ? linkedListing.housemates[0] : null;
    const visibleHousemates = linkedListing.housemates.slice(inRoomHousemate ? 1 : 0, inRoomHousemate ? 3 : 2);

    return (
      <div className={`${sectionSpacing} rounded-xl border border-emerald-100 bg-emerald-50 p-3`}>
        <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          <Users className="h-3.5 w-3.5" /> People in house
        </p>
        {inRoomHousemate ? (
          <div className="mb-2 rounded-lg border border-emerald-300 bg-white p-2.5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">In-room roommate</p>
            <div className="flex items-center gap-2 text-xs text-emerald-900">
              <img src={inRoomHousemate.avatar} alt={inRoomHousemate.name} className="h-7 w-7 rounded-full bg-white object-cover" />
              <div>
                <span className="font-semibold">{inRoomHousemate.name}</span>
                <span className="ml-1 text-emerald-700">{inRoomHousemate.traits.slice(0, 2).join(" + ")}</span>
              </div>
            </div>
          </div>
        ) : null}
        <div className="space-y-2">
          {visibleHousemates.map((person) => (
            <div key={person.id} className="flex items-center gap-2 text-xs text-emerald-900">
              <img src={person.avatar} alt={person.name} className="h-6 w-6 rounded-full bg-white object-cover" />
              <div>
                <span className="font-medium">{person.name}</span>
                <span className="ml-1 text-emerald-700">{person.traits.slice(0, 2).join(" + ")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find New Roots</h1>
          <p className="mt-1 text-gray-600">Match with roommates or houses, then refine with feedback, saves, and side-by-side compare.</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 md:w-auto">
          <button
            onClick={() => setMode("roommates")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              mode === "roommates" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Users className="h-4 w-4" /> Match Roommates
          </button>
          <button
            onClick={() => setMode("houses")}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
              mode === "houses" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Home className="h-4 w-4" /> Match Houses
          </button>
        </div>
      </div>

      <div className="mt-6 md:hidden">
        <button
          type="button"
          onClick={() => setShowMobileFilters((previous) => !previous)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      <div className={`mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${showMobileFilters ? "block" : "hidden md:block"}`}>
        <div className="mb-4 flex items-center justify-between">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Sparkles className="h-4 w-4 text-emerald-600" /> Match Preferences
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSavedOnly((previous) => !previous)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                savedOnly ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${savedOnly ? "fill-amber-400 text-amber-500" : "text-gray-400"}`} />
              Saved only
            </button>
            <button
              type="button"
              onClick={() => void runMatchFetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">Campus</label>
            <select
              value={selectedCampus}
              onChange={(event) => setSelectedCampus(event.target.value as RutgersCampus | "any")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            >
              <option value="any">Any Rutgers Campus</option>
              {campuses.map((campus) => (
                <option key={campus} value={campus}>
                  {campusLabels[campus]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">Living Type</label>
            <select
              value={housingMode}
              onChange={(event) => setHousingMode(event.target.value as LivingType | "any")}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            >
              <option value="any">Any</option>
              <option value="off_campus">Off-Campus Houses</option>
              <option value="on_campus">On-Campus Dormitories</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-600">Max Budget (${maxBudget})</label>
            <input
              type="range"
              min={650}
              max={1700}
              step={25}
              value={maxBudget}
              onChange={(event) => setMaxBudget(Number(event.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>

        <div className="mt-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              mode === "houses"
                ? "Search house style, campus, neighborhood, or feature"
                : "Search major, traits, interests (add your own keywords)"
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            {mode === "houses"
              ? "Tip: use house feature keywords like near campus, multiple rooms, or budget friendly."
              : "Tip: add any custom trait or interest directly in search, like no-smoking, movie nights, or meal prep."}
          </p>
        </div>

        {mode === "roommates" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">Traits</p>
              <div className="flex flex-wrap gap-2">
                {TRAIT_OPTIONS.map((trait) => {
                  const active = selectedTraits.includes(trait);
                  return (
                    <button
                      key={trait}
                      type="button"
                      onClick={() => toggleTag(selectedTraits, setSelectedTraits, trait)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-emerald-700 bg-emerald-600 text-white ring-2 ring-emerald-200"
                          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                      }`}
                    >
                      {active ? <Check className="h-3 w-3" /> : null}
                      {trait}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">Interests</p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const active = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleTag(selectedInterests, setSelectedInterests, interest)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-emerald-700 bg-emerald-600 text-white ring-2 ring-emerald-200"
                          : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                      }`}
                    >
                      {active ? <Check className="h-3 w-3" /> : null}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">House Features</p>
            <div className="flex flex-wrap gap-2">
              {HOUSE_FEATURE_OPTIONS.map((feature) => {
                const active = selectedHouseFeatures.includes(feature);
                return (
                  <button
                    key={feature}
                    type="button"
                    onClick={() => toggleTag(selectedHouseFeatures, setSelectedHouseFeatures, feature)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-emerald-700 bg-emerald-600 text-white ring-2 ring-emerald-200"
                        : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
                    }`}
                  >
                    {active ? <Check className="h-3 w-3" /> : null}
                    {feature}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {activePreferenceCount} active preference{activePreferenceCount === 1 ? "" : "s"} | source: {strategy}
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="text-amber-600 hover:text-amber-800">
            <X className="h-4 w-4" />
          </button>
        </p>
      )}

      {mode === "houses" && (
        <div className="mt-6 flex items-center justify-end">
          <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setHouseView("list")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                houseView === "list" ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => setHouseView("map")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
                houseView === "map" ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" /> Map
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-600">Loading updated match suggestions...</div>
      ) : mode === "roommates" ? (
        <div className="mt-8 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRoommateMatches.map((person) => {
            const linkedHouse = person.linkedHouse ?? listingById[person.currentListingId];
            const linkedHouseImage = linkedHouse ? listingById[linkedHouse.id]?.images?.[0] : undefined;
            const feedbackKey = `roommates:${person.id}`;
            const isExpanded = Boolean(expandedById[person.id]);
            const isSaved = Boolean(savedByMode.roommates[person.id]);
            const inCompare = compareIds.includes(person.id);
            const mutualLike = feedbackById[feedbackKey] === "like" && person.matchScore >= 78;
            const selectedTraitSet = new Set(sortedTraits.map((trait) => trait.toLowerCase()));
            const selectedInterestSet = new Set(sortedInterests.map((interest) => interest.toLowerCase()));
            const highlightedTraitSet = new Set(
              person.traits.filter((trait) => {
                const normalized = trait.toLowerCase();
                return selectedTraitSet.has(normalized) || queryTokens.some((token) => normalized.includes(token));
              })
            );
            const highlightedInterestSet = new Set(
              person.interests.filter((interest) => {
                const normalized = interest.toLowerCase();
                return selectedInterestSet.has(normalized) || queryTokens.some((token) => normalized.includes(token));
              })
            );
            const bioPreview = person.bio.length > 132 ? `${person.bio.slice(0, 129).trimEnd()}...` : person.bio;

            return (
              <article key={person.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={person.avatar} alt={person.name} className="h-12 w-12 rounded-full object-cover" />
                    <div>
                      <h2 className="font-semibold text-gray-900">{person.name}</h2>
                      <p className="text-xs text-gray-500">
                        {person.year} - {person.major}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-base font-bold text-emerald-700">
                    {person.matchScore}%
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-gray-100 bg-gray-50 p-2 text-xs text-gray-700">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Move-in</p>
                    <p className="font-medium text-gray-900">{person.moveInWindow}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Budget</p>
                    <p className="font-medium text-gray-900">${person.budget}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Campus</p>
                    <p className="font-medium text-gray-900">{campusLabels[person.preferredCampuses[0] ?? "college_avenue"]}</p>
                  </div>
                </div>

                {renderSignalChips(person.matchSignals, person.matchReason)}

                <p className="mt-3 text-sm leading-relaxed text-gray-700">{bioPreview}</p>

                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Traits {highlightedTraitSet.size > 0 ? "(match highlights)" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {person.traits.map((trait) => {
                      const isHighlighted = highlightedTraitSet.has(trait);
                      return (
                        <span
                          key={trait}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                            isHighlighted
                              ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
                              : "border border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {isHighlighted ? <Check className="h-3 w-3" /> : null}
                          {trait}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Interests {highlightedInterestSet.size > 0 ? "(match highlights)" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {person.interests.slice(0, 6).map((interest) => {
                      const isHighlighted = highlightedInterestSet.has(interest);
                      return (
                        <span
                          key={interest}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                            isHighlighted
                              ? "border border-indigo-300 bg-indigo-50 text-indigo-700"
                              : "border border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {isHighlighted ? <Check className="h-3 w-3" /> : null}
                          {interest}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {linkedHouse && (
                  <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Current House</p>
                    <div className="mt-2 flex items-center gap-3">
                      {linkedHouseImage ? <img src={linkedHouseImage} alt={linkedHouse.title} className="h-12 w-12 rounded-md object-cover" /> : null}
                      <div>
                        <p className="text-sm font-medium text-emerald-900">{linkedHouse.title}</p>
                        <p className="mt-1 text-xs text-emerald-700">
                          {campusLabels[linkedHouse.campus]} - ${linkedHouse.price}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleSaved(person.id)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSaved ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${isSaved ? "fill-amber-400 text-amber-500" : "text-gray-400"}`} />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(person.id)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      inCompare ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" /> {inCompare ? "Comparing" : "Compare"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setError(`Chat with ${person.name} is available in the demo flow.`)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      mutualLike
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        : "border-gray-200 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> {mutualLike ? "Start chat" : "Chat"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedById((previous) => ({ ...previous, [person.id]: !previous[person.id] }))}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isExpanded ? "Hide details" : "View details"}
                </button>

                {isExpanded ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-gray-700">{person.bio}</p>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Move-in: {person.moveInWindow}</p>
                      <p className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {person.preferredCampuses.map((campus) => campusLabels[campus]).join(", ")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {person.traits.map((trait) => (
                        <span key={trait} className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                          {trait}
                        </span>
                      ))}
                      {person.interests.slice(0, 4).map((interest) => (
                        <span key={interest} className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {interest}
                        </span>
                      ))}
                    </div>

                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void sendFeedback(person.id, "like")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      feedbackById[feedbackKey] === "like"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-200 text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" /> {feedbackById[feedbackKey] === "like" ? "Remove Like" : "Like"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendFeedback(person.id, "dislike")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      feedbackById[feedbackKey] === "dislike"
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-gray-200 text-gray-700 hover:bg-red-50"
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" /> {feedbackById[feedbackKey] === "dislike" ? "Remove Dislike" : "Dislike"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : houseView === "map" ? (
        <div className="mt-8 space-y-4">
          <div className="relative h-[30rem] overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-4 shadow-sm">
            {Object.entries(CAMPUS_MAP_POINTS).map(([campus, point]) => (
              <div key={campus} className="absolute" style={{ left: `${point.x}%`, top: `${point.y}%`, transform: "translate(-50%, -50%)" }}>
                <div className="rounded-full bg-gray-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">{point.label}</div>
              </div>
            ))}

            {housePins.map((house) => (
              <button
                key={house.id}
                type="button"
                onClick={() => setSelectedMapHouseId(house.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-2.5 py-1 text-xs font-semibold shadow-sm transition-transform hover:scale-105 ${
                  selectedMapHouseId === house.id
                    ? "border-emerald-700 bg-emerald-600 text-white"
                    : "border-emerald-300 bg-white text-emerald-800"
                }`}
                style={{ left: `${house.x}%`, top: `${house.y}%` }}
              >
                ${house.price}
              </button>
            ))}
          </div>

          {selectedMapHouse ? (
            <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              {(() => {
                const houseFeatureChips = deriveHouseFeatureChips(selectedMapHouse);
                const highlightedFeatureSet = new Set(
                  houseFeatureChips.filter((feature) =>
                    selectedHouseFeatureSet.has(feature) || queryTokens.some((token) => feature.includes(token))
                  )
                );
                return (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold text-gray-900">{selectedMapHouse.title}</h2>
                        <p className="text-sm text-gray-500">{selectedMapHouse.neighborhood}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-base font-bold text-emerald-700">
                        {selectedMapHouse.matchScore}%
                      </div>
                    </div>
                    {renderSignalChips(selectedMapHouse.matchSignals, selectedMapHouse.matchReason)}
                    <div className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-3">
                      <p>${selectedMapHouse.price}</p>
                      <p>{selectedMapHouse.availableRooms} room(s) open</p>
                      <p>{selectedMapHouse.distanceToCampus} miles to campus</p>
                    </div>
                    <div className="mt-3">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        House features {highlightedFeatureSet.size > 0 ? "(match highlights)" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {houseFeatureChips.map((feature) => {
                          const isHighlighted = highlightedFeatureSet.has(feature);
                          return (
                            <span
                              key={feature}
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                                isHighlighted
                                  ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
                                  : "border border-gray-200 bg-gray-50 text-gray-700"
                              }`}
                            >
                              {isHighlighted ? <Check className="h-3 w-3" /> : null}
                              {feature}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
              {renderHouseOccupants(selectedMapHouse, true)}
            </article>
          ) : (
            <div className="rounded-xl border border-dashed border-emerald-200 bg-white/70 px-4 py-3 text-sm text-emerald-800">
              Select a map pin to preview that house.
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleHouseMatches.map((house) => {
            const feedbackKey = `houses:${house.id}`;
            const isSaved = Boolean(savedByMode.houses[house.id]);
            const houseFeatureChips = deriveHouseFeatureChips(house);
            const highlightedFeatureSet = new Set(
              houseFeatureChips.filter(
                (feature) => selectedHouseFeatureSet.has(feature) || queryTokens.some((token) => feature.includes(token))
              )
            );

            return (
              <article key={house.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{house.title}</h2>
                    <p className="text-sm text-gray-500">{house.neighborhood}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-base font-bold text-emerald-700">
                    {house.matchScore}%
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  {campusLabels[house.campus]} - {house.livingType === "on_campus" ? "Dormitory" : "Off-campus"}
                </div>

                {renderSignalChips(house.matchSignals, house.matchReason)}

                <div className="mt-4 text-sm text-gray-700">
                  <p>${house.price}</p>
                  <p>{house.availableRooms} room(s) open</p>
                  <p>{house.distanceToCampus} miles to campus</p>
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    House features {highlightedFeatureSet.size > 0 ? "(match highlights)" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {houseFeatureChips.map((feature) => {
                      const isHighlighted = highlightedFeatureSet.has(feature);
                      return (
                        <span
                          key={feature}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${
                            isHighlighted
                              ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
                              : "border border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        >
                          {isHighlighted ? <Check className="h-3 w-3" /> : null}
                          {feature}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {renderHouseOccupants(house)}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleSaved(house.id)}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isSaved ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${isSaved ? "fill-amber-400 text-amber-500" : "text-gray-400"}`} />
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void sendFeedback(house.id, "like")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      feedbackById[feedbackKey] === "like"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-gray-200 text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" /> {feedbackById[feedbackKey] === "like" ? "Remove Like" : "Like"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendFeedback(house.id, "dislike")}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      feedbackById[feedbackKey] === "dislike"
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-gray-200 text-gray-700 hover:bg-red-50"
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" /> {feedbackById[feedbackKey] === "dislike" ? "Remove Dislike" : "Dislike"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {mode === "roommates" && compareCandidates.length > 0 ? (
        <div className="fixed bottom-5 left-1/2 z-40 w-[min(92vw,760px)] -translate-x-1/2 rounded-2xl border border-indigo-200 bg-white p-3 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-indigo-800">{compareCandidates.length} roommate{compareCandidates.length === 1 ? "" : "s"} selected</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCompare(true)}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Open compare
              </button>
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCompare ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/55 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Roommate Comparison</h2>
              <button type="button" onClick={() => setShowCompare(false)} className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="border-b border-gray-200 px-3 py-2 font-semibold text-gray-700">Feature</th>
                    {compareCandidates.map((candidate) => (
                      <th key={candidate.id} className="border-b border-gray-200 px-3 py-2 font-semibold text-gray-900">
                        {candidate.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-600">Major</td>
                    {compareCandidates.map((candidate) => (
                      <td key={`${candidate.id}:major`} className="border-b border-gray-100 px-3 py-2 text-gray-800">{candidate.major}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-600">Campus</td>
                    {compareCandidates.map((candidate) => (
                      <td key={`${candidate.id}:campus`} className="border-b border-gray-100 px-3 py-2 text-gray-800">
                        {candidate.preferredCampuses.map((campus) => campusLabels[campus]).join(", ")}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-600">Max Budget</td>
                    {compareCandidates.map((candidate) => (
                      <td key={`${candidate.id}:budget`} className="border-b border-gray-100 px-3 py-2 text-gray-800">${candidate.budget}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border-b border-gray-100 px-3 py-2 font-medium text-gray-600">Top Traits</td>
                    {compareCandidates.map((candidate) => (
                      <td key={`${candidate.id}:traits`} className="border-b border-gray-100 px-3 py-2 text-gray-800">{candidate.traits.slice(0, 2).join(", ")}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-600">Move-in Window</td>
                    {compareCandidates.map((candidate) => (
                      <td key={`${candidate.id}:move`} className="px-3 py-2 text-gray-800">{candidate.moveInWindow}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && mode === "roommates" && visibleRoommateMatches.length === 0 && (
        <div className="mt-10 text-center text-sm text-gray-600">No roommate matches for current preferences.</div>
      )}
      {!loading && mode === "houses" && visibleHouseMatches.length === 0 && (
        <div className="mt-10 text-center text-sm text-gray-600">No house matches for current preferences.</div>
      )}
    </div>
  );
}

