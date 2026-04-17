import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, BarChart3, Clock, AlertTriangle } from 'lucide-react';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

const getRelativeTime = (datetime: string): string => {
  const diffMs = Date.now() - new Date(datetime).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)} days ago`;
};

const DeviceCards: React.FC = () => {
  const reportBaseUrl = '/stations/dashboard?device=';
  const initialDevices: Device[] = useMemo(() => [
    {
      id: 1,
      name: 'Device 1',
      location: 'Andheria More',
      health: 85,
      status: 'good',
      lastUpdate: '3 min ago',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 2,
      name: 'Device 2',
      location: 'Hauz Khas Telephone Centre',
      health: 88,
      status: 'good',
      lastUpdate: '2 min ago',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 3,
      name: 'Device 3',
      location: 'Qutub Minar',
      health: 92,
      status: 'excellent',
      lastUpdate: '1 min ago',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 4,
      name: 'Device 4',
      location: 'TB Hospital',
      health: 89,
      status: 'excellent',
      lastUpdate: '1 min ago',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 5,
      name: 'Device 5',
      location: 'Hauz Khas Metro Station',
      health: 80,
      status: 'good',
      lastUpdate: '2 min ago',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 6,
      name: 'Device 6',
      location: 'Piccadily back side parking Sec-34 Chandigarh',
      health: 85,
      status: 'good',
      lastUpdate: '3 min ago',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 7,
      name: 'Device 7',
      location: 'Passport office front side parking Sec-34 Chandigarh',
      health: 90,
      status: 'excellent',
      lastUpdate: '2 min ago',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 8,
      name: 'Device 8',
      location: 'Piccadily multiplex II Sec-34 Chandigarh',
      health: 100,
      status: 'excellent',
      lastUpdate: '1 min ago',
      lastDatetime: null,
      reportAvailable: true
    },
    {
      id: 9,
      name: 'Device 9',
      location: 'Sapna Cinema',
      health: 91,
      status: 'excellent',
      lastUpdate: '1 min ago',
      lastDatetime: null,
      reportAvailable: true
    }
  ], []);

  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [deviceLogs, setDeviceLogs] = useState<DeviceEventLogs>({});

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
          return { ...device, lastUpdate: getRelativeTime(cached), lastDatetime, status: isStale ? 'offline' as const : device.status };
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
            signal: AbortSignal.timeout(8000)
          });
          if (!res.ok) throw new Error('fetch failed');
          const data = await res.json();
          const points: { datetime: string }[] = data.points || [];
          const validPoints = points.filter(p => p.datetime && !p.datetime.startsWith('1970'));
          if (validPoints.length === 0) return { id: device.id, lastUpdate: 'No data', lastDatetime: null };
          const last = validPoints[validPoints.length - 1];
          const lastDatetime = new Date(last.datetime);
          return { id: device.id, lastUpdate: getRelativeTime(last.datetime), lastDatetime };
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
            const isStale = lastDatetime !== null && (Date.now() - lastDatetime.getTime()) > THIRTY_DAYS_MS;
            return {
              ...device,
              lastUpdate,
              lastDatetime,
              status: isStale ? 'offline' as const : device.status,
            };
          }
          return { ...device, lastUpdate: 'Offline', lastDatetime: null };
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

    fetchLastUpdates();
  }, [initialDevices]);

  const getStatusColor = (status: string) => {
    if (status === 'critical') {
      return 'bg-red-50 text-red-700 border border-red-200';
    }
    if (status === 'warning') {
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    }
    if (status === 'offline') {
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
    if (status === 'excellent') {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
    if (status === 'good') {
      return 'bg-green-50 text-green-700 border border-green-200';
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getStatusIndicator = (status: string) => {
    const baseClasses = 'w-3 h-3 rounded-full mr-2 shadow-sm';
    if (status === 'critical') {
      return `${baseClasses} bg-red-500 shadow-red-200`;
    }
    if (status === 'warning') {
      return `${baseClasses} bg-amber-500 shadow-amber-200`;
    }
    if (status === 'offline') {
      return `${baseClasses} bg-slate-400 shadow-slate-200`;
    }
    if (status === 'excellent') {
      return `${baseClasses} bg-emerald-500 shadow-emerald-200`;
    }
    return `${baseClasses} bg-green-500 shadow-green-200`;
  };

  const getHealthColor = (health: number | null, status: string) => {
    if (health === null) return 'text-gray-600';
    if (status === 'excellent' || status === 'good') return 'text-green-600';
    if (status === 'warning') return 'text-amber-600';
    if (status === 'critical') return 'text-red-600';
    return 'text-gray-600';
  };

  const getButtonStyle = (status: string) => {
    if (status === 'offline') {
      return 'bg-gray-100 text-gray-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed border border-gray-200';
    }
    if (status === 'critical') {
      return 'bg-gradient-to-r from-red-500 to-red-600 text-white font-medium py-3 px-4 rounded-xl hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5';
    }
    return 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5';
  };

  const onlineDevices = devices.filter(d => d.status !== 'offline');
  const offlineDevices = devices.filter(d => d.status === 'offline');

  const renderCard = (device: Device, sortedIndex: number) => (
    <div key={device.id} className="bg-white rounded-2xl shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 border border-gray-100 hover:border-gray-200">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <span className={getStatusIndicator(device.status)}></span>
            <h3 className="text-base font-bold text-gray-800">Device {sortedIndex + 1}</h3>
          </div>
          <div className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getStatusColor(device.status)}`}>
            {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
          </div>
        </div>
        <p className="text-gray-500 text-sm mb-3 flex items-center truncate">
          <MapPin className="text-blue-400 mr-1.5 flex-shrink-0" size={14} />
          {device.location}
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-400 text-xs">Battery Health</p>
            <p className={`font-semibold ${getHealthColor(device.health, device.status)}`}>
              {device.health !== null ? `${device.health}%` : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-gray-400 text-xs">Last Update</p>
            <p className="font-semibold text-gray-700 text-xs">{device.lastUpdate}</p>
          </div>
        </div>
        {device.chargerUrl && (
          <div className="mb-4 text-xs">
            <p className="text-gray-500 mb-1">Live Log</p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 space-y-1 max-h-24 overflow-auto">
              {(deviceLogs[device.id] || ['No events yet']).map((logLine, index) => (
                <p key={`${device.id}-${index}-${logLine}`} className="font-mono text-gray-700 break-words">
                  {logLine}
                </p>
              ))}
            </div>
          </div>
        )}
        {device.status === 'offline' ? (
          <button disabled className={`w-full text-center ${getButtonStyle(device.status)}`}>
            <Clock className="inline mr-2" size={14} />
            Offline
          </button>
        ) : (
          <a
            href={`${reportBaseUrl}${device.id}`}
            className={`w-full inline-block text-center ${getButtonStyle(device.status)}`}
          >
            {device.status === 'critical' ? (
              <>
                <AlertTriangle className="inline mr-2" size={14} />
                Live Report
              </>
            ) : (
              <>
                <BarChart3 className="inline mr-2" size={14} />
                Live Report
              </>
            )}
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {onlineDevices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Online — {onlineDevices.length} station{onlineDevices.length !== 1 ? 's' : ''}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {onlineDevices.map((device, i) => renderCard(device, i))}
          </div>
        </div>
      )}
      {offlineDevices.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Offline — {offlineDevices.length} station{offlineDevices.length !== 1 ? 's' : ''}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 opacity-75">
            {offlineDevices.map((device, i) => renderCard(device, onlineDevices.length + i))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceCards;