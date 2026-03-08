import { useState, type FormEvent } from "react";
import { CheckCircle2, Upload, Plus, X, Info, ChevronDown } from "lucide-react";
import { campusLabels, campuses, neighborhoods, type ListingType, type RutgersCampus } from "../data/mockData";

const ALL_AMENITIES = [
  "WiFi", "AC", "Parking", "Washer/Dryer", "Dishwasher", "Gym Access",
  "Backyard", "Rooftop", "Laundry in Building", "Furnished", "Bike Storage",
  "Game Room", "Study Room", "Porch", "High Ceilings", "Exposed Brick",
];

type Step = 1 | 2 | 3 | 4;

const FORM_STEPS = [
  { n: 1, label: "Your Place" },
  { n: 2, label: "Details & Pricing" },
  { n: 3, label: "Photos" },
  { n: 4, label: "Contact Info" },
] as const;

const DEMO_PHOTOS = [
  "https://images.unsplash.com/photo-1759264244827-1dde5bee00a5?w=400",
  "https://images.unsplash.com/photo-1621891333885-66f833b348ba?w=400",
  "https://images.unsplash.com/photo-1757439402190-99b73ac8e807?w=400",
];

export function PostListingPage() {
  const [step, setStep] = useState<Step>(1);
  const [quickMode, setQuickMode] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Step 1: About the place
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [campus, setCampus] = useState<RutgersCampus | "">("");
  const [type, setType] = useState<ListingType>("private_room");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [availableRooms, setAvailableRooms] = useState(1);

  // Step 2: Details
  const [price, setPrice] = useState(700);
  const [availableFrom, setAvailableFrom] = useState("");
  const [leaseDuration, setLeaseDuration] = useState("12 months");
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [parking, setParking] = useState(false);
  const [furnished, setFurnished] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  // Step 3: Photos
  const [photos, setPhotos] = useState<string[]>([]);
  // Step 4: Contact
  const [yourName, setYourName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [rutgersAffiliation, setRutgersAffiliation] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const toggleAmenity = (a: string) =>
    setSelectedAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const addDemoPhoto = (url: string) => {
    if (!photos.includes(url)) setPhotos((p) => [...p, url]);
  };

  const removePhoto = (url: string) => setPhotos((p) => p.filter((x) => x !== url));

  const canGoNext = (): boolean => {
    if (step === 1) return Boolean(title && address && neighborhood && campus);
    if (step === 2) return Boolean(price > 0 && availableFrom && description);
    if (step === 3) return photos.length > 0;
    if (step === 4) return Boolean(yourName && email && agreeTerms);
    return false;
  };

  const canSubmit = Boolean(title && address && neighborhood && campus && price > 0 && availableFrom && description && yourName && email && agreeTerms);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Listing Submitted!</h2>
          <p className="text-gray-500 mb-6">
            Your listing for <strong>{title}</strong> ({campus ? campusLabels[campus] : "Rutgers"}) in {neighborhood} has
            been submitted for review. You'll receive an email at <strong>{email}</strong> once it's approved (usually
            within 24 hours).
          </p>
          <div className="bg-emerald-50 rounded-2xl p-4 text-sm text-emerald-700 mb-6 text-left">
            <strong className="block mb-1">What happens next?</strong>
            <ul className="space-y-1 list-disc list-inside text-emerald-600">
              <li>Our team reviews your listing</li>
              <li>We prepare your listing for student discovery</li>
              <li>Listing goes live within 24 hours</li>
              <li>Students can request tours directly</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setStep(1);
              setQuickMode(true);
              setTitle(""); setAddress(""); setNeighborhood(""); setCampus(""); setDescription("");
              setPhotos([]); setYourName(""); setEmail(""); setRutgersAffiliation(""); setAgreeTerms(false);
            }}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Post Another Listing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">List Your Rutgers Room</h1>
          <p className="text-gray-500 text-sm">Reach Rutgers students looking for off-campus housing.</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">One-time listing fee: $15 per house listing.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Mode + Progress */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {quickMode ? "Quick demo mode" : "Step-by-step mode"}
              </p>
              <p className="text-xs text-gray-500">
                {quickMode
                  ? "Most fields are visible on one page so you can complete the form quickly."
                  : "Complete one section at a time with guided progression."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setQuickMode((value) => !value)}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              {quickMode ? "Switch to Step-by-step" : "Switch to Quick Mode"}
            </button>
          </div>

          {!quickMode && (
            <div className="mt-4 flex items-center justify-between">
              {FORM_STEPS.map((s, i) => (
                <div key={s.n} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        step > s.n
                          ? "bg-emerald-600 text-white"
                          : step === s.n
                            ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {step > s.n ? <CheckCircle2 className="h-5 w-5" /> : s.n}
                    </div>
                    <span
                      className={`mt-1.5 hidden text-xs font-medium sm:block ${
                        step === s.n ? "text-emerald-700" : step > s.n ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < FORM_STEPS.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 rounded-full ${step > s.n ? "bg-emerald-600" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Step 1 */}
            {(quickMode || step === 1) && (
              <div className="p-6 space-y-5">
                <h2 className="font-semibold text-gray-900 text-lg">Tell us about your place</h2>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Listing Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sunny 3BR Near Main Campus"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Address *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 College Ave, University District"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Neighborhood *</label>
                    <div className="relative">
                      <select
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 pr-8"
                        required
                      >
                        <option value="">Select neighborhood</option>
                        {neighborhoods.map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Rutgers Campus *</label>
                    <div className="relative">
                      <select
                        value={campus}
                        onChange={(e) => setCampus(e.target.value as RutgersCampus)}
                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 pr-8"
                        required
                      >
                        <option value="">Select campus</option>
                        {campuses.map((campusOption) => (
                          <option key={campusOption} value={campusOption}>
                            {campusLabels[campusOption]}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Listing Type *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { v: "private_room", l: "Private Room", d: "Renting one room in a shared home" },
                      { v: "entire_place", l: "Entire Place", d: "The whole unit is available" },
                      { v: "shared_room", l: "Shared Room", d: "Sharing a room with another person" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setType(opt.v)}
                        className={`border rounded-xl p-3 text-left transition-all ${
                          type === opt.v
                            ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                            : "border-gray-200 hover:border-emerald-200"
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{opt.l}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.d}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Bedrooms", value: bedrooms, set: setBedrooms },
                    { label: "Bathrooms", value: bathrooms, set: setBathrooms },
                    { label: "Rooms to Rent", value: availableRooms, set: setAvailableRooms },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => set(Math.max(1, value - 1))}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-semibold text-gray-900">{value}</span>
                        <button
                          type="button"
                          onClick={() => set(value + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2 */}
            {(quickMode || step === 2) && (
              <div className="p-6 space-y-5">
                <h2 className="font-semibold text-gray-900 text-lg">Pricing & Details</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Monthly Rent ($/mo) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-gray-400 text-sm">$</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(+e.target.value)}
                        className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        min={100}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Available From *</label>
                    <input
                      type="date"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Lease Duration</label>
                  <div className="relative">
                    <select
                      value={leaseDuration}
                      onChange={(e) => setLeaseDuration(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 pr-8"
                    >
                      {["Month-to-month", "3 months", "6 months", "9 months", "12 months"].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Utilities Included", value: utilitiesIncluded, set: setUtilitiesIncluded },
                    { label: "Pets Allowed", value: petsAllowed, set: setPetsAllowed },
                    { label: "Parking Available", value: parking, set: setParking },
                    { label: "Furnished", value: furnished, set: setFurnished },
                  ].map(({ label, value, set }) => (
                    <label
                      key={label}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        value ? "border-emerald-400 bg-emerald-50" : "border-gray-200 hover:border-emerald-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => set(e.target.checked)}
                        className="accent-emerald-600"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Amenities */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_AMENITIES.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAmenity(a)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          selectedAmenities.includes(a)
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your place, current roommates, house rules, and why it's a great fit for a student..."
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 resize-none"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">{description.length}/500 characters</p>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {(quickMode || step === 3) && (
              <div className="p-6 space-y-5">
                <h2 className="font-semibold text-gray-900 text-lg">Add Photos</h2>
                <p className="text-sm text-gray-500">
                  Listings with photos get <strong>3x more</strong> inquiries. Add at least 1 photo.
                </p>

                {/* Upload Area (demo) */}
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-emerald-300 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Drop photos here or click to upload</p>
                  <p className="text-xs text-gray-400">JPG, PNG up to 10MB each</p>
                </div>

                {/* Demo photos to add */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Demo: click to add sample photos
                  </p>
                  <div className="flex gap-3">
                    {DEMO_PHOTOS.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => addDemoPhoto(url)}
                        className={`w-24 h-20 rounded-xl overflow-hidden border-2 transition-all relative ${
                          photos.includes(url) ? "border-emerald-500 opacity-50" : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {!photos.includes(url) && (
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected photos */}
                {photos.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Selected Photos ({photos.length})</p>
                    <div className="flex gap-3 flex-wrap">
                      {photos.map((url, i) => (
                        <div key={url} className="relative group">
                          <img
                            src={url}
                            alt=""
                            className="w-28 h-24 rounded-xl object-cover border-2 border-emerald-200"
                          />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(url)}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4 */}
            {(quickMode || step === 4) && (
              <div className="p-6 space-y-5">
                <h2 className="font-semibold text-gray-900 text-lg">Your Contact Information</h2>
                <p className="text-sm text-gray-500">
                  This information will be used to verify your listing. Your email will not be publicly visible.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Your Name *</label>
                    <input
                      type="text"
                      value={yourName}
                      onChange={(e) => setYourName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Email (.edu preferred) *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@scarletmail.rutgers.edu"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Phone (optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Rutgers Affiliation</label>
                    <div className="relative">
                      <select
                        value={rutgersAffiliation}
                        onChange={(e) => setRutgersAffiliation(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 pr-8"
                      >
                        <option value="">Select affiliation</option>
                        {["Undergraduate", "Graduate", "Faculty/Staff", "Recent Alum"].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Year</label>
                  <div className="relative">
                    <select
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-400 pr-8"
                    >
                      <option value="">Select year</option>
                      {["Freshman", "Sophomore", "Junior", "Senior", "Graduate", "Faculty/Staff"].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Listing Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Title:</span> <strong className="text-gray-800">{title || "-"}</strong></div>
                    <div><span className="text-gray-500">Price:</span> <strong className="text-gray-800">${price}/mo</strong></div>
                    <div><span className="text-gray-500">Neighborhood:</span> <strong className="text-gray-800">{neighborhood || "-"}</strong></div>
                    <div><span className="text-gray-500">Campus:</span> <strong className="text-gray-800">{campus ? campusLabels[campus] : "-"}</strong></div>
                    <div><span className="text-gray-500">Available:</span> <strong className="text-gray-800">{availableFrom || "-"}</strong></div>
                    <div><span className="text-gray-500">Photos:</span> <strong className="text-gray-800">{photos.length} added</strong></div>
                    <div><span className="text-gray-500">Amenities:</span> <strong className="text-gray-800">{selectedAmenities.length} selected</strong></div>
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 accent-emerald-600"
                    required
                  />
                  <span className="text-sm text-gray-600">
                    I confirm this listing is accurate and I have the right to list this property. I agree to Reroot's{" "}
                    <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a> and{" "}
                    <a href="#" className="text-emerald-600 hover:underline">Community Guidelines</a>.
                  </span>
                </label>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
              {quickMode ? (
                <>
                  <span className="text-xs text-gray-500">Quick mode: all sections visible</span>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Submit Listing
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
                    className={`rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-white hover:text-gray-900 ${
                      step === 1 ? "pointer-events-none opacity-0" : ""
                    }`}
                  >
                    Back
                  </button>
                  <span className="text-xs text-gray-400">Step {step} of 4</span>
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => Math.min(4, s + 1) as Step)}
                      disabled={!canGoNext()}
                      className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!canGoNext()}
                      className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Submit Listing
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
