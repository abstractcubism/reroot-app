from __future__ import annotations

import hashlib
import json
import re
from os import getenv
from pathlib import Path
from typing import Any, Literal, TypedDict, cast
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import uuid4

from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS

load_dotenv()

RutgersCampus = Literal["livingston", "college_avenue", "cook_douglass", "busch"]
LivingType = Literal["off_campus", "on_campus"]
MatchMode = Literal["roommates", "houses"]


class ListingSummary(TypedDict):
    id: str
    title: str
    price: int
    neighborhood: str
    campus: RutgersCampus
    livingType: LivingType
    distanceToCampus: float
    availableRooms: int


class RoommateSummary(TypedDict):
    id: str
    name: str
    avatar: str
    year: str
    major: str
    budget: int
    bio: str
    interests: list[str]
    traits: list[str]
    preferredCampuses: list[RutgersCampus]
    moveInWindow: str
    currentListingId: str


class RoommateMatchResult(RoommateSummary):
    linkedHouse: ListingSummary | None
    matchScore: int
    matchReason: str
    matchSignals: list[str]


class HouseMatchResult(ListingSummary):
    recommendedRoommates: list[str]
    matchScore: int
    matchReason: str
    matchSignals: list[str]


class HousemateCard(TypedDict):
    id: str
    name: str
    year: str
    major: str
    traits: list[str]
    avatar: str


class HousingListing(TypedDict):
    id: str
    title: str
    price: int
    bedrooms: int
    bathrooms: float
    type: str
    livingType: LivingType
    neighborhood: str
    township: str
    campus: RutgersCampus
    address: str
    distanceToCampus: float
    amenities: list[str]
    images: list[str]
    isFeatured: bool
    availableRooms: int
    utilitiesIncluded: bool
    petsAllowed: bool
    furnished: bool
    parking: bool
    description: str
    nearestUniversity: str
    housemates: list[HousemateCard]


LISTINGS: list[ListingSummary] = [
    {
        "id": "l1",
        "title": "112 Sicard St",
        "price": 920,
        "neighborhood": "College Ave/Easton Ave",
        "campus": "college_avenue",
        "livingType": "off_campus",
        "distanceToCampus": 0.4,
        "availableRooms": 1,
    },
    {
        "id": "l2",
        "title": "55 Bartholomew Rd",
        "price": 860,
        "neighborhood": "Piscataway",
        "campus": "busch",
        "livingType": "off_campus",
        "distanceToCampus": 0.7,
        "availableRooms": 2,
    },
    {
        "id": "l3",
        "title": "40 George St",
        "price": 710,
        "neighborhood": "Cook/Douglass Village",
        "campus": "cook_douglass",
        "livingType": "off_campus",
        "distanceToCampus": 0.5,
        "availableRooms": 1,
    },
    {
        "id": "l4",
        "title": "290 George St",
        "price": 980,
        "neighborhood": "Socam 290",
        "campus": "livingston",
        "livingType": "off_campus",
        "distanceToCampus": 0.8,
        "availableRooms": 1,
    },
    {
        "id": "l5",
        "title": "311 Raritan Ave",
        "price": 790,
        "neighborhood": "Highland Park",
        "campus": "college_avenue",
        "livingType": "off_campus",
        "distanceToCampus": 1.4,
        "availableRooms": 2,
    },
    {
        "id": "l6",
        "title": "780 George St",
        "price": 1030,
        "neighborhood": "Downtown New Brunswick",
        "campus": "college_avenue",
        "livingType": "off_campus",
        "distanceToCampus": 0.9,
        "availableRooms": 1,
    },
    {
        "id": "d1",
        "title": "B.E.S.T. Hall",
        "price": 1450,
        "neighborhood": "Livingston Campus",
        "campus": "livingston",
        "livingType": "on_campus",
        "distanceToCampus": 0.1,
        "availableRooms": 8,
    },
    {
        "id": "d2",
        "title": "Brower / Hardenbergh Halls",
        "price": 1280,
        "neighborhood": "College Avenue Campus",
        "campus": "college_avenue",
        "livingType": "on_campus",
        "distanceToCampus": 0.1,
        "availableRooms": 14,
    },
    {
        "id": "d3",
        "title": "Starkey Apartments",
        "price": 1360,
        "neighborhood": "Cook/Douglass Campus",
        "campus": "cook_douglass",
        "livingType": "on_campus",
        "distanceToCampus": 0.2,
        "availableRooms": 6,
    },
    {
        "id": "d4",
        "title": "Busch Suites",
        "price": 1390,
        "neighborhood": "Busch Campus",
        "campus": "busch",
        "livingType": "on_campus",
        "distanceToCampus": 0.2,
        "availableRooms": 10,
    },
]

ROOMMATES: list[RoommateSummary] = [
    {
        "id": "r1",
        "name": "Alex Carter",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
        "year": "Junior",
        "major": "Computer Science",
        "budget": 950,
        "bio": "Busch student who likes clean common spaces and calm weeknights.",
        "interests": ["coding", "basketball", "coffee"],
        "traits": ["clean", "quiet", "organized"],
        "preferredCampuses": ["busch", "livingston"],
        "moveInWindow": "Aug 10 - Aug 28",
        "currentListingId": "l2",
    },
    {
        "id": "r2",
        "name": "Maya Patel",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
        "year": "Senior",
        "major": "Biology",
        "budget": 1100,
        "bio": "Pre-med on Cook/Douglass looking for respectful roommates and early sleep schedule.",
        "interests": ["running", "meal prep", "podcasts"],
        "traits": ["early-riser", "quiet", "clean"],
        "preferredCampuses": ["cook_douglass", "college_avenue"],
        "moveInWindow": "Jul 20 - Aug 15",
        "currentListingId": "l3",
    },
    {
        "id": "r3",
        "name": "Jordan Lee",
        "avatar": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
        "year": "Graduate",
        "major": "Architecture",
        "budget": 1200,
        "bio": "Design grad student who keeps things low-key during the week.",
        "interests": ["photography", "design", "climbing"],
        "traits": ["night-owl", "respectful", "quiet"],
        "preferredCampuses": ["college_avenue"],
        "moveInWindow": "Anytime",
        "currentListingId": "l1",
    },
    {
        "id": "r4",
        "name": "Sofia Nguyen",
        "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
        "year": "Sophomore",
        "major": "Finance",
        "budget": 860,
        "bio": "Livingston-based student, social but consistent about chores and house rules.",
        "interests": ["gym", "cooking", "movies"],
        "traits": ["social", "clean", "planner"],
        "preferredCampuses": ["livingston", "busch"],
        "moveInWindow": "Aug 1 - Sep 1",
        "currentListingId": "l4",
    },
    {
        "id": "r5",
        "name": "Daniel Brooks",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
        "year": "Junior",
        "major": "Mechanical Engineering",
        "budget": 920,
        "bio": "Busch engineering student, friendly and usually in labs or library on weekdays.",
        "interests": ["gaming", "basketball", "3D printing"],
        "traits": ["night-owl", "friendly", "respectful"],
        "preferredCampuses": ["busch"],
        "moveInWindow": "Aug 15 - Sep 10",
        "currentListingId": "l2",
    },
    {
        "id": "r6",
        "name": "Hannah Kim",
        "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
        "year": "Senior",
        "major": "Psychology",
        "budget": 980,
        "bio": "College Ave student who balances study routines with a social weekend schedule.",
        "interests": ["reading", "yoga", "music"],
        "traits": ["clean", "social", "organized"],
        "preferredCampuses": ["college_avenue", "cook_douglass"],
        "moveInWindow": "Aug 1 - Aug 25",
        "currentListingId": "l5",
    },
]

