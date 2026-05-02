"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, BarChart3, Clock, AlertTriangle, Coins } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';

const THIRTY_DAYS_MS = 40 * 24 * 60 * 60 * 1000;

interface Device {
  id: number;
  name: string;
  location: string;
  chargerUrl?: string;
  health: number | null;
  status: 'excellent' | 'good' | 'warning' | 'critical' | 'offline';
  lastUpdate: string;
  lastDatetime: Date | null;
  reportAvailable: boolean;
}

type DeviceEventLogs = Record<number, string[]>;

const getApiUrl = (id: number, lastOnly = false): string => {
  const suffix = lastOnly ? '?lastOnly=true' : '';
  if (id === 1) return `/api/charger_data_1${suffix}`;
  if (id === 9) return `/api/sapna_charger${suffix}`;
  return `/api/charger_data?device=device${id}${lastOnly ? '&lastOnly=true' : ''}`;
};

const LS_KEY = 'deviceLastUpdates';

function loadCache(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

function saveCache(map: Record<number, string>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const formatLastSync = (datetime: string): string => {
  const d = new Date(datetime);
  const day = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS[d.getMonth()];
  const yr = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${mon} ${yr}, ${hh}:${mm}`;
};

const DeviceCards: React.FC = () => {
  const reportBaseUrl = '/stations/dashboard?device=';
  const { isSignedIn } = useAuth();
  const [creditError, setCreditError] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState<number | null>(null);

  const handleLiveReport = async (deviceId: number) => {
    const destination = `${reportBaseUrl}${deviceId}`;
    if (!isSignedIn) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(destination)}`;
      return;
    }
    setCreditError(null);
    setLoadingReport(deviceId);
    try {
      const res = await fetch('/api/user/deduct-credit', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'insufficient_credits') {
          setCreditError('You have no credits left. Buy a plan to continue viewing live reports.');
        } else {
          setCreditError('Something went wrong. Please try again.');
        }
        return;
      }
      window.location.href = destination;
    } catch {
      setCreditError('Network error. Please try again.');
    } finally {
      setLoadingReport(null);
    }
  };
  const initialDevices: Device[] = useMemo(() => [
    // {
    //   id: 1,
    //   name: 'Device 1',
    //   location: 'Andheria More',
    //   health: 85,
    //   status: 'good',
    //   lastUpdate: '3 min ago',
    //   lastDatetime: null,
    //   reportAvailable: true
    // },
    // {
    //   id: 2,
    //   name: 'Device 2',
    //   location: 'Hauz Khas Telephone Centre',
    //   health: 88,
    //   status: 'good',
    //   lastUpdate: '2 min ago',
    //   lastDatetime: null,
    //   reportAvailable: true
    // },
    // {
    //   id: 3,
    //   name: 'Device 3',
    //   location: 'Qutub Minar',
    //   health: 92,
    //   status: 'excellent',
    //   lastUpdate: '1 min ago',
    //   lastDatetime: null,
    //   reportAvailable: true
    // },
    // {
    //   id: 4,
    //   name: 'Device 4',
    //   location: 'TB Hospital',
    //   health: 89,
    //   status: 'excellent',
    //   lastUpdate: '1 min ago',
    //   lastDatetime: null,
    //   reportAvailable: true
    // },
    {
      id: 5,
      name: 'Device 5',
      location: 'Sapna Cinema Phase 3 Industrial Area, Delhi',
      health: 80,
      status: 'good',
      lastUpdate: 'Loading...',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 6,
      name: 'Device 1',
      location: 'Piccadily back side parking Sec-34 Chandigarh',
      health: 85,
      status: 'good',
      lastUpdate: 'Loading...',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 7,
      name: 'Device 2',
      location: 'Passport office front side parking Sec-34 Chandigarh',
      health: 90,
      status: 'excellent',
      lastUpdate: 'Loading...',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 8,
      name: 'Device 3',
      location: 'Piccadily multiplex II Sec-34 Chandigarh',
      health: 100,
      status: 'excellent',
      lastUpdate: 'Loading...',
      lastDatetime: null,
      reportAvailable: true
    },
    // {
    //   id: 9,
    //   name: 'Device 4',
    //   location: 'Sapna Cinema',
    //   health: 91,
    //   status: 'excellent',
    //   lastUpdate: '1 min ago',
    //   lastDatetime: null,
    //   reportAvailable: true
    // }
  ], []);

  const [hasMounted, setHasMounted] = useState(false);
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [deviceLogs, setDeviceLogs] = useState<DeviceEventLogs>({});
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const cleanupCallbacks: Array<() => void> = [];

    const formatTime = () =>
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updateDevice = (id: number, updates: Partial<Device>) => {
      setDevices((prev) => prev.map((device) => (device.id === id ? { ...device, ...updates } : device)));
    };

    const appendLog = (id: number, message: string) => {
      const stampedMessage = `${formatTime()} - ${message}`;
      setDeviceLogs((prev) => {
        const currentLogs = prev[id] || [];
        return {
          ...prev,
          [id]: [stampedMessage, ...currentLogs].slice(0, 6)
        };
      });
    };

    initialDevices
      .filter((device) => device.chargerUrl)
      .forEach((device) => {
        let socket: WebSocket | null = null;
        let reconnectTimer: number | null = null;

        const connect = () => {
          if (!device.chargerUrl) {
            return;
          }

          updateDevice(device.id, {
            status: 'warning',
            lastUpdate: `Connecting at ${formatTime()}`
          });
          appendLog(device.id, 'Connecting to charger endpoint');

          try {
            socket = new WebSocket(device.chargerUrl, ['ocpp2.0.1', 'ocpp1.6']);
          } catch {
            updateDevice(device.id, {
              status: 'offline',
              lastUpdate: `Connection failed at ${formatTime()}`
            });
            appendLog(device.id, 'Connection setup failed');
            return;
          }

          socket.onopen = () => {
            updateDevice(device.id, {
              status: 'good',
              lastUpdate: `Connected at ${formatTime()}`
            });
            appendLog(
              device.id,
              `Connected (protocol: ${socket?.protocol || 'none'})`
            );
          };

          socket.onmessage = (event) => {
            const nextStatus = (() => {
              const payload = String(event.data || '');

              try {
                const parsed = JSON.parse(payload);

                // Handle OCPP array frames: [2, msgId, action, payload] etc.
                if (Array.isArray(parsed)) {
                  const frameType = parsed[0];
                  const frameAction = parsed[2];
                  const framePayload = parsed[3] || parsed[2];

                  if (typeof frameAction === 'string') {
                    appendLog(device.id, `OCPP frame: ${frameAction}`);
                  } else if (typeof frameType === 'number') {
                    appendLog(device.id, `OCPP frame type: ${frameType}`);
                  }

                  if (framePayload && typeof framePayload === 'object') {
                    const ocppStatus =
                      framePayload.status ||
                      framePayload.connectorStatus ||
                      framePayload.chargingState;

                    if (typeof ocppStatus === 'string') {
                      const normalized = ocppStatus.toLowerCase();
                      if (normalized.includes('fault') || normalized.includes('error')) return 'critical';
                      if (normalized.includes('charging')) return 'excellent';
                      if (normalized.includes('available') || normalized.includes('idle')) return 'good';
                      if (normalized.includes('unavailable') || normalized.includes('offline')) return 'offline';
                    }
                  }
                }

                const rawStatus =
                  parsed?.status || parsed?.connectorStatus || parsed?.data?.status || parsed?.data?.connectorStatus;

                if (typeof rawStatus === 'string') {
                  const normalized = rawStatus.toLowerCase();

                  if (normalized.includes('fault') || normalized.includes('error')) return 'critical';
                  if (normalized.includes('charging')) return 'excellent';
                  if (normalized.includes('available') || normalized.includes('idle')) return 'good';
                  if (normalized.includes('unavailable') || normalized.includes('offline')) return 'offline';
                }
              } catch {
                // Non-JSON OCPP payloads are still treated as a healthy heartbeat.
                appendLog(device.id, `Raw message: ${payload.slice(0, 80)}`);
              }

              return 'good';
            })();

            updateDevice(device.id, {
              status: nextStatus,
              lastUpdate: `Message at ${formatTime()}`
            });
          };

          socket.onerror = () => {
            updateDevice(device.id, {
              status: 'warning',
              lastUpdate: `Socket error at ${formatTime()}`
            });
            appendLog(device.id, 'Socket error event received');
          };

          socket.onclose = () => {
            updateDevice(device.id, {
              status: 'offline',
              lastUpdate: `Disconnected at ${formatTime()}`
            });
            appendLog(device.id, 'Disconnected, retrying in 5 seconds');

            reconnectTimer = window.setTimeout(connect, 5000);
          };
        };

        connect();

        cleanupCallbacks.push(() => {
          if (reconnectTimer) {
            window.clearTimeout(reconnectTimer);
          }
          if (socket) {
            socket.close();
          }
        });
      });

    return () => {
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [initialDevices]);

  useEffect(() => { setHasMounted(true); }, []);

  useEffect(() => {
    // Apply cached values immediately so the UI shows something on first paint
    const cache = loadCache();
    if (Object.keys(cache).length > 0) {
      setDevices(prev => {
        const updated = prev.map(device => {
          const cached = cache[device.id];
          if (!cached) return device;
          const lastDatetime = new Date(cached);
          const isStale = (Date.now() - lastDatetime.getTime()) > THIRTY_DAYS_MS;
          return { ...device, lastUpdate: formatLastSync(cached), lastDatetime, status: isStale ? 'offline' as const : device.status };
        });
        return [...updated].sort((a, b) => {
          if (!a.lastDatetime && !b.lastDatetime) return 0;
          if (!a.lastDatetime) return 1;
          if (!b.lastDatetime) return -1;
          return b.lastDatetime.getTime() - a.lastDatetime.getTime();
        });
      });
    }

    const fetchLastUpdates = async () => {
      const results = await Promise.allSettled(
        initialDevices.map(async (device) => {
          const res = await fetch(getApiUrl(device.id, true), {
            signal: AbortSignal.timeout(10000)
          });
          if (!res.ok) throw new Error('fetch failed');
          const data = await res.json();
          const points: { datetime: string }[] = data.points || [];
          const validPoints = points.filter(p => p.datetime && !p.datetime.startsWith('1970'));
          if (validPoints.length === 0) return { id: device.id, lastUpdate: 'No data', lastDatetime: null };
          const last = validPoints[validPoints.length - 1];
          const lastDatetime = new Date(last.datetime);
          return { id: device.id, lastUpdate: formatLastSync(last.datetime), lastDatetime };
        })
      );

      // Persist fresh timestamps to cache
      const newCache: Record<number, string> = { ...loadCache() };
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.lastDatetime) {
          newCache[initialDevices[i].id] = r.value.lastDatetime.toISOString();
        }
      });
      saveCache(newCache);

      setDevices(prev => {
        const updated = prev.map(device => {
          const idx = initialDevices.findIndex(d => d.id === device.id);
          const match = results[idx];
          if (match?.status === 'fulfilled') {
            const { lastUpdate, lastDatetime } = match.value;
            // If API returned no data, keep the cached value rather than overwriting with 'No data'
            if (!lastDatetime) return device;
            const isStale = (Date.now() - lastDatetime.getTime()) > THIRTY_DAYS_MS;
            return {
              ...device,
              lastUpdate,
              lastDatetime,
              status: isStale ? 'offline' as const : device.status,
            };
          }
          // Fetch failed/timed out — keep cached value, don't overwrite with 'Offline'
          return device;
        });

        // Sort 0→100: most recently updated first (null = no data → comes last)
        return [...updated].sort((a, b) => {
          if (!a.lastDatetime && !b.lastDatetime) return 0;
          if (!a.lastDatetime) return 1;
          if (!b.lastDatetime) return -1;
          return b.lastDatetime.getTime() - a.lastDatetime.getTime();
        });
      });
    };

    fetchLastUpdates().finally(() => setIsFetching(false));
  }, [initialDevices]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const statusMeta = (status: string) => {
    switch (status) {
      case 'excellent': return { label: 'Excellent', dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-400', accent: 'border-l-emerald-400', pulse: true };
      case 'good':      return { label: 'Good',      dot: 'bg-green-400',   badge: 'bg-green-50 text-green-700 border-green-200',     bar: 'bg-green-400',   accent: 'border-l-green-400',   pulse: true };
      case 'warning':   return { label: 'Warning',   dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',     bar: 'bg-amber-400',   accent: 'border-l-amber-400',   pulse: false };
      case 'critical':  return { label: 'Critical',  dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',           bar: 'bg-red-500',     accent: 'border-l-red-500',     pulse: false };
      default:          return { label: 'Offline',   dot: 'bg-slate-300',   badge: 'bg-slate-50 text-slate-500 border-slate-200',     bar: 'bg-slate-300',   accent: 'border-l-slate-300',   pulse: false };
    }
  };

  const healthBarColor = (health: number | null, status: string) => {
    if (health === null) return 'bg-gray-200';
    if (status === 'critical') return 'bg-red-500';
    if (status === 'warning') return 'bg-amber-400';
    if (health >= 85) return 'bg-emerald-400';
    return 'bg-green-400';
  };

  const onlineDevices = devices.filter(d => d.status !== 'offline');
  const offlineDevices = devices.filter(d => d.status === 'offline');

  const renderCard = (device: Device, sortedIndex: number) => {
    const meta = statusMeta(device.status);
    const isOffline = device.status === 'offline';
    const isLoading = loadingReport === device.id;

    return (
      <div
        key={device.id}
        className={`bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 border-l-4 ${meta.accent} overflow-hidden transition-all duration-200 flex flex-col`}
      >
        {/* Card header */}
        <div className="px-5 pt-5 pb-4 flex-1">
          {/* Title row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${meta.dot} ${meta.pulse ? 'animate-pulse' : ''}`} />
              <h3 className="text-sm font-bold text-gray-800 tracking-tight">Station {sortedIndex + 1}</h3>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${meta.badge}`}>
              {meta.label}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-1.5 mb-4">
            <MapPin size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-snug">{device.location}</p>
          </div>

          {/* Battery health */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400 font-medium">Battery Health</span>
              <span className={`text-xs font-bold ${device.health !== null && device.health >= 85 ? 'text-emerald-600' : device.health !== null && device.health >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                {device.health !== null ? `${device.health}%` : 'N/A'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${healthBarColor(device.health, device.status)}`}
                style={{ width: `${device.health ?? 0}%` }}
              />
            </div>
          </div>

          {/* Last update */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {isFetching ? (
              <svg className="animate-spin h-2.5 w-2.5 text-blue-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <Clock size={11} />
            )}
            <span>Last update: <span className={`font-medium ${isFetching ? 'text-blue-400' : 'text-gray-600'}`}>{isFetching ? 'Loading...' : device.lastUpdate}</span></span>
          </div>

          {/* Live log (only for devices with chargerUrl) */}
          {device.chargerUrl && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1 font-medium">Live Log</p>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-2 space-y-0.5 max-h-20 overflow-auto">
                {(deviceLogs[device.id] || ['No events yet']).map((logLine, index) => (
                  <p key={`${device.id}-${index}-${logLine}`} className="font-mono text-[10px] text-gray-600 break-words leading-relaxed">
                    {logLine}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="px-5 pb-5">
          {isOffline ? (
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 text-sm font-medium cursor-not-allowed select-none">
              <Clock size={14} />
              Station Offline
            </div>
          ) : (
            <div>
              <button
                onClick={() => handleLiveReport(device.id)}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait
                  ${device.status === 'critical'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-400'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white focus:ring-blue-400'
                  }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Opening…
                  </>
                ) : (
                  <>
                    {device.status === 'critical' ? <AlertTriangle size={14} /> : <BarChart3 size={14} />}
                    Live Report
                  </>
                )}
              </button>
              {/* Credit cost hint */}
              <p className="text-center text-[10px] text-gray-400 mt-1.5 flex items-center justify-center gap-1">
                <Coins size={9} className="text-amber-400" />
                Uses 1 credit per view
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!hasMounted) return null;

  return (
    <div className="space-y-10">
      {/* Insufficient credits banner */}
      {creditError && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <Coins size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
          <span>
            {creditError}{' '}
            <a href="/payments" className="underline font-semibold hover:text-amber-900">Buy credits →</a>
          </span>
        </div>
      )}

      {/* Online stations */}
      {onlineDevices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Online · {onlineDevices.length} station{onlineDevices.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {onlineDevices.map((device, i) => renderCard(device, i))}
          </div>
        </div>
      )}

      {/* Offline stations */}
      {offlineDevices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Offline · {offlineDevices.length} station{offlineDevices.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 opacity-70">
            {offlineDevices.map((device, i) => renderCard(device, onlineDevices.length + i))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceCards;