import { NextResponse } from 'next/server';

export const maxDuration = 60;

const GAP_LIMIT_MS = 30 * 60 * 1000;   // 30 minutes
const CURRENT_THRESHOLD = 1.0;           // Amps — below this = idle

// Map frontend deviceId to the correct data API URL
function getDeviceDataUrl(deviceId, baseUrl) {
  if (deviceId === "1") return `${baseUrl}/api/charger_data_1`;
  if (deviceId === "9") return `${baseUrl}/api/charger_data?device=sapna_charger`;
  const num = parseInt(deviceId);
  if (num >= 2 && num <= 8) return `${baseUrl}/api/charger_data?device=device${num}`;
  return null;
}

/**
 * Convert raw data points into a structured summary the LLM can reason about
 * accurately — sessions with computed stats rather than 150 raw JSON blobs.
 */
function summarizeDeviceData(points, deviceId) {
  if (!points || points.length === 0) return null;

  const sorted = [...points].sort(
    (a, b) => new Date(a.datetime) - new Date(b.datetime)
  );

  // ── Detect sessions ────────────────────────────────────────────────────────
  const sessions = [];
  let sessionStart = 0;

  for (let i = 1; i <= sorted.length; i++) {
    const isLast = i === sorted.length;
    let isBreak = isLast;

    if (!isLast) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const dtMs = new Date(curr.datetime) - new Date(prev.datetime);
      const prevA = parseFloat(prev.current) || 0;
      const currA = parseFloat(curr.current) || 0;
      isBreak =
        dtMs > GAP_LIMIT_MS ||
        (prevA >= CURRENT_THRESHOLD && currA < CURRENT_THRESHOLD);
    }

    if (isBreak) {
      const seg = sorted.slice(sessionStart, i);
      if (seg.length > 1) {
        const first = seg[0];
        const last  = seg[seg.length - 1];
        const currents = seg.map(p => parseFloat(p.current) || 0);
        const temps    = seg.map(p => parseFloat(p.temperature) || 0);
        const avgA     = currents.reduce((s, v) => s + v, 0) / currents.length;
        const energyWh = (parseFloat(last.energy) || 0) - (parseFloat(first.energy) || 0);
        const durationMin = Math.round(
          (new Date(last.datetime) - new Date(first.datetime)) / 60000
        );

        sessions.push({
          session: sessions.length + 1,
          start:          first.datetime,
          end:            last.datetime,
          duration_min:   durationMin,
          energy_wh:      Math.round(energyWh * 100) / 100,
          energy_kwh:     Math.round(energyWh / 10) / 100,
          peak_current_a: Math.round(Math.max(...currents) * 100) / 100,
          avg_current_a:  Math.round(avgA * 100) / 100,
          peak_temp_c:    Math.round(Math.max(...temps) * 100) / 100,
          start_soc_pct:  parseFloat(first.soc) || null,
          end_soc_pct:    parseFloat(last.soc) || null,
          voltage_v:      parseFloat(first.voltage_inlet) || null,
          data_points:    seg.length,
        });
      }
      sessionStart = i;
    }
  }

  // ── Global stats ───────────────────────────────────────────────────────────
  const allCurrents = sorted.map(p => parseFloat(p.current) || 0);
  const allTemps    = sorted.map(p => parseFloat(p.temperature) || 0);
  const lastPoint   = sorted[sorted.length - 1];

  // ── Last 10 readings for granular/recent questions ─────────────────────────
  const recent = sorted.slice(-10).map(p => ({
    time:        p.datetime,
    current_a:   parseFloat(p.current) || 0,
    voltage_v:   parseFloat(p.voltage_inlet) || null,
    soc_pct:     parseFloat(p.soc) || null,
    energy_wh:   parseFloat(p.energy) || 0,
    temp_c:      parseFloat(p.temperature) || 0,
  }));

  return {
    device_id:   deviceId,
    data_range: {
      start:        sorted[0].datetime,
      end:          lastPoint.datetime,
      total_points: sorted.length,
    },
    global_stats: {
      max_current_a:              Math.round(Math.max(...allCurrents) * 100) / 100,
      max_temperature_c:          Math.round(Math.max(...allTemps) * 100) / 100,
      total_cumulative_energy_wh: Math.round((parseFloat(lastPoint.energy) || 0) * 100) / 100,
      total_cumulative_energy_kwh:Math.round((parseFloat(lastPoint.energy) || 0) / 10) / 100,
      current_soc_pct:            parseFloat(lastPoint.soc) || null,
      voltage_v:                  parseFloat(sorted[0].voltage_inlet) || null,
    },
    sessions,
    most_recent_readings: recent,
  };
}