LISTING_BY_ID: dict[str, ListingSummary] = {listing["id"]: listing for listing in LISTINGS}
ROOMMATES_BY_LISTING: dict[str, list[RoommateSummary]] = {}
for roommate in ROOMMATES:
    ROOMMATES_BY_LISTING.setdefault(roommate["currentListingId"], []).append(roommate)

SESSION_FEEDBACK: dict[str, dict[str, int]] = {}
SESSION_PREFERENCES: dict[str, dict[MatchMode, dict[str, Any]]] = {}
SESSION_SAVED: dict[str, dict[MatchMode, set[str]]] = {}
BACKEND_DIR = Path(__file__).resolve().parent
LOCAL_HOUSES_SNAPSHOT_PATH = BACKEND_DIR / "data" / "local_houses.json"
RUTGERS_DATASET_PATH = BACKEND_DIR / "data" / "rutgers_housing_dataset.json"
FAKE_STUDENTS_PATH = BACKEND_DIR / "data" / "fake_rutgers_students.json"

FALLBACK_IMAGES: dict[RutgersCampus, str] = {
    "livingston": "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200",
    "college_avenue": "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200",
    "cook_douglass": "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200",
    "busch": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
}
DATASET_CAMPUS_LABELS: dict[RutgersCampus, str] = {
    "livingston": "Livingston",
    "college_avenue": "College Ave",
    "cook_douglass": "Cook/Douglass",
    "busch": "Busch",
}
HOUSEMATE_FIRST_NAMES = [
    "Jordan",
    "Avery",
    "Taylor",
    "Morgan",
    "Riley",
    "Casey",
    "Sage",
    "Parker",
    "Rowan",
    "Emerson",
    "Quinn",
    "Jamie",
]
HOUSEMATE_LAST_NAMES = [
    "Kim",
    "Patel",
    "Martinez",
    "Johnson",
    "Singh",
    "Brooks",
    "Lopez",
    "Davis",
    "Reed",
    "Nguyen",
    "Shah",
    "Bennett",
]
HOUSEMATE_MAJORS = [
    "Computer Science",
    "Biology",
    "Economics",
    "Psychology",
    "Mechanical Engineering",
    "Finance",
    "Public Health",
    "Nursing",
    "Data Science",
    "Marketing",
]
HOUSEMATE_TRAITS = [
    "clean",
    "quiet",
    "organized",
    "friendly",
    "respectful",
    "early-riser",
    "planner",
    "social",
    "focused",
    "easygoing",
]
HOUSEMATE_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]
HOUSEMATE_AVATARS = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300",
]


def _roommate_housemates(listing_id: str) -> list[HousemateCard]:
    housemates: list[HousemateCard] = []
    for roommate in ROOMMATES_BY_LISTING.get(listing_id, []):
        housemates.append(
            {
                "id": roommate["id"],
                "name": roommate["name"],
                "year": roommate["year"],
                "major": roommate["major"],
                "traits": roommate["traits"],
                "avatar": roommate["avatar"],
            }
        )
    return housemates


def _township_from_neighborhood(name: str) -> str:
    lowered = name.lower()
    if "piscataway" in lowered:
        return "Piscataway"
    if "highland park" in lowered:
        return "Highland Park"
    return "New Brunswick"


def _summary_to_housing_listing(summary: ListingSummary) -> HousingListing:
    bedrooms = max(1, summary["availableRooms"] + (1 if summary["livingType"] == "on_campus" else 2))
    bathrooms = 1.0 if bedrooms <= 2 else 2.0
    campus = summary["campus"]
    description = (
        "On-campus residence option with convenient Rutgers transit access."
        if summary["livingType"] == "on_campus"
        else "Off-campus house option with Rutgers-friendly commute and shared living setup."
    )

    return {
        "id": summary["id"],
        "title": summary["title"],
        "price": summary["price"],
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "type": "entire_place" if summary["livingType"] == "on_campus" else "private_room",
        "livingType": summary["livingType"],
        "neighborhood": summary["neighborhood"],
        "township": _township_from_neighborhood(summary["neighborhood"]),
        "campus": campus,
        "address": summary["title"],
        "distanceToCampus": summary["distanceToCampus"],
        "amenities": ["WiFi", "Washer/Dryer", "Study Space"],
        "images": [FALLBACK_IMAGES[campus]],
        "isFeatured": summary["availableRooms"] <= 1,
        "availableRooms": summary["availableRooms"],
        "utilitiesIncluded": summary["livingType"] == "on_campus",
        "petsAllowed": False,
        "furnished": summary["livingType"] == "on_campus",
        "parking": summary["campus"] in {"busch", "livingston"},
        "description": description,
        "nearestUniversity": "Rutgers University-New Brunswick",
        "housemates": _roommate_housemates(summary["id"]),
    }


def _fix_mojibake(text: str) -> str:
    if "â" not in text:
        return text
    try:
        return text.encode("latin-1").decode("utf-8")
    except UnicodeError:
        return text


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    return _fix_mojibake(str(value).strip())


def _safe_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _valid_image_url(value: str) -> bool:
    lowered = value.strip().lower()
    return lowered.startswith("http://") or lowered.startswith("https://")


def _campus_from_area(campus_area: str) -> RutgersCampus | None:
    normalized = campus_area.strip().lower()
    if "college" in normalized:
        return "college_avenue"
    if "cook" in normalized or "douglass" in normalized:
        return "cook_douglass"
    if "busch" in normalized:
        return "busch"
    if "livingston" in normalized:
        return "livingston"
    return None


def _seeded_int(seed_key: str, purpose: str) -> int:
    digest = hashlib.sha256(f"{seed_key}|{purpose}".encode("utf-8")).hexdigest()
    return int(digest[:12], 16)


def _living_type_from_housing_pref(raw_pref: str) -> LivingType:
    normalized = raw_pref.strip().lower()
    if any(token in normalized for token in ["dorm", "suite", "residence", "hall"]):
        return "on_campus"
    return "off_campus"


def _normalize_student_year(raw_year: str) -> str:
    normalized = raw_year.strip().lower()
    if normalized in {"first-year", "first year", "freshman"}:
        return "Freshman"
    if normalized in {"sophomore", "junior", "senior", "graduate"}:
        return normalized.capitalize()
    return "Undergraduate"


