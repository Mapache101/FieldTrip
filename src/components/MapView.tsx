import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Compass, 
  Calendar, 
  Navigation, 
  Plus, 
  Edit3, 
  Clock, 
  User, 
  ExternalLink,
  Eye,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { ActivityCard, TripProject } from '../types';
import { computeTimelineSlots, formatTime12h } from '../utils/tripHelpers';

interface MapViewProps {
  project: TripProject;
  onEditActivity: (activity: ActivityCard) => void;
  onCreateActivityAtLocation: (coords: { lat: number; lng: number }, locationName: string) => void;
  focusedActivityId?: string | null;
}

// Fallback basecamp coordinates if not set
const DEFAULT_CENTER = {
  lat: -18.210799,
  lng: -63.748706,
  name: 'Palermo, Santa Cruz, Bolivia'
};

export const MapView: React.FC<MapViewProps> = ({
  project,
  onEditActivity,
  onCreateActivityAtLocation,
  focusedActivityId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const polylinesGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [mapStyle, setMapStyle] = useState<'standard' | 'topo' | 'satellite'>('topo');
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityCard | null>(null);

  const baseLat = project.baseLocation?.lat ?? DEFAULT_CENTER.lat;
  const baseLng = project.baseLocation?.lng ?? DEFAULT_CENTER.lng;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [baseLat, baseLng],
        zoom: 15,
        zoomControl: true,
      });

      mapInstanceRef.current = map;
      layerGroupRef.current = L.layerGroup().addTo(map);
      polylinesGroupRef.current = L.layerGroup().addTo(map);

      // Click on map to get coordinates or drop new pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setClickedLocation({
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          name: `Spot near Palermo (${lat.toFixed(4)}, ${lng.toFixed(4)})`
        });
      });
    }

    return () => {
      // Map instance preserved or cleaned up
    };
  }, [baseLat, baseLng]);

  // Handle Tile Layer Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (mapStyle === 'topo') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap';
    } else if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
    }

    const maxNativeZoom = mapStyle === 'topo' ? 17 : 19;
    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      maxNativeZoom,
      attribution,
    }).addTo(map);
  }, [mapStyle]);

  // Render Markers and Trails
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    const polylinesGroup = polylinesGroupRef.current;
    if (!map || !layerGroup || !polylinesGroup) return;

    layerGroup.clearLayers();
    polylinesGroup.clearLayers();

    // 1. Add Basecamp Master Marker
    const baseIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full bg-amber-500/30 animate-ping"></div>
          <div class="w-10 h-10 rounded-2xl bg-amber-600 border-2 border-white text-white flex items-center justify-center shadow-lg font-bold">
            <span style="font-size: 20px;">⛺</span>
          </div>
          <div class="absolute -bottom-6 bg-stone-900/90 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-md border border-amber-500/40">
            Campamento Base Palermo
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const baseMarker = L.marker([baseLat, baseLng], { icon: baseIcon })
      .addTo(layerGroup)
      .bindPopup(`
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 220px; padding: 4px;">
          <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase;">Expedition Headquarters</div>
          <div style="font-size: 15px; font-weight: 800; color: #1c1917; margin-top: 2px;">Campamento Base Palermo</div>
          <div style="font-size: 12px; color: #78716c; margin-top: 4px;">Palermo, Santa Cruz Department, Bolivia</div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 600; margin-top: 6px;">GPS: ${baseLat.toFixed(6)}, ${baseLng.toFixed(6)}</div>
          <div style="margin-top: 8px; font-size: 11px; color: #44403c; background: #fef3c7; padding: 6px; border-radius: 8px; border: 1px solid #fde68a;">
            Assembly point, first aid tent, and radio control base.
          </div>
        </div>
      `);

    // Color definitions per day
    const dayColors: Record<number, { bg: string; border: string; text: string; line: string }> = {
      1: { bg: '#b45309', border: '#fef3c7', text: '#ffffff', line: '#d97706' },
      2: { bg: '#047857', border: '#ecfdf5', text: '#ffffff', line: '#059669' },
      3: { bg: '#0369a1', border: '#f0f9ff', text: '#ffffff', line: '#0284c7' },
      4: { bg: '#6b21a8', border: '#faf5ff', text: '#ffffff', line: '#7e22ce' },
    };

    const categoryIcons: Record<string, string> = {
      campcraft: '🏕️',
      hike: '🥾',
      water: '🛶',
      teamwork: '🤝',
      meal: '🍲',
      campfire: '🔥',
      rest: '🧘',
    };

    // Filter which days to show
    const daysToShow = project.days.filter((d) => {
      if (selectedDayFilter === 'all') return true;
      return d.id === selectedDayFilter;
    });

    // Draw markers and trail lines for each day
    project.days.forEach((day) => {
      const isVisible = selectedDayFilter === 'all' || selectedDayFilter === day.id;
      const dayColor = dayColors[day.dayNumber] || dayColors[1];
      const slots = computeTimelineSlots(day, project.activities);
      const dayCoords: [number, number][] = [];

      slots.forEach((slot, index) => {
        const act = slot.activity;
        if (!act.coordinates || typeof act.coordinates.lat !== 'number' || typeof act.coordinates.lng !== 'number') {
          return;
        }

        const lat = act.coordinates.lat;
        const lng = act.coordinates.lng;

        if (isVisible) {
          dayCoords.push([lat, lng]);

          const emoji = categoryIcons[act.category] || '📍';
          const isFocused = focusedActivityId === act.id;

          const markerIcon = L.divIcon({
            className: 'custom-activity-marker',
            html: `
              <div class="relative flex flex-col items-center group cursor-pointer ${isFocused ? 'scale-125 z-50' : ''}">
                <div class="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2" 
                     style="background-color: ${dayColor.bg}; border-color: ${dayColor.border}; color: ${dayColor.text};">
                  <span style="font-size: 16px;">${emoji}</span>
                </div>
                <div class="absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black shadow-md border"
                     style="background-color: ${dayColor.border}; color: ${dayColor.bg}; border-color: ${dayColor.bg};">
                  D${day.dayNumber}-${slot.stepNumber}
                </div>
                <div class="bg-stone-900/85 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-1 whitespace-nowrap shadow border border-white/20">
                  ${act.name.length > 18 ? act.name.slice(0, 18) + '...' : act.name}
                </div>
              </div>
            `,
            iconSize: [36, 48],
            iconAnchor: [18, 24],
          });

          const leadTeacher = project.teachers.find((t) => t.id === act.leadTeacherId);

          const marker = L.marker([lat, lng], { icon: markerIcon })
            .addTo(layerGroup)
            .on('click', () => {
              setSelectedActivity(act);
            });

          marker.bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 240px; padding: 4px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span style="background-color: ${dayColor.bg}; color: white; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px;">
                  Day ${day.dayNumber} • Step #${slot.stepNumber}
                </span>
                <span style="font-size: 11px; font-weight: 700; color: #78716c;">
                  ${slot.startTime} - ${slot.endTime}
                </span>
              </div>
              <h4 style="font-size: 15px; font-weight: 800; color: #1c1917; margin: 6px 0 2px 0;">
                ${emoji} ${act.name}
              </h4>
              <p style="font-size: 12px; color: #57534e; margin: 0 0 6px 0; line-height: 1.4;">
                ${act.description || 'No description provided.'}
              </p>
              <div style="font-size: 11px; color: #0369a1; font-weight: 700; margin-bottom: 6px;">
                📍 ${act.locationName || 'Palermo Outdoor Area'} (${lat.toFixed(5)}, ${lng.toFixed(5)})
              </div>
              ${leadTeacher ? `
                <div style="font-size: 11px; color: #44403c; margin-bottom: 6px; font-weight: 600;">
                  Lead Chaperone: <span style="font-weight: 700; color: #b45309;">${leadTeacher.name}</span> (${leadTeacher.role})
                </div>
              ` : ''}
              <div style="display: flex; gap: 6px; margin-top: 8px; pt: 6px; border-top: 1px solid #e7e5e4;">
                <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer" 
                   style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #0284c7; text-decoration: none; padding: 4px 8px; background: #e0f2fe; border-radius: 6px;">
                  Google Maps ↗
                </a>
              </div>
            </div>
          `);

          if (isFocused) {
            marker.openPopup();
          }
        }
      });

      // Draw dashed connecting trail for this day
      if (isVisible && dayCoords.length > 1) {
        L.polyline(dayCoords, {
          color: dayColor.line,
          weight: 3.5,
          opacity: 0.8,
          dashArray: '8, 8',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(polylinesGroup);
      }
    });

    // Unassigned activities with coordinates
    if (selectedDayFilter === 'all' || selectedDayFilter === 'unassigned') {
      const placedIds = new Set(project.days.flatMap((d) => d.activityIds));
      const unassigned = project.activities.filter((a) => !placedIds.has(a.id) && a.coordinates);

      unassigned.forEach((act) => {
        if (!act.coordinates) return;
        const lat = act.coordinates.lat;
        const lng = act.coordinates.lng;

        const unassignedIcon = L.divIcon({
          className: 'custom-unassigned-marker',
          html: `
            <div class="relative flex flex-col items-center cursor-pointer">
              <div class="w-8 h-8 rounded-full bg-purple-700 text-white flex items-center justify-center border-2 border-purple-200 shadow-md">
                <span>📍</span>
              </div>
              <div class="bg-purple-900/90 text-purple-100 text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 whitespace-nowrap shadow">
                ${act.name.slice(0, 15)}...
              </div>
            </div>
          `,
          iconSize: [32, 40],
          iconAnchor: [16, 20],
        });

        L.marker([lat, lng], { icon: unassignedIcon })
          .addTo(layerGroup)
          .bindPopup(`
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 4px;">
              <span style="background-color: #6b21a8; color: white; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 9999px;">
                Unassigned Quest
              </span>
              <h4 style="font-size: 14px; font-weight: 800; color: #1c1917; margin: 4px 0;">${act.name}</h4>
              <p style="font-size: 12px; color: #57534e;">${act.description || ''}</p>
              <div style="font-size: 11px; color: #78716c; margin-top: 4px;">📍 ${act.locationName || 'Palermo Area'}</div>
            </div>
          `);
      });
    }

    // If focused activity provided, pan to it
    if (focusedActivityId) {
      const act = project.activities.find((a) => a.id === focusedActivityId);
      if (act && act.coordinates) {
        map.setView([act.coordinates.lat, act.coordinates.lng], 16, { animate: true });
      }
    }
  }, [project, selectedDayFilter, focusedActivityId, baseLat, baseLng]);

  // Helper to recenter map
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([baseLat, baseLng], 15, { animate: true });
    }
  };

  // Helper to focus on an activity from the side list
  const handleFocusActivity = (act: ActivityCard) => {
    setSelectedActivity(act);
    if (act.coordinates && mapInstanceRef.current) {
      mapInstanceRef.current.setView([act.coordinates.lat, act.coordinates.lng], 16, { animate: true });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Map Control Bar */}
      <div className="bg-amber-100/60 rounded-3xl border-2 border-amber-300/80 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-700 text-amber-50">
              <Compass className="w-3.5 h-3.5 mr-1" />
              Expedition Geospatial Map
            </span>
            <span className="text-xs font-semibold text-stone-600">
              Palermo, Santa Cruz, Bolivia (-18.2108, -63.7487)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display tracking-tight mt-1 flex items-center gap-2">
            <span>Expedition Trail & Activity Map</span>
          </h2>
          <p className="text-xs text-stone-600 font-medium">
            Visualize all field activity stations, trail itineraries, and basecamp locations in Palermo.
          </p>
        </div>

        {/* Filters and Layer Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Day Filter */}
          <div className="flex items-center bg-white/90 p-1 rounded-2xl border border-amber-300 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedDayFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedDayFilter === 'all'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-amber-100'
              }`}
            >
              All Days
            </button>
            {project.days.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDayFilter(d.id)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedDayFilter === d.id
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-amber-100'
                }`}
              >
                Day {d.dayNumber}
              </button>
            ))}
          </div>

          {/* Map Layer Mode */}
          <div className="flex items-center bg-white/90 p-1 rounded-2xl border border-amber-300 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMapStyle('standard')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                mapStyle === 'standard' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-600 hover:bg-amber-100'
              }`}
              title="Standard Outdoor OpenStreetMap"
            >
              Outdoor
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('topo')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                mapStyle === 'topo' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-600 hover:bg-amber-100'
              }`}
              title="Topographic Terrain View"
            >
              Topo
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                mapStyle === 'satellite' ? 'bg-stone-800 text-white shadow-xs' : 'text-stone-600 hover:bg-amber-100'
              }`}
              title="Satellite Aerial Imagery"
            >
              Satellite
            </button>
          </div>

          {/* Recenter Button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
            title="Recenter to Basecamp Palermo"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Basecamp</span>
          </button>
        </div>
      </div>

      {/* Main Map & Itinerary Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Interactive Map Canvas */}
        <div className="lg:col-span-3 space-y-3">
          <div className="relative h-[560px] w-full rounded-3xl overflow-hidden border-3 border-amber-300/80 shadow-md bg-stone-100 z-10">
            {/* The Leaflet Container */}
            <div ref={mapContainerRef} className="h-full w-full" />

            {/* Click-to-create Floating Banner when user clicks anywhere on map */}
            {clickedLocation && (
              <div className="absolute top-4 left-4 right-4 sm:left-auto sm:right-4 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border-2 border-amber-400 shadow-xl max-w-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase text-amber-800 tracking-wider block">
                        Pinned Coordinates
                      </span>
                      <span className="text-xs font-mono font-bold text-stone-900 block">
                        {clickedLocation.lat}, {clickedLocation.lng}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClickedLocation(null)}
                    className="text-stone-400 hover:text-stone-700 text-xs font-bold px-1.5 py-0.5 rounded-lg hover:bg-stone-100"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-600">
                    Palermo terrain point
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onCreateActivityAtLocation(
                        { lat: clickedLocation.lat, lng: clickedLocation.lng },
                        clickedLocation.name || 'Palermo Station'
                      );
                      setClickedLocation(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-transform active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Quest Here</span>
                  </button>
                </div>
              </div>
            )}

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-2xl border border-stone-200 shadow-md text-[11px] font-semibold text-stone-700 hidden sm:flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-600 inline-block"></span>
                <span>Day 1 Trail</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
                <span>Day 2 Trail</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-600 inline-block"></span>
                <span>Day 3 Trail</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-stone-300 pl-2">
                <Info className="w-3 h-3 text-stone-500" />
                <span className="text-stone-500">Click map to pin a location</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itinerary & Waypoints Sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-amber-100/40 rounded-3xl border-2 border-amber-300/80 p-4 shadow-sm h-[560px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-700 text-amber-50 flex items-center justify-center font-bold">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black font-display text-stone-900">Trail Stations</h3>
                  <span className="text-[10px] text-stone-500 font-semibold block">
                    {project.activities.filter((a) => a.coordinates).length} Geotagged Locations
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable list of activities with coordinates */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1 custom-scrollbar">
              {/* Basecamp item */}
              <div 
                onClick={handleRecenter}
                className="p-2.5 rounded-2xl bg-amber-200/70 border border-amber-300 cursor-pointer hover:bg-amber-200 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-300 px-2 py-0.5 rounded-md">
                    Expedition HQ
                  </span>
                  <span className="text-[10px] font-mono text-amber-900 font-bold">
                    {baseLat.toFixed(4)}, {baseLng.toFixed(4)}
                  </span>
                </div>
                <div className="font-display font-black text-xs text-stone-900 mt-1">
                  ⛺ Campamento Base Palermo
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  Santa Cruz Department, Bolivia
                </div>
              </div>

              {/* Day activities */}
              {project.days.map((day) => {
                const slots = computeTimelineSlots(day, project.activities);
                const geotaggedSlots = slots.filter((s) => s.activity.coordinates);

                if (geotaggedSlots.length === 0) return null;

                return (
                  <div key={day.id} className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-amber-950 px-1">
                      <span>Day {day.dayNumber}: {day.title.split(':')[1] || day.title}</span>
                      <span className="text-[10px] text-stone-500">{geotaggedSlots.length} stations</span>
                    </div>

                    {geotaggedSlots.map((slot) => {
                      const act = slot.activity;
                      const isSelected = selectedActivity?.id === act.id;

                      return (
                        <div
                          key={act.id}
                          onClick={() => handleFocusActivity(act)}
                          className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-800 text-white border-amber-950 shadow-md scale-102'
                              : 'bg-white/80 hover:bg-white text-stone-800 border-amber-200 hover:border-amber-400 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              isSelected ? 'bg-amber-600 text-amber-100' : 'bg-amber-100 text-amber-900'
                            }`}>
                              Step #{slot.stepNumber} • {slot.startTime}
                            </span>
                            <span className={`text-[10px] font-mono ${isSelected ? 'text-amber-200' : 'text-stone-500'}`}>
                              {act.coordinates?.lat.toFixed(4)}, {act.coordinates?.lng.toFixed(4)}
                            </span>
                          </div>

                          <div className={`font-display font-black text-xs mt-1.5 truncate ${
                            isSelected ? 'text-white' : 'text-stone-900'
                          }`}>
                            {act.name}
                          </div>

                          <div className={`text-[11px] truncate flex items-center justify-between mt-1 ${
                            isSelected ? 'text-amber-200' : 'text-stone-500'
                          }`}>
                            <span>📍 {act.locationName || 'Palermo Trail'}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditActivity(act);
                              }}
                              className={`p-1 rounded-md hover:bg-white/20 text-xs ${
                                isSelected ? 'text-white' : 'text-amber-800'
                              }`}
                              title="Edit Quest Details"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