export async function POST(req) {
  const host = req.headers.get('host');

  const PYTHON_BRIDGE = process.env.VERCEL
    ? `https://${host}/python_api`
    : 'http://127.0.0.1:8000';

  const BASE_URL = process.env.VERCEL
    ? `https://${host}`
    : 'http://localhost:3000';

  console.log("--- NEXT.JS ROUTE START ---");

  try {
    const body = await req.json();
    const { messages, deviceId, session_id: clientSessionId } = body;
    const userQuestion = messages[messages.length - 1].content;
    console.log(`Step 1: Question="${userQuestion}", deviceId=${deviceId}, session_id=${clientSessionId}`);

    // ── Step 2: Get or create Python session ────────────────────────────────
    let session_id = clientSessionId;
    if (!session_id) {
      const sessionRes = await fetch(`${PYTHON_BRIDGE}/chatbot`, { cache: 'no-store' });
      if (!sessionRes.ok) {
        throw new Error(`Python backend unreachable (${sessionRes.status}). Is FastAPI running?`);
      }
      ({ session_id } = await sessionRes.json());
      console.log(`Step 2: New session ${session_id}`);
    } else {
      console.log(`Step 2: Reusing session ${session_id}`);
    }

    // ── Step 3: Fetch + summarize live data for devices 1–8 ─────────────────
    let device_summary = null;
    const dataUrl = getDeviceDataUrl(deviceId, BASE_URL);
    if (dataUrl) {
      try {
        console.log(`Step 3: Fetching live data from ${dataUrl}`);
        const dataRes = await fetch(dataUrl, {
          cache: 'no-store',
          signal: AbortSignal.timeout(15000),
        });
        if (dataRes.ok) {
          const raw = await dataRes.json();
          const allPoints = raw.points || [];
          device_summary = summarizeDeviceData(allPoints, deviceId);
          console.log(
            `Step 3 SUCCESS: ${allPoints.length} points → ` +
            `${device_summary?.sessions?.length ?? 0} sessions detected`
          );
        } else {
          console.warn(`Step 3: Data API returned ${dataRes.status}`);
        }
      } catch (e) {
        console.warn(`Step 3: Could not fetch live data — ${e.message}`);
      }
    } else {
      console.log(`Step 3: No data URL for device ${deviceId} — skipping live fetch`);
    }

    // ── Step 4: Ask Python RAG ───────────────────────────────────────────────
    console.log(`Step 4: Sending to ${PYTHON_BRIDGE}/ask...`);
    const askRes = await fetch(`${PYTHON_BRIDGE}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id,
        question: userQuestion,
        deviceId,
        device_summary,
        current_datetime: new Date().toISOString(),
      }),
    });

    if (!askRes.ok) {
      const askError = await askRes.text();
      throw new Error(`Python RAG Failed (${askRes.status}): ${askError}`);
    }

    const pythonData = await askRes.json();
    console.log(`Step 5 SUCCESS`);

    return NextResponse.json({ role: 'assistant', content: pythonData.response, session_id });

  } catch (error) {
    console.error("!!! NEXT.JS ROUTE ERROR !!!:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