def _normalize_student_traits(raw_traits: list[Any], noise_preference: str) -> list[str]:
    inferred: set[str] = set()

    for raw_trait in raw_traits:
        trait = _clean_text(raw_trait).lower()
        if not trait:
            continue
        if any(token in trait for token in ["clean", "tidy", "chore"]):
            inferred.add("clean")
        if any(token in trait for token in ["quiet", "study", "weeknight"]):
            inferred.add("quiet")
        if any(token in trait for token in ["social", "music-friendly", "outgoing"]):
            inferred.add("social")
        if any(token in trait for token in ["respect", "privacy"]):
            inferred.add("respectful")
        if any(token in trait for token in ["organ", "communicat", "budget"]):
            inferred.add("organized")
        if any(token in trait for token in ["friendly", "easy"]):
            inferred.add("friendly")

    noise = noise_preference.strip().lower()
    if noise == "quiet":
        inferred.add("quiet")
    if noise == "social":
        inferred.add("social")

    if not inferred:
        inferred.add("friendly")

    preferred_order = [
        "clean",
        "quiet",
        "organized",
        "friendly",
        "social",
        "respectful",
        "early-riser",
        "night-owl",
    ]
    return [trait for trait in preferred_order if trait in inferred]


def _assign_listing_id_for_student(
    student_key: str, campus: RutgersCampus, living_type: LivingType, index: int
) -> str:
    candidates = [listing["id"] for listing in LISTINGS if listing["campus"] == campus and listing["livingType"] == living_type]
    if not candidates:
        candidates = [listing["id"] for listing in LISTINGS if listing["campus"] == campus]
    if not candidates:
        candidates = [listing["id"] for listing in LISTINGS]

    seeded_index = _seeded_int(student_key, f"preferred-listing-{index}") % len(candidates)
    return candidates[seeded_index]


def _student_to_roommate_summary(raw: dict[str, Any], index: int) -> RoommateSummary | None:
    student_id = _clean_text(raw.get("student_id", ""))
    name = _clean_text(raw.get("name", ""))
    if not student_id or not name:
        return None

    campus_area = _clean_text(raw.get("preferred_campus_area", ""))
    campus = _campus_from_area(campus_area)
    if campus is None:
        return None

    preferences = raw.get("campus_living_preferences")
    if not isinstance(preferences, dict):
        preferences = {}

    housing_pref = _clean_text(preferences.get("preferred_housing_type", ""))
    living_type = _living_type_from_housing_pref(housing_pref)
    current_listing_id = _assign_listing_id_for_student(student_id, campus, living_type, index=index)

    roommate_preferences = raw.get("roommate_preferences")
    if not isinstance(roommate_preferences, dict):
        roommate_preferences = {}
    raw_traits = roommate_preferences.get("traits")
    traits = _normalize_student_traits(raw_traits if isinstance(raw_traits, list) else [], _clean_text(preferences.get("noise_preference", "")))

    raw_interests = raw.get("interests")
    interests: list[str] = []
    if isinstance(raw_interests, list):
        interests = [_clean_text(item) for item in raw_interests if _clean_text(item)]

    try:
        budget = int(raw.get("monthly_budget_usd", 1000))
    except (TypeError, ValueError):
        budget = 1000

    avatar = _clean_text(raw.get("image_url", ""))
    if not _valid_image_url(avatar):
        avatar = HOUSEMATE_AVATARS[_seeded_int(student_id, "avatar") % len(HOUSEMATE_AVATARS)]

    return {
        "id": f"fs_{student_id.lower()}",
        "name": name,
        "avatar": avatar,
        "year": _normalize_student_year(_clean_text(raw.get("year", ""))),
        "major": _clean_text(raw.get("major", "")) or "Undeclared",
        "budget": max(450, budget),
        "bio": _clean_text(raw.get("bio", "")) or "Looking for a compatible Rutgers roommate and stable housing setup.",
        "interests": interests or ["campus events", "coffee", "study groups"],
        "traits": traits,
        "preferredCampuses": [campus],
        "moveInWindow": "Flexible",
        "currentListingId": current_listing_id,
    }


