import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  X, 
  Clock, 
  Flame, 
  Wrench, 
  ShoppingBag, 
  UserCheck, 
  CloudSun, 
  Backpack, 
  Tag, 
  Plus, 
  Check, 
  Trash2,
  MapPin,
  Navigation,
  Compass,
  Map as MapIcon
} from 'lucide-react';
import { ActivityCard, ActivityCategory, EnergyLevel, TeacherChaperone } from '../types';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activity: ActivityCard) => void;
  onDelete?: (id: string) => void;
  initialData?: ActivityCard | null;
  teachers: TeacherChaperone[];
  defaultLocation?: { lat: number; lng: number; locationName?: string } | null;
  existingActivities?: ActivityCard[];
}

export interface PlanLocation {
  name: string;
  lat: number;
  lng: number;
  icon?: string;
  count: number;
}

const COMMON_EQUIPMENT = [
  '12x Tents', 'Ground Tarps', 'Rubber Mallets', 'Ropes & Sisal', 'Dip Nets & Vials', 
  'Water Quality Test Strips', 'Observation Trays', 'Camp Stoves', 'Cast Iron Dutch Ovens', 
  'First Aid Kit', 'Handheld VHF Radios', 'Field Binoculars', 'Lanterns'
];

const COMMON_SUPPLIES = [
  'Hardwood Firewood', 'Marshmallows & Chocolate', 'Matches & Fire Starter', 'Observation Clipboards', 
  'Whistles', 'Aluminum Foil', 'Water Purification Tabs', 'Trash Bags', 'Insect Repellent', 'Sunscreen'
];

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  teachers,
  defaultLocation,
  existingActivities = [],
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [category, setCategory] = useState<ActivityCategory>('campcraft');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [newEquipment, setNewEquipment] = useState('');
  const [suppliesList, setSuppliesList] = useState<string[]>([]);
  const [newSupply, setNewSupply] = useState('');
  const [leadTeacherId, setLeadTeacherId] = useState<string>('');
  const [assistantTeacherIds, setAssistantTeacherIds] = useState<string[]>([]);
  const [studentItemNeeded, setStudentItemNeeded] = useState('');
  const [notes, setNotes] = useState('');
  const [weatherDependent, setWeatherDependent] = useState(false);
  const [assignedGroup, setAssignedGroup] = useState<'group-1' | 'group-2' | 'all'>('all');

  // Geolocation states
  const [locationName, setLocationName] = useState('');
  const [latStr, setLatStr] = useState('-18.210799');
  const [lngStr, setLngStr] = useState('-63.748706');
  const [hasCoordinates, setHasCoordinates] = useState(true);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);

  // Extract unique locations that have been created by users on this plan
  const userPlanLocations = React.useMemo<PlanLocation[]>(() => {
    if (!existingActivities || existingActivities.length === 0) return [];

    const map = new Map<string, PlanLocation>();

    for (const act of existingActivities) {
      const trimmed = act.locationName?.trim();
      if (!trimmed) continue;

      const key = trimmed.toLowerCase();
      let icon = '📍';
      if (act.category === 'campcraft') icon = '🏕️';
      else if (act.category === 'hike') icon = '🥾';
      else if (act.category === 'water') icon = '🌊';
      else if (act.category === 'campfire') icon = '🔥';
      else if (act.category === 'meal') icon = '🍲';
      else if (act.category === 'teamwork') icon = '🤝';
      else if (act.category === 'rest') icon = '🧘';

      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (act.coordinates && typeof act.coordinates.lat === 'number' && typeof act.coordinates.lng === 'number') {
          existing.lat = act.coordinates.lat;
          existing.lng = act.coordinates.lng;
        }
      } else {
        const lat = (act.coordinates && typeof act.coordinates.lat === 'number')
          ? act.coordinates.lat
          : (defaultLocation?.lat ?? -18.210799);
        const lng = (act.coordinates && typeof act.coordinates.lng === 'number')
          ? act.coordinates.lng
          : (defaultLocation?.lng ?? -63.748706);

        map.set(key, {
          name: trimmed,
          lat,
          lng,
          icon,
          count: 1,
        });
      }
    }

    return Array.from(map.values());
  }, [existingActivities, defaultLocation]);

  // Initialize interactive Leaflet map when user chooses to select location from map
  useEffect(() => {
    if (!isMapPickerOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const currentLat = parseFloat(latStr) || -18.210799;
    const currentLng = parseFloat(lngStr) || -63.748706;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 15,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Add markers for locations already created on this plan by the user
    userPlanLocations.forEach((loc) => {
      const landmarkIcon = L.divIcon({
        className: 'landmark-map-badge',
        html: `<div style="background: white; border: 1.5px solid #059669; border-radius: 9999px; padding: 2px 7px; font-size: 10px; font-weight: 700; color: #064e3b; box-shadow: 0 2px 4px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 3px; white-space: nowrap; cursor: pointer;">
          <span>${loc.icon || '📍'}</span><span>${loc.name}</span>
        </div>`,
        iconAnchor: [30, 14],
      });

      L.marker([loc.lat, loc.lng], { icon: landmarkIcon })
        .addTo(map)
        .on('click', () => {
          setLocationName(loc.name);
          setLatStr(loc.lat.toFixed(6));
          setLngStr(loc.lng.toFixed(6));
          setHasCoordinates(true);
          if (activeMarkerRef.current) {
            activeMarkerRef.current.setLatLng([loc.lat, loc.lng]);
          }
        });
    });

    // Custom Draggable Pin for the selected position
    const pinIcon = L.divIcon({
      className: 'active-pin-selector',
      html: `<div style="background: #047857; color: white; width: 34px; height: 34px; border-radius: 9999px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; cursor: grab;">
        📍
      </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const activeMarker = L.marker([currentLat, currentLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);
    activeMarkerRef.current = activeMarker;

    activeMarker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setLatStr(lat.toFixed(6));
      setLngStr(lng.toFixed(6));
      setHasCoordinates(true);
    });

    // Click anywhere on the map to place the pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setLatStr(lat.toFixed(6));
      setLngStr(lng.toFixed(6));
      setHasCoordinates(true);
      activeMarker.setLatLng([lat, lng]);

      // If locationName is blank, check if user clicked near an existing plan location
      if (!locationName) {
        const nearest = userPlanLocations.find(
          (p) => Math.abs(p.lat - lat) < 0.0015 && Math.abs(p.lng - lng) < 0.0015
        );
        if (nearest) {
          setLocationName(nearest.name);
        }
      }
    });

    // Invalidate size to ensure full tile rendering in modal
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMapPickerOpen, userPlanLocations]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setDurationMinutes(initialData.durationMinutes || 60);
      setCategory(initialData.category || 'campcraft');
      setEnergyLevel(initialData.energyLevel || 'medium');
      setEquipmentList(initialData.requiredEquipment || []);
      setSuppliesList(initialData.requiredSupplies || []);
      setLeadTeacherId(initialData.leadTeacherId || (teachers[0]?.id || ''));
      setAssistantTeacherIds(initialData.assistantTeacherIds || []);
      setStudentItemNeeded(initialData.studentItemNeeded || '');
      setNotes(initialData.notes || '');
      setWeatherDependent(!!initialData.weatherDependent);
      setAssignedGroup(initialData.assignedGroup || 'all');
      setLocationName(initialData.locationName || '');
      if (initialData.coordinates) {
        setHasCoordinates(true);
        setLatStr(String(initialData.coordinates.lat));
        setLngStr(String(initialData.coordinates.lng));
      } else {
        const fallback = userPlanLocations[0];
        setHasCoordinates(false);
        setLatStr(fallback ? String(fallback.lat) : '-18.210799');
        setLngStr(fallback ? String(fallback.lng) : '-63.748706');
      }
    } else {
      setName('');
      setDescription('');
      setDurationMinutes(60);
      setCategory('campcraft');
      setEnergyLevel('medium');
      setEquipmentList([]);
      setSuppliesList([]);
      setLeadTeacherId(teachers[0]?.id || '');
      setAssistantTeacherIds([]);
      setStudentItemNeeded('');
      setNotes('');
      setWeatherDependent(false);
      setAssignedGroup('all');
      if (defaultLocation) {
        setLocationName(defaultLocation.locationName || '');
        setLatStr(String(defaultLocation.lat));
        setLngStr(String(defaultLocation.lng));
        setHasCoordinates(true);
      } else {
        const fallback = userPlanLocations[0];
        setLocationName('');
        setLatStr(fallback ? String(fallback.lat) : '-18.210799');
        setLngStr(fallback ? String(fallback.lng) : '-63.748706');
        setHasCoordinates(true);
      }
    }
  }, [initialData, teachers, isOpen, defaultLocation, userPlanLocations]);

  if (!isOpen) return null;

  const handleAddEquipment = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !equipmentList.includes(trimmed)) {
      setEquipmentList([...equipmentList, trimmed]);
      setNewEquipment('');
    }
  };

  const handleRemoveEquipment = (item: string) => {
    setEquipmentList(equipmentList.filter((e) => e !== item));
  };

  const handleAddSupply = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !suppliesList.includes(trimmed)) {
      setSuppliesList([...suppliesList, trimmed]);
      setNewSupply('');
    }
  };

  const handleRemoveSupply = (item: string) => {
    setSuppliesList(suppliesList.filter((s) => s !== item));
  };

  const toggleAssistant = (id: string) => {
    if (assistantTeacherIds.includes(id)) {
      setAssistantTeacherIds(assistantTeacherIds.filter((t) => t !== id));
    } else {
      setAssistantTeacherIds([...assistantTeacherIds, id]);
    }
  };

  const applyLocation = (loc: PlanLocation) => {
    setLocationName(loc.name);
    setLatStr(loc.lat.toFixed(6));
    setLngStr(loc.lng.toFixed(6));
    setHasCoordinates(true);
    if (activeMarkerRef.current) {
      activeMarkerRef.current.setLatLng([loc.lat, loc.lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([loc.lat, loc.lng]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let coords: { lat: number; lng: number } | undefined = undefined;
    if (hasCoordinates) {
      const parsedLat = parseFloat(latStr);
      const parsedLng = parseFloat(lngStr);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        coords = { lat: parsedLat, lng: parsedLng };
      }
    }

    const activityToSave: ActivityCard = {
      id: initialData?.id || `act-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      durationMinutes: Number(durationMinutes) || 30,
      category,
      energyLevel,
      requiredEquipment: equipmentList,
      requiredSupplies: suppliesList,
      leadTeacherId: leadTeacherId || undefined,
      assistantTeacherIds,
      studentItemNeeded: studentItemNeeded.trim() || undefined,
      notes: notes.trim() || undefined,
      weatherDependent,
      assignedGroup,
      locationName: locationName.trim() || undefined,
      coordinates: coords,
    };

    onSave(activityToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-amber-50 rounded-3xl border-3 border-amber-800/80 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-amber-700 text-amber-50 px-6 py-4 flex items-center justify-between border-b-2 border-amber-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-600 flex items-center justify-center font-black text-amber-100 border border-amber-500">
              🏕️
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                {initialData ? 'Edit Activity' : 'New Activity'}
              </h2>
              <p className="text-xs text-amber-200/90 font-medium">
                Set duration, geolocated station in Palermo, gear, and chaperone duties
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-amber-200 hover:text-white hover:bg-amber-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Activity Name */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Activity Name <span className="text-red-500">*</span>
            </label>
            <input
              id="activity-name-input"
              type="text"
              required
              placeholder="e.g. Flora & Fauna Hike, Creek Exploration, Campfire Gathering..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-stone-900 font-bold text-base outline-none transition-all placeholder:text-stone-400 placeholder:font-normal"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Short Description & Objectives
            </label>
            <textarea
              id="activity-desc-input"
              rows={2}
              placeholder="Explain the student mission, key skills practiced, and team structure..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-white border-2 border-amber-200 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-stone-800 text-sm outline-none transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Geolocation Section */}
          <div className="bg-amber-100/60 p-4 rounded-2xl border-2 border-amber-300 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-800" />
                <span>Activity Location & Station</span>
              </label>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                Interactive Map Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Location Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basecamp, East Trail, Creek Bridge..."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-medium text-xs text-stone-900 outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  placeholder="-18.210799"
                  value={latStr}
                  onChange={(e) => setLatStr(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-mono text-xs text-stone-900 outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  placeholder="-63.748706"
                  value={lngStr}
                  onChange={(e) => setLngStr(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-amber-300 font-mono text-xs text-stone-900 outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Map Picker Trigger Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-200/80">
              <button
                type="button"
                id="btn-select-location-map"
                onClick={() => setIsMapPickerOpen(!isMapPickerOpen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                  isMapPickerOpen
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isMapPickerOpen ? 'Hide Interactive Map' : '🗺️ Select Location from Map'}</span>
              </button>

              <span className="text-[11px] text-amber-900 font-medium">
                {isMapPickerOpen ? 'Click anywhere on map or drag pin to choose point' : 'Visually choose coordinates directly on the terrain'}
              </span>
            </div>

            {/* Embedded Interactive Map Selector */}
            {isMapPickerOpen && (
              <div className="rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-stone-100 relative">
                <div className="bg-stone-900 text-white px-3 py-2 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Click anywhere or drag pin to position activity station</span>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-mono">
                    {latStr}, {lngStr}
                  </span>
                </div>
                <div ref={mapContainerRef} className="h-64 w-full" />
                <div className="p-2.5 bg-white border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-stone-700 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">
                      Selected: <strong className="text-stone-900">{locationName || 'Custom Pin on Map'}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMapPickerOpen(false)}
                    className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shrink-0"
                  >
                    Confirm Location
                  </button>
                </div>
              </div>
            )}

            {/* Locations created by users on this plan */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-700">
                  Locations on this Plan ({userPlanLocations.length}):
                </span>
                {userPlanLocations.length > 0 && (
                  <span className="text-[10px] text-stone-500 font-medium">
                    Click to reuse location
                  </span>
                )}
              </div>
              {userPlanLocations.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {userPlanLocations.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => applyLocation(loc)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all hover:scale-102 flex items-center gap-1.5 shadow-2xs ${
                        locationName.toLowerCase() === loc.name.toLowerCase()
                          ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-400'
                          : 'bg-white hover:bg-emerald-50 text-stone-800 border-amber-300'
                      }`}
                      title={`${loc.name} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`}
                    >
                      <span>{loc.icon || '📍'}</span>
                      <span className="truncate max-w-[200px]">{loc.name}</span>
                      {loc.count > 1 && (
                        <span className={`text-[9px] px-1 rounded-full ${
                          locationName.toLowerCase() === loc.name.toLowerCase()
                            ? 'bg-emerald-800 text-white'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {loc.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-stone-500 italic bg-white/70 p-2.5 rounded-xl border border-amber-200">
                  No saved locations on this plan yet. Enter a location name above or pick a point on the map to create one.
                </div>
              )}
            </div>
          </div>

          {/* Time, Category & Energy Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Estimated Time */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-amber-950 mb-1">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                Estimated Time
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="activity-duration-input"
                  type="number"
                  min={15}
                  max={300}
                  step={15}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-24 px-3 py-2 rounded-xl bg-white border-2 border-amber-200 focus:border-amber-600 font-bold text-stone-900 text-center outline-none"
                />
                <span className="text-xs font-bold text-stone-600">min</span>
              </div>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {[30, 45, 60, 75, 90, 120].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDurationMinutes(t)}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      durationMinutes === t
                        ? 'bg-amber-600 text-white border-amber-700'
                        : 'bg-amber-100/70 text-stone-600 border-amber-200 hover:bg-amber-200'
                    }`}
                  >
                    {t}m
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-amber-950 mb-1">
                <Tag className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                Category
              </label>
              <select
                id="activity-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-3 py-2 rounded-xl bg-white border-2 border-amber-200 focus:border-amber-600 font-bold text-stone-800 text-sm outline-none"
              >
                <option value="campcraft">🏕️ Campcraft & Shelters</option>
                <option value="hike">🥾 Hike & Orienteering</option>
                <option value="water">🌊 Creek & Stream Activity</option>
                <option value="teamwork">🤝 Team Challenges</option>
                <option value="meal">🍲 Camp Cooking & Meal</option>
                <option value="campfire">🔥 Campfire & Stories</option>
                <option value="rest">🧘 Nature Rest & Journal</option>
              </select>
            </div>

            {/* Energy Level */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-amber-950 mb-1">
                <Flame className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                Energy Level
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['low', 'medium', 'high'] as EnergyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEnergyLevel(lvl)}
                    className={`py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                      energyLevel === lvl
                        ? lvl === 'high'
                          ? 'bg-red-500 text-white border-red-600 shadow-xs'
                          : lvl === 'medium'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-stone-600 border-amber-200 hover:bg-amber-50'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student Cohort Allocation (Staggered Groups) */}
          <div className="bg-amber-100/60 p-4 rounded-2xl border-2 border-amber-300">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <span className="text-sm">👥</span>
                <span>Student Group Allocation</span>
              </label>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                Staggered 2-Group Model
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAssignedGroup('group-1')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  assignedGroup === 'group-1'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-white hover:bg-emerald-50 text-stone-700 border-amber-200'
                }`}
              >
                <div className="font-extrabold text-xs flex items-center justify-between">
                  <span>Group 1 (Alpha)</span>
                  {assignedGroup === 'group-1' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={`text-[10px] mt-0.5 ${assignedGroup === 'group-1' ? 'text-emerald-100' : 'text-stone-500'}`}>
                  Morning Arrival (08:30)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssignedGroup('group-2')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  assignedGroup === 'group-2'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white hover:bg-amber-50 text-stone-700 border-amber-200'
                }`}
              >
                <div className="font-extrabold text-xs flex items-center justify-between">
                  <span>Group 2 (Bravo)</span>
                  {assignedGroup === 'group-2' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={`text-[10px] mt-0.5 ${assignedGroup === 'group-2' ? 'text-amber-100' : 'text-stone-500'}`}>
                  Afternoon Arrival (13:30)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAssignedGroup('all')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  assignedGroup === 'all'
                    ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                    : 'bg-white hover:bg-purple-50 text-stone-700 border-amber-200'
                }`}
              >
                <div className="font-extrabold text-xs flex items-center justify-between">
                  <span>Shared (Both Groups)</span>
                  {assignedGroup === 'all' && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className={`text-[10px] mt-0.5 ${assignedGroup === 'all' ? 'text-purple-100' : 'text-stone-500'}`}>
                  Joint Basecamp Activity
                </div>
              </button>
            </div>
          </div>

          {/* Required Equipment section */}
          <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-700" />
                Required Equipment (Master Gear)
              </label>
              <span className="text-[11px] text-stone-500 font-semibold">Tents, tools, nets, safety hardware</span>
            </div>

            {/* List of current equipment tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {equipmentList.map((eq) => (
                <span
                  key={eq}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-200/90 text-amber-950 border border-amber-300"
                >
                  {eq}
                  <button
                    type="button"
                    onClick={() => handleRemoveEquipment(eq)}
                    className="hover:text-red-700 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {equipmentList.length === 0 && (
                <span className="text-xs text-stone-500 italic py-1">No equipment tagged yet</span>
              )}
            </div>

            {/* Add custom equipment */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add equipment (e.g. 10x Canoes, Rubber Mallets)..."
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEquipment(newEquipment);
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-medium text-stone-800 outline-none focus:border-amber-600"
              />
              <button
                type="button"
                onClick={() => handleAddEquipment(newEquipment)}
                className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1 mt-2 items-center">
              <span className="text-[10px] font-bold text-stone-500 mr-1">Quick pick:</span>
              {COMMON_EQUIPMENT.slice(0, 6).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAddEquipment(item)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white text-stone-700 hover:bg-amber-200 border border-amber-200 font-semibold transition-colors"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* Required Supplies section */}
          <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                Required Supplies (Consumables & Materials)
              </label>
              <span className="text-[11px] text-stone-500 font-semibold">Firewood, food, matches, cards</span>
            </div>

            {/* List of current supplies */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {suppliesList.map((sup) => (
                <span
                  key={sup}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-950 border border-orange-200"
                >
                  {sup}
                  <button
                    type="button"
                    onClick={() => handleRemoveSupply(sup)}
                    className="hover:text-red-700 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {suppliesList.length === 0 && (
                <span className="text-xs text-stone-500 italic py-1">No supplies tagged yet</span>
              )}
            </div>

            {/* Add custom supply */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add supply (e.g. Firewood bundle, Clue sheets)..."
                value={newSupply}
                onChange={(e) => setNewSupply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSupply(newSupply);
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-medium text-stone-800 outline-none focus:border-amber-600"
              />
              <button
                type="button"
                onClick={() => handleAddSupply(newSupply)}
                className="px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Quick Supplies Suggestions */}
            <div className="flex flex-wrap gap-1 mt-2 items-center">
              <span className="text-[10px] font-bold text-stone-500 mr-1">Quick pick:</span>
              {COMMON_SUPPLIES.slice(0, 6).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAddSupply(item)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white text-stone-700 hover:bg-orange-100 border border-amber-200 font-semibold transition-colors"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>

          {/* Teacher Responsibilities */}
          <div className="bg-amber-100/50 p-4 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-700" />
                Teacher Supervision & Responsibilities
              </label>
              <span className="text-[11px] text-stone-500 font-semibold">Chaperone accountability</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Lead Teacher in Charge
                </label>
                <select
                  id="activity-lead-teacher-select"
                  value={leadTeacherId}
                  onChange={(e) => setLeadTeacherId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 font-bold text-stone-800 text-xs outline-none focus:border-amber-600"
                >
                  <option value="">-- No Lead Assigned --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Assistant Chaperones
                </label>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-amber-200">
                  {teachers.map((t) => {
                    const isSelected = assistantTeacherIds.includes(t.id);
                    const isLead = leadTeacherId === t.id;
                    if (isLead) return null;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleAssistant(t.id)}
                        className={`text-[11px] px-2 py-1 rounded-lg border font-semibold transition-all ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-amber-50'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Student Item Requirement Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-amber-950 mb-1">
                <Backpack className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                Required From Students
              </label>
              <input
                type="text"
                placeholder="e.g. Hiking boots, rain poncho, headlamp..."
                value={studentItemNeeded}
                onChange={(e) => setStudentItemNeeded(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-medium text-stone-800 outline-none focus:border-amber-600"
              />
            </div>

            {/* Weather Dependent & Safety Note */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-amber-950 mb-1">
                <CloudSun className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                Weather Contingency
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-xl border border-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={weatherDependent}
                  onChange={(e) => setWeatherDependent(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-stone-800">
                  Weather Sensitive (Need backup plan if raining)
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Modal Footer Actions */}
        <div className="bg-amber-100/80 px-6 py-4 border-t-2 border-amber-200 flex items-center justify-between">
          <div>
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${initialData.name}"?`)) {
                    onDelete(initialData.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 hover:bg-red-100 border border-red-300 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Activity</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-amber-200/60 transition-colors"
            >
              Cancel
            </button>
            <button
              id="save-activity-btn"
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-700 hover:bg-amber-800 text-white shadow-md shadow-amber-900/20 transition-all transform active:scale-95"
            >
              {initialData ? 'Save Changes' : 'Place in Activity Bank'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