def _load_fake_roommates() -> list[RoommateSummary]:
    if not FAKE_STUDENTS_PATH.exists():
        return []

    try:
        payload = json.loads(FAKE_STUDENTS_PATH.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        return []

    if isinstance(payload, dict):
        items = payload.get("items", [])
    elif isinstance(payload, list):
        items = payload
    else:
        return []

    if not isinstance(items, list):
        return []

    roommates: list[RoommateSummary] = []
    for index, raw in enumerate(items):
        if not isinstance(raw, dict):
            continue
        normalized = _student_to_roommate_summary(raw, index=index)
        if normalized:
            roommates.append(normalized)

    return roommates


def _apply_fake_roommates_if_available() -> None:
    global ROOMMATES, ROOMMATES_BY_LISTING

    seeded_roommates = _load_fake_roommates()
    if not seeded_roommates:
        return

    ROOMMATES = seeded_roommates
    ROOMMATES_BY_LISTING = {}
    for roommate in ROOMMATES:
        ROOMMATES_BY_LISTING.setdefault(roommate["currentListingId"], []).append(roommate)


def _distance_from_dataset(campus: RutgersCampus, living_type: LivingType, seed_key: str) -> float:
    seed = _seeded_int(seed_key, "distance")
    if living_type == "on_campus":
        return round(0.1 + ((seed % 26) / 100), 2)

    campus_bases: dict[RutgersCampus, float] = {
        "college_avenue": 0.35,
        "cook_douglass": 0.45,
        "busch": 0.55,
        "livingston": 0.6,
    }
    base = campus_bases[campus]
    spread = (seed % 190) / 100
    return round(base + spread, 2)


def _build_housemates(listing_id: str, count: int) -> list[HousemateCard]:
    housemates: list[HousemateCard] = []
    for offset in range(count):
        person_seed = _seeded_int(f"{listing_id}:{offset}", "housemate")
        first_name = HOUSEMATE_FIRST_NAMES[person_seed % len(HOUSEMATE_FIRST_NAMES)]
        last_name = HOUSEMATE_LAST_NAMES[(person_seed // 7) % len(HOUSEMATE_LAST_NAMES)]
        major = HOUSEMATE_MAJORS[(person_seed // 13) % len(HOUSEMATE_MAJORS)]
        year = HOUSEMATE_YEARS[(person_seed // 17) % len(HOUSEMATE_YEARS)]
        avatar = HOUSEMATE_AVATARS[(person_seed // 19) % len(HOUSEMATE_AVATARS)]
        trait_start = (person_seed // 23) % len(HOUSEMATE_TRAITS)
        traits = [
            HOUSEMATE_TRAITS[trait_start],
            HOUSEMATE_TRAITS[(trait_start + 3) % len(HOUSEMATE_TRAITS)],
            HOUSEMATE_TRAITS[(trait_start + 6) % len(HOUSEMATE_TRAITS)],
        ]
        housemates.append(
            {
                "id": f"{listing_id}_h{offset + 1}",
                "name": f"{first_name} {last_name}",
                "year": year,
                "major": major,
                "traits": traits,
                "avatar": avatar,
            }
        )

    return housemates


def _roommate_to_housemate(roommate: RoommateSummary) -> HousemateCard:
    return {
        "id": roommate["id"],
        "name": roommate["name"],
        "year": roommate["year"],
        "major": roommate["major"],
        "traits": roommate["traits"],
        "avatar": roommate["avatar"],
    }


def _roommate_living_type(roommate: RoommateSummary) -> LivingType | None:
    listing = LISTING_BY_ID.get(roommate["currentListingId"])
    if not listing:
        return None
    return listing["livingType"]


def _select_seeded_housemates(
    listing_id: str, campus: RutgersCampus, living_type: LivingType, desired_count: int
) -> list[HousemateCard]:
    if desired_count <= 0:
        return []

    candidates = [
        roommate
        for roommate in ROOMMATES
        if _roommate_living_type(roommate) == living_type and campus in roommate["preferredCampuses"]
    ]
    if not candidates:
        candidates = [roommate for roommate in ROOMMATES if _roommate_living_type(roommate) == living_type]
    if not candidates:
        return []

    sorted_candidates = sorted(candidates, key=lambda roommate: roommate["id"])
    start = _seeded_int(listing_id, "seeded-housemate-start") % len(sorted_candidates)
    selected: list[HousemateCard] = []
    seen: set[str] = set()
    target_count = min(desired_count, len(sorted_candidates))

    for offset in range(len(sorted_candidates)):
        candidate = sorted_candidates[(start + offset) % len(sorted_candidates)]
        if candidate["id"] in seen:
            continue
        selected.append(_roommate_to_housemate(candidate))
        seen.add(candidate["id"])
        if len(selected) >= target_count:
            break

    return selected


def _off_campus_housemate_state(
    listing_id: str, campus: RutgersCampus, bedrooms: int, listing_type: str
) -> tuple[list[HousemateCard], int]:
    seed = _seeded_int(listing_id, "occupancy")

    if listing_type == "entire_place":
        return [], max(1, bedrooms)

    if listing_type == "shared_room":
        max_housemates = max(2, min(5, bedrooms + 2))
        housemate_count = 2 + (seed % max(1, max_housemates - 1))
        available_rooms = 1 + (_seeded_int(listing_id, "shared-slots") % 2)
        seeded_housemates = _select_seeded_housemates(
            listing_id=listing_id,
            campus=campus,
            living_type="off_campus",
            desired_count=housemate_count,
        )
        if seeded_housemates:
            return seeded_housemates, available_rooms
        return _build_housemates(listing_id, housemate_count), available_rooms

    max_housemates = max(1, min(4, bedrooms + 1))
    housemate_count = 1 + (seed % max_housemates)
    total_rooms = max(bedrooms, housemate_count + 1)
    available_rooms = max(1, total_rooms - housemate_count)
    seeded_housemates = _select_seeded_housemates(
        listing_id=listing_id,
        campus=campus,
        living_type="off_campus",
        desired_count=housemate_count,
    )
    if seeded_housemates:
        return seeded_housemates, available_rooms
    return _build_housemates(listing_id, housemate_count), available_rooms


def _on_campus_room_availability(listing_id: str) -> int:
    seed = _seeded_int(listing_id, "availability")
    return 6 + (seed % 13)


def _listing_type_from_dataset(raw_type: str, living_type: LivingType, bedrooms: int, seed_key: str) -> str:
    normalized = raw_type.strip().lower()
    if living_type == "on_campus":
        return "shared_room"

    if "townhome" in normalized:
        return "entire_place"

    seed = _seeded_int(seed_key, "room-type") % 100
    if bedrooms >= 3 and seed < 28:
        return "entire_place"
    if seed < 62:
        return "private_room"
    return "shared_room"


def _price_from_dataset(
    campus: RutgersCampus, living_type: LivingType, listing_type: str, bedrooms: int, seed_key: str
) -> int:
    seed = _seeded_int(seed_key, "price")
    campus_adjustment: dict[RutgersCampus, int] = {
        "college_avenue": 120,
        "cook_douglass": 40,
        "busch": 20,
        "livingston": 80,
    }
    adjustment = campus_adjustment[campus]

    if living_type == "on_campus":
        return int(round((980 + (seed % 420) + adjustment) / 5) * 5)

    if listing_type == "shared_room":
        return int(round((560 + (seed % 370) + adjustment) / 5) * 5)
    if listing_type == "entire_place":
        return int(round((max(1800, bedrooms * 650) + (seed % 900) + (adjustment * 2)) / 10) * 10)
    return int(round((760 + (seed % 520) + adjustment) / 5) * 5)


def _dataset_row_to_housing_listing(raw: dict[str, Any], index: int) -> HousingListing | None:
    title = _clean_text(raw.get("title", ""))
    if not title:
        return None

    category = _clean_text(raw.get("category", "")).lower()
    if category not in {"off_campus", "on_campus"}:
        return None
    living_type = cast(LivingType, category)

    campus_area = _clean_text(raw.get("campus_area", ""))
    campus = _campus_from_area(campus_area)
    if campus is None:
        return None

    bedrooms_min = _safe_float(raw.get("bedrooms_min"))
    bedrooms_max = _safe_float(raw.get("bedrooms_max"))
    bedroom_candidates = [value for value in (bedrooms_min, bedrooms_max) if value is not None]
    bedrooms = max(1, int(round(max(bedroom_candidates)))) if bedroom_candidates else 1

    bathrooms_min = _safe_float(raw.get("bathrooms_min"))
    bathrooms_max = _safe_float(raw.get("bathrooms_max"))
    bathroom_candidates = [value for value in (bathrooms_min, bathrooms_max) if value is not None]
    bathrooms = round(max(bathroom_candidates), 1) if bathroom_candidates else 1.0

    city = _clean_text(raw.get("city", ""))
    state = _clean_text(raw.get("state", ""))
    zip_code = _clean_text(raw.get("zip", ""))
    street_address = _clean_text(raw.get("address", ""))
    full_address = ", ".join([part for part in [street_address, city, state, zip_code] if part])

    listing_id = f"rutgers_{index + 1}"
    listing_type = _listing_type_from_dataset(
        _clean_text(raw.get("listing_type", "")),
        living_type,
        bedrooms=bedrooms,
        seed_key=listing_id,
    )
    source_url = _clean_text(raw.get("source_url", ""))
    source_notes = _clean_text(raw.get("source_notes", ""))
    image_reference = _clean_text(raw.get("image_reference", ""))
    image_url = _clean_text(raw.get("image_url", ""))
    price = _price_from_dataset(campus, living_type, listing_type, bedrooms=bedrooms, seed_key=listing_id)
    housemates: list[HousemateCard] = []
    if living_type == "off_campus":
        housemates, available_rooms = _off_campus_housemate_state(
            listing_id,
            campus=campus,
            bedrooms=bedrooms,
            listing_type=listing_type,
        )
    else:
        available_rooms = _on_campus_room_availability(listing_id)

    detail_bits: list[str] = []
    if source_notes:
        detail_bits.append(source_notes)
    if image_reference:
        detail_bits.append(f"Image reference: {image_reference}.")
    if source_url:
        detail_bits.append(f"Source: {source_url}")
    if living_type == "off_campus":
        if listing_type == "shared_room":
            detail_bits.append("Room setup: Shared bedroom with another student.")
        elif listing_type == "private_room":
            detail_bits.append("Room setup: Private bedroom in a shared house.")
        else:
            detail_bits.append("Room setup: Entire home rental, no fixed housemates.")
    description = " ".join(detail_bits) or "Listing imported from Rutgers housing dataset."

    amenities = ["WiFi", "Study Space"]
    if living_type == "on_campus":
        amenities.extend(["Laundry in Building", "Residence Support"])
    else:
        amenities.extend(["Washer/Dryer", "Transit Access"])

    return {
        "id": listing_id,
        "title": title,
        "price": price,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "type": listing_type,
        "livingType": living_type,
        "neighborhood": campus_area or DATASET_CAMPUS_LABELS[campus],
        "township": city or _township_from_neighborhood(campus_area),
        "campus": campus,
        "address": full_address or title,
        "distanceToCampus": _distance_from_dataset(campus, living_type, seed_key=listing_id),
        "amenities": amenities,
        "images": [image_url] if _valid_image_url(image_url) else [FALLBACK_IMAGES[campus]],
        "isFeatured": index < 6,
        "availableRooms": available_rooms,
        "utilitiesIncluded": living_type == "on_campus",
        "petsAllowed": False,
        "furnished": living_type == "on_campus",
        "parking": campus in {"busch", "livingston"},
        "description": description,
        "nearestUniversity": "Rutgers University-New Brunswick",
        "housemates": housemates,
    }


def _load_rutgers_dataset_housing_listings() -> list[HousingListing]:
    if not RUTGERS_DATASET_PATH.exists():
        return []

    try:
        payload = json.loads(RUTGERS_DATASET_PATH.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError):
        return []

    if not isinstance(payload, dict):
        return []

    items = payload.get("items")
    if not isinstance(items, list):
        return []

    listings: list[HousingListing] = []
    for index, raw in enumerate(items):
        if not isinstance(raw, dict):
            continue
        normalized = _dataset_row_to_housing_listing(raw, index=index)
        if normalized:
            listings.append(normalized)

    return listings


_apply_fake_roommates_if_available()


def _load_local_listing_summaries() -> list[ListingSummary]:
    if not LOCAL_HOUSES_SNAPSHOT_PATH.exists():
        return []

    try:
        payload = json.loads(LOCAL_HOUSES_SNAPSHOT_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []

    if not isinstance(payload, list):
        return []

    valid_campuses: set[str] = {"livingston", "college_avenue", "cook_douglass", "busch"}
    valid_living_types: set[str] = {"off_campus", "on_campus"}
    normalized: list[ListingSummary] = []

    for index, raw in enumerate(payload):
        if not isinstance(raw, dict):
            continue

        campus = str(raw.get("campus", "")).strip().lower()
        living_type = str(raw.get("livingType", "off_campus")).strip().lower()
        if campus not in valid_campuses or living_type not in valid_living_types:
            continue
        typed_campus = cast(RutgersCampus, campus)
        typed_living_type = cast(LivingType, living_type)

        title = str(raw.get("title", "")).strip()
        neighborhood = str(raw.get("neighborhood", "")).strip()
        if not title or not neighborhood:
            continue

        try:
            price = int(raw.get("price", 0))
            distance = float(raw.get("distanceToCampus", 0.8))
            rooms = int(raw.get("availableRooms", 1))
        except (TypeError, ValueError):
            continue

        normalized.append(
            {
                "id": str(raw.get("id", f"local_{index + 1}")).strip() or f"local_{index + 1}",
                "title": title,
                "price": max(0, price),
                "neighborhood": neighborhood,
                "campus": typed_campus,
                "livingType": typed_living_type,
                "distanceToCampus": max(0.1, round(distance, 2)),
                "availableRooms": max(1, rooms),
            }
        )

    return normalized


def _get_housing_listings() -> tuple[list[HousingListing], str]:
    rutgers_dataset = _load_rutgers_dataset_housing_listings()
    if rutgers_dataset:
        return rutgers_dataset, "rutgers-dataset"

    local_seeded = _load_local_listing_summaries()
    if local_seeded:
        has_on_campus = any(item["livingType"] == "on_campus" for item in local_seeded)
        with_optional_dorms = list(local_seeded)
        if not has_on_campus:
            with_optional_dorms.extend(item for item in LISTINGS if item["livingType"] == "on_campus")
        return [_summary_to_housing_listing(summary) for summary in with_optional_dorms], "local-snapshot"

    demo_seeded = [_summary_to_housing_listing(summary) for summary in LISTINGS]
    return demo_seeded, "demo-seeded"


def _normalize_list(items: Any) -> set[str]:
    if not isinstance(items, list):
        return set()
    return {str(item).strip().lower() for item in items if str(item).strip()}


def _query_tokens(value: str) -> list[str]:
    return [token for token in re.split(r"[^a-z0-9]+", value.lower()) if len(token) >= 2]


def _coverage_points(matched: set[str], requested: set[str], max_points: int) -> int:
    if not requested:
        return 0
    coverage = len(matched) / len(requested)
    return int(round(coverage * max_points))


def _roommate_sort_key(
    item: tuple[int, str, list[str], RoommateSummary], preferences: dict[str, Any]
) -> tuple[int, int, float, str]:
    score, _, _, roommate = item
    max_budget = preferences.get("maxBudget")
    budget_delta = 9999
    if isinstance(max_budget, (int, float)):
        budget_delta = abs(roommate["budget"] - int(max_budget))

    listing = LISTING_BY_ID.get(roommate["currentListingId"])
    commute_distance = listing["distanceToCampus"] if listing else 99.0
    return (-score, budget_delta, commute_distance, roommate["id"])


def _apply_roommate_score_tie_spread(
    ranked: list[tuple[int, str, list[str], RoommateSummary]]
) -> list[tuple[int, str, list[str], RoommateSummary]]:
    adjusted: list[tuple[int, str, list[str], RoommateSummary]] = []
    previous_raw_score: int | None = None
    tie_offset = 0
    previous_emitted_score: int | None = None

    for score, reason, signals, roommate in ranked:
        if previous_raw_score is None or score != previous_raw_score:
            tie_offset = 0
            previous_raw_score = score
        else:
            tie_offset += 1

        next_score = max(1, score - min(3, tie_offset))
        if previous_emitted_score is not None and next_score >= previous_emitted_score:
            next_score = max(1, previous_emitted_score - 1)

        previous_emitted_score = next_score
        adjusted.append((next_score, reason, signals, roommate))

    return adjusted


def _house_sort_key(
    item: tuple[int, str, list[str], ListingSummary], preferences: dict[str, Any]
) -> tuple[int, int, float, str]:
    score, _, _, listing = item
    max_budget = preferences.get("maxBudget")
    budget_delta = 9999
    if isinstance(max_budget, (int, float)):
        budget_delta = abs(listing["price"] - int(max_budget))
    return (-score, budget_delta, listing["distanceToCampus"], listing["id"])


def _apply_house_score_tie_spread(
    ranked: list[tuple[int, str, list[str], ListingSummary]]
) -> list[tuple[int, str, list[str], ListingSummary]]:
    adjusted: list[tuple[int, str, list[str], ListingSummary]] = []
    previous_raw_score: int | None = None
    tie_offset = 0
    previous_emitted_score: int | None = None

    for score, reason, signals, listing in ranked:
        if previous_raw_score is None or score != previous_raw_score:
            tie_offset = 0
            previous_raw_score = score
        else:
            tie_offset += 1

        next_score = max(1, score - min(2, tie_offset))
        if previous_emitted_score is not None and next_score >= previous_emitted_score:
            next_score = max(1, previous_emitted_score - 1)

        previous_emitted_score = next_score
        adjusted.append((next_score, reason, signals, listing))

    return adjusted


def _extract_mode_feedback(feedback: dict[str, int], mode: MatchMode) -> dict[str, int]:
    prefix = f"{mode}:"
    extracted: dict[str, int] = {}
    for key, value in feedback.items():
        if key.startswith(prefix):
            extracted[key.removeprefix(prefix)] = value
    return extracted


def _dedupe_signals(signals: list[str], limit: int = 3) -> list[str]:
    deduped: list[str] = []
    seen: set[str] = set()
    for signal in signals:
        normalized = signal.strip().lower()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(signal)
        if len(deduped) >= limit:
            break
    return deduped


def _score_roommate(profile: RoommateSummary, preferences: dict[str, Any], feedback_score: int) -> tuple[int, str, list[str]]:
    score = 34
    reasons: list[str] = []
    signals: list[str] = []

    desired_living = str(preferences.get("housingMode", "")).strip().lower()
    linked_listing = LISTING_BY_ID.get(profile["currentListingId"])
    if desired_living in {"off_campus", "on_campus"} and linked_listing:
        if linked_listing["livingType"] == desired_living:
            score += 12
            reasons.append("matches housing mode")
            signals.append("Matches housing mode")
        else:
            score -= 8

    campus = str(preferences.get("campus", "")).strip().lower()
    preferred_campuses = {value.lower() for value in profile["preferredCampuses"]}
    if campus:
        if campus in preferred_campuses:
            score += 14
            reasons.append("same campus preference")
            signals.append("Same campus")
        else:
            score -= 8

    max_budget = preferences.get("maxBudget")
    if isinstance(max_budget, (int, float)):
        budget_target = int(max_budget)
        budget_delta = profile["budget"] - budget_target
        if budget_delta <= 0:
            score += 14
            reasons.append("fits budget")
            signals.append("Budget fit")
        elif budget_delta <= 75:
            score += 10
            reasons.append("close to budget")
            signals.append("Near budget")
        elif budget_delta <= 150:
            score += 6
            reasons.append("manageable budget stretch")
            signals.append("Slight budget stretch")
        elif budget_delta <= 250:
            score += 2
            signals.append("Budget stretch")
        elif budget_delta <= 400:
            score -= 6
        else:
            score -= 12

    if linked_listing:
        commute_points = max(0, int(round((1.2 - min(linked_listing["distanceToCampus"], 1.2)) * 5)))
        if commute_points > 0:
            score += commute_points
            signals.append("Short campus commute")

    query = str(preferences.get("query", "")).strip().lower()
    if query:
        query_tokens = _query_tokens(query)
        searchable = " ".join(
            [
                profile["name"],
                profile["major"],
                profile["bio"],
                " ".join(profile["traits"]),
                " ".join(profile["interests"]),
            ]
        ).lower()
        if query in searchable:
            score += 6
            reasons.append("matches your search")
            signals.append("Matches search")
        elif query_tokens:
            overlap_count = len({token for token in query_tokens if token in searchable})
            if overlap_count > 0:
                score += min(10, overlap_count * 3)
                reasons.append("query term overlap")
                signals.append(f"Query overlap: {overlap_count} terms")

    requested_traits = _normalize_list(preferences.get("traits", []))
    profile_traits = {item.lower() for item in profile["traits"]}
    matched_traits = requested_traits.intersection(profile_traits)
    if requested_traits:
        score += _coverage_points(matched_traits, requested_traits, 24)
    if matched_traits:
        top_traits = ", ".join(sorted(matched_traits)[:3])
        reasons.append(f"shared traits: {top_traits}")
        signals.append(f"Shared traits: {top_traits}")
    elif requested_traits:
        score -= 4

    requested_interests = _normalize_list(preferences.get("interests", []))
    profile_interests = {item.lower() for item in profile["interests"]}
    matched_interests = requested_interests.intersection(profile_interests)
    if requested_interests:
        score += _coverage_points(matched_interests, requested_interests, 16)
    if matched_interests:
        top_interests = ", ".join(sorted(matched_interests)[:3])
        reasons.append(f"shared interests: {top_interests}")
        signals.append(f"Shared interests: {top_interests}")
    elif requested_interests:
        score -= 3

    if matched_traits and matched_interests:
        score += 4
        signals.append("Strong lifestyle overlap")

    if feedback_score > 0:
        score += 14
        reasons.append("based on your previous likes")
        signals.append("Aligned with your likes")

    score = max(1, min(score, 99))
    reason = reasons[0] if reasons else "overall lifestyle compatibility"
    if not signals:
        signals.append("Overall lifestyle compatibility")
    return score, reason, _dedupe_signals(signals)


def _score_house(listing: ListingSummary, preferences: dict[str, Any], feedback_score: int) -> tuple[int, str, list[str]]:
    score = 32
    reasons: list[str] = []
    signals: list[str] = []

    desired_living = str(preferences.get("housingMode", "")).strip().lower()
    if desired_living in {"off_campus", "on_campus"}:
        if listing["livingType"] == desired_living:
            score += 14
            reasons.append("matches housing mode")
            signals.append("Matches housing mode")
        else:
            score -= 8

    campus = str(preferences.get("campus", "")).strip().lower()
    if campus:
        if listing["campus"].lower() == campus:
            score += 14
            reasons.append("same campus")
            signals.append("Same campus")
        else:
            score -= 6

    max_budget = preferences.get("maxBudget")
    if isinstance(max_budget, (int, float)):
        budget_target = int(max_budget)
        budget_delta = listing["price"] - budget_target
        if budget_delta <= 0:
            score += 14
            reasons.append("fits budget")
            signals.append("Budget fit")
        elif budget_delta <= 75:
            score += 10
            reasons.append("close to budget")
            signals.append("Near budget")
        elif budget_delta <= 150:
            score += 6
            reasons.append("manageable budget stretch")
            signals.append("Slight budget stretch")
        elif budget_delta <= 250:
            score += 2
            signals.append("Budget stretch")
        elif budget_delta <= 400:
            score -= 6
        else:
            score -= 12

    commute_points = max(0, int(round((1.4 - min(listing["distanceToCampus"], 1.4)) * 5)))
    if commute_points > 0:
        score += commute_points
        signals.append("Short campus commute")

    query = str(preferences.get("query", "")).strip().lower()
    if query:
        searchable = f"{listing['title']} {listing['neighborhood']}".lower()
        if query in searchable:
            score += 6
            reasons.append("matches your search")
            signals.append("Matches search")
        else:
            query_overlap = {token for token in _query_tokens(query) if token in searchable}
            if query_overlap:
                score += min(10, len(query_overlap) * 3)
                reasons.append("query term overlap")
                signals.append(f"Query overlap: {len(query_overlap)} terms")

    requested_features = _normalize_list(preferences.get("features", []))
    if requested_features:
        campus_feature_map: dict[RutgersCampus, str] = {
            "college_avenue": "college avenue",
            "cook_douglass": "cook douglass",
            "busch": "busch",
            "livingston": "livingston",
        }
        listing_features = {
            "near campus" if listing["distanceToCampus"] <= 0.6 else "farther from campus",
            "budget friendly" if listing["price"] <= 900 else "premium pricing",
            "multiple rooms" if listing["availableRooms"] >= 2 else "single room",
            "off campus" if listing["livingType"] == "off_campus" else "on campus",
            "wifi",
            "washer/dryer",
            "study space",
            campus_feature_map[listing["campus"]],
        }
        if listing["campus"] in {"busch", "livingston"} or listing["livingType"] == "off_campus":
            listing_features.add("parking")
        if listing["livingType"] == "on_campus":
            listing_features.add("furnished")
            listing_features.add("utilities included")
        feature_overlap = requested_features.intersection(listing_features)
        score += _coverage_points(feature_overlap, requested_features, 24)
        if feature_overlap:
            top_features = ", ".join(sorted(feature_overlap)[:3])
            reasons.append(f"house feature fit: {top_features}")
            signals.append(f"House features: {top_features}")
        else:
            score -= 4

    requested_traits = _normalize_list(preferences.get("traits", []))
    if requested_traits:
        house_traits: set[str] = set()
        for roommate in ROOMMATES_BY_LISTING.get(listing["id"], []):
            house_traits.update(item.lower() for item in roommate["traits"])
        trait_overlap = requested_traits.intersection(house_traits)
        score += _coverage_points(trait_overlap, requested_traits, 10)
        if trait_overlap:
            top_overlap = ", ".join(sorted(trait_overlap)[:3])
            reasons.append(f"house trait fit: {top_overlap}")
            signals.append(f"House traits: {top_overlap}")
        else:
            score -= 2

    if feedback_score > 0:
        score += 14
        reasons.append("based on your previous likes")
        signals.append("Aligned with your likes")

    score = max(1, min(score, 99))
    reason = reasons[0] if reasons else "overall housing fit"
    if not signals:
        signals.append("Overall housing fit")
    return score, reason, _dedupe_signals(signals)


def _extract_json_object(raw: str) -> dict[str, Any] | None:
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1 or start >= end:
        return None
    try:
        return json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return None


def _openai_roommate_rank(
    candidates: list[RoommateSummary], preferences: dict[str, Any], feedback: dict[str, int]
) -> dict[str, tuple[int, str]] | None:
    api_key = getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    payload = {
        "model": getenv("OPENAI_MATCH_MODEL", "gpt-4o-mini"),
        "temperature": 0.2,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You rank Rutgers roommate matches. Return JSON only with schema "
                    "{\"matches\":[{\"id\":string,\"score\":int,\"reason\":string}]}. "
                    "Score must be 1-99."
                ),
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "preferences": preferences,
                        "feedback": feedback,
                        "candidates": candidates,
                    }
                ),
            },
        ],
    }

    request_obj = Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urlopen(request_obj, timeout=20) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return None

    choices = response_payload.get("choices", [])
    if not choices:
        return None

    message = choices[0].get("message", {}).get("content", "")
    parsed = _extract_json_object(message)
    if not parsed:
        return None

    matches = parsed.get("matches", [])
    if not isinstance(matches, list):
        return None

    ranked: dict[str, tuple[int, str]] = {}
    for match in matches:
        if not isinstance(match, dict):
            continue
        candidate_id = str(match.get("id", "")).strip()
        if not candidate_id:
            continue
        try:
            score = int(match.get("score", 50))
        except (TypeError, ValueError):
            score = 50
        reason = str(match.get("reason", "overall compatibility"))
        ranked[candidate_id] = (max(1, min(score, 99)), reason)

    return ranked or None


def _rank_roommates(session_id: str, preferences: dict[str, Any], top_n: int = 6) -> tuple[list[RoommateMatchResult], str]:
    feedback = _extract_mode_feedback(SESSION_FEEDBACK.get(session_id, {}), "roommates")

    scored_candidates: list[tuple[int, str, list[str], RoommateSummary]] = []
    for roommate in ROOMMATES:
        if roommate["currentListingId"] not in LISTING_BY_ID:
            continue
        feedback_score = feedback.get(roommate["id"], 0)
        if feedback_score < 0:
            continue
        score, reason, signals = _score_roommate(roommate, preferences, feedback_score)
        if score <= 0:
            continue
        scored_candidates.append((score, reason, signals, roommate))

    scored_candidates.sort(key=lambda item: _roommate_sort_key(item, preferences))
    strategy = "heuristic"

    openai_ranked = _openai_roommate_rank([candidate[3] for candidate in scored_candidates[:12]], preferences, feedback)
    if openai_ranked:
        strategy = "openai+heuristic"
        merged: list[tuple[int, str, list[str], RoommateSummary]] = []
        for heuristic_score, heuristic_reason, heuristic_signals, roommate in scored_candidates:
            openai_match = openai_ranked.get(roommate["id"])
            if openai_match:
                ai_score, ai_reason = openai_match
                combined = int(round((heuristic_score * 0.45) + (ai_score * 0.55)))
                merged.append((combined, ai_reason or heuristic_reason, heuristic_signals, roommate))
            else:
                merged.append((heuristic_score, heuristic_reason, heuristic_signals, roommate))
        scored_candidates = sorted(merged, key=lambda item: _roommate_sort_key(item, preferences))

    scored_candidates = _apply_roommate_score_tie_spread(scored_candidates)

    results: list[RoommateMatchResult] = []
    for score, reason, signals, roommate in scored_candidates[:top_n]:
        linked_house = LISTING_BY_ID.get(roommate["currentListingId"])
        result: RoommateMatchResult = {
            **roommate,
            "linkedHouse": linked_house,
            "matchScore": score,
            "matchReason": reason,
            "matchSignals": _dedupe_signals(signals),
        }
        results.append(result)

    return results, strategy


def _rank_houses(session_id: str, preferences: dict[str, Any], top_n: int = 6) -> tuple[list[HouseMatchResult], str]:
    feedback = _extract_mode_feedback(SESSION_FEEDBACK.get(session_id, {}), "houses")

    scored: list[tuple[int, str, list[str], ListingSummary]] = []
    for listing in LISTINGS:
        feedback_score = feedback.get(listing["id"], 0)
        if feedback_score < 0:
            continue
        score, reason, signals = _score_house(listing, preferences, feedback_score)
        if score <= 0:
            continue
        scored.append((score, reason, signals, listing))

    scored.sort(key=lambda item: _house_sort_key(item, preferences))
    scored = _apply_house_score_tie_spread(scored)

    results: list[HouseMatchResult] = []
    for score, reason, signals, listing in scored[:top_n]:
        recommended_roommates = [roommate["name"] for roommate in ROOMMATES_BY_LISTING.get(listing["id"], [])[:3]]
        result: HouseMatchResult = {
            **listing,
            "recommendedRoommates": recommended_roommates,
            "matchScore": score,
            "matchReason": reason,
            "matchSignals": _dedupe_signals(signals),
        }
        results.append(result)

    return results, "heuristic"


def _rank_matches(
    session_id: str, mode: MatchMode, preferences: dict[str, Any]
) -> tuple[list[RoommateMatchResult] | list[HouseMatchResult], str]:
    if mode == "houses":
        return _rank_houses(session_id=session_id, preferences=preferences)
    return _rank_roommates(session_id=session_id, preferences=preferences)


def _ensure_saved_store(session_id: str) -> dict[MatchMode, set[str]]:
    store = SESSION_SAVED.setdefault(session_id, {})
    store.setdefault("roommates", set())
    store.setdefault("houses", set())
    return store


def _refresh_seeded_roommates() -> None:
    _apply_fake_roommates_if_available()


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.get("/api/health")
    def health() -> tuple[dict[str, str], int]:
        return {"status": "ok", "service": "reroot-backend"}, 200

    @app.get("/api/listings")
    def get_listings() -> tuple[dict[str, list[ListingSummary]], int]:
        return {"items": LISTINGS}, 200

    @app.get("/api/housing/listings")
    def get_housing_listings() -> tuple[dict[str, Any], int]:
        _refresh_seeded_roommates()
        items, source = _get_housing_listings()

        living_type = str(request.args.get("livingType", "")).strip().lower()
        if living_type in {"off_campus", "on_campus"}:
            items = [item for item in items if item["livingType"] == living_type]

        query = str(request.args.get("q", "")).strip().lower()
        if query:
            items = [
                item
                for item in items
                if query in f"{item['title']} {item['address']} {item['township']} {item['neighborhood']}".lower()
            ]

        return {"items": items, "source": source}, 200

    @app.get("/api/housing/listings/<listing_id>")
    def get_housing_listing_by_id(listing_id: str) -> tuple[dict[str, Any], int]:
        _refresh_seeded_roommates()
        items, source = _get_housing_listings()
        for item in items:
            if item["id"] == listing_id:
                return {"item": item, "source": source}, 200
        return {"error": "listing not found"}, 404

    @app.get("/api/roommates")
    def get_roommates() -> tuple[dict[str, list[RoommateSummary]], int]:
        _refresh_seeded_roommates()
        return {"items": ROOMMATES}, 200

    @app.get("/api/matchmaking/saved")
    def get_saved_targets() -> tuple[dict[str, Any], int]:
        session_id = str(request.args.get("sessionId", "")).strip()
        mode = str(request.args.get("mode", "roommates")).strip().lower()
        if not session_id:
            return {"error": "sessionId is required"}, 400
        if mode not in {"roommates", "houses"}:
            return {"error": "mode must be 'roommates' or 'houses'"}, 400

        typed_mode = cast(MatchMode, mode)
        saved_store = _ensure_saved_store(session_id)
        return {
            "sessionId": session_id,
            "mode": typed_mode,
            "savedIds": sorted(saved_store[typed_mode]),
        }, 200

    @app.post("/api/matchmaking/saved")
    def update_saved_targets() -> tuple[dict[str, Any], int]:
        payload = request.get_json(silent=True) or {}
        session_id = str(payload.get("sessionId", "")).strip()
        target_id = str(payload.get("targetId", "")).strip()
        mode = str(payload.get("mode", "roommates")).strip().lower()
        saved = payload.get("saved")

        if not session_id or not target_id or not isinstance(saved, bool):
            return {"error": "sessionId, targetId, and boolean saved are required"}, 400
        if mode not in {"roommates", "houses"}:
            return {"error": "mode must be 'roommates' or 'houses'"}, 400

        typed_mode = cast(MatchMode, mode)
        saved_store = _ensure_saved_store(session_id)
        mode_store = saved_store[typed_mode]
        if saved:
            mode_store.add(target_id)
        else:
            mode_store.discard(target_id)

        return {
            "status": "ok",
            "sessionId": session_id,
            "mode": typed_mode,
            "savedIds": sorted(mode_store),
        }, 200

    @app.post("/api/matchmaking/suggestions")
    def get_match_suggestions() -> tuple[dict[str, Any], int]:
        _refresh_seeded_roommates()
        payload = request.get_json(silent=True) or {}
        session_id = str(payload.get("sessionId") or uuid4())
        mode = str(payload.get("mode", "roommates")).strip().lower()
        if mode not in {"roommates", "houses"}:
            return {"error": "mode must be 'roommates' or 'houses'"}, 400

        typed_mode = mode
        preferences = payload.get("preferences") if isinstance(payload.get("preferences"), dict) else {}

        SESSION_FEEDBACK.setdefault(session_id, {})
        mode_pref_store = SESSION_PREFERENCES.setdefault(session_id, {})
        mode_pref_store[typed_mode] = preferences

        matches, strategy = _rank_matches(session_id=session_id, mode=typed_mode, preferences=preferences)
        return {
            "sessionId": session_id,
            "mode": typed_mode,
            "items": matches,
            "strategy": strategy,
        }, 200

    @app.post("/api/matchmaking/feedback")
    def submit_feedback() -> tuple[dict[str, Any], int]:
        _refresh_seeded_roommates()
        payload = request.get_json(silent=True) or {}

        session_id = str(payload.get("sessionId", "")).strip()
        target_id = str(payload.get("targetId", payload.get("roommateId", ""))).strip()
        verdict = str(payload.get("verdict", "")).strip().lower()
        mode = str(payload.get("mode", "roommates")).strip().lower()

        if not session_id or not target_id or verdict not in {"like", "dislike", "clear"}:
            return {
                "error": "sessionId, targetId (or roommateId), and verdict ('like', 'dislike', or 'clear') are required"
            }, 400
        if mode not in {"roommates", "houses"}:
            return {"error": "mode must be 'roommates' or 'houses'"}, 400

        feedback_store = SESSION_FEEDBACK.setdefault(session_id, {})
        feedback_key = f"{mode}:{target_id}"
        if verdict == "clear":
            feedback_store.pop(feedback_key, None)
        else:
            feedback_value = 1 if verdict == "like" else -1
            feedback_store[feedback_key] = feedback_value

        mode_pref_store = SESSION_PREFERENCES.setdefault(session_id, {})
        inline_preferences = payload.get("preferences") if isinstance(payload.get("preferences"), dict) else None
        preferences = inline_preferences or mode_pref_store.get(mode, {})
        mode_pref_store[mode] = preferences

        matches, strategy = _rank_matches(session_id=session_id, mode=mode, preferences=preferences)

        return {
            "status": "ok",
            "sessionId": session_id,
            "mode": mode,
            "items": matches,
            "strategy": strategy,
            "feedbackCount": len(feedback_store),
        }, 200

    return app


app = create_app()


if __name__ == "__main__":
    host = getenv("HOST", "127.0.0.1")
    port = int(getenv("PORT", "8000"))
    debug = getenv("FLASK_DEBUG", "1") == "1"
    app.run(host=host, port=port, debug=debug)
