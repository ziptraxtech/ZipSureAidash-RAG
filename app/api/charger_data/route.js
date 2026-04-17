// /app/api/charger-data/route.js
import { NextResponse } from 'next/server';

const Q_NOM_AH       = 100;
const SOC_MIDNIGHT   = 95;
const ASSUMED_DT_MIN = 1;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('device') || 'device2';
  const soc0     = Math.min(100, Math.max(0,
    parseFloat(searchParams.get('soc0')) || SOC_MIDNIGHT
  ));

  try {
    const response = await fetch(
      `https://le3tvo1cgc.execute-api.us-east-1.amazonaws.com/prod/get-data?table=${deviceId}`,
      { cache: 'no-store', signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `AWS Fetch Failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data      = await response.json();
    const rawPoints = typeof data.body === 'string' ? JSON.parse(data.body) : data;

    const sortedPoints = [...rawPoints].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    // Fast path: caller only needs the last timestamp (e.g. stations page status)
    if (searchParams.get('lastOnly') === 'true') {
      const last = sortedPoints.findLast(p => p.datetime && !p.datetime.startsWith('1970'));
      return NextResponse.json({ points: last ? [{ datetime: last.datetime }] : [] });
    }

    console.log(`\n--- DATA FETCHED FOR ${deviceId.toUpperCase()} ---`);
    console.log(`📅 First point : ${sortedPoints.at(0)?.datetime}`);
    console.log(`📅 Last point  : ${sortedPoints.at(-1)?.datetime}`);
    console.log(`📦 Total points: ${sortedPoints.length}`);
    console.table(sortedPoints.slice(0, 10), ['datetime', 'current', 'temperature']);

    let soc              = soc0;
    let cumulativeEnergy = 0;
    const VOLTAGE        = 230;

    const flattenedPoints = sortedPoints.map((p, index) => {

      // ── Day boundary reset (robust — works at any sampling rate) ────────────
      // Instead of matching exact 00:00, we detect when the calendar date flips.
      // Works whether your data is every 1 min, 5 min, or 15 min.
      if (index > 0) {
        const prevDatetime = sortedPoints[index - 1].datetime;
        const currDatetime = p.datetime;

        // Slice the ISO string to "YYYY-MM-DD" — handles both
        // "2025-06-01T23:59:00Z" and "2025-06-01 23:59:00" formats
        const prevDay = new Date(prevDatetime).toISOString().slice(0, 10);
        const currDay = new Date(currDatetime).toISOString().slice(0, 10);

        // ── Debug: log every date comparison so you can see if it ever flips
        if (index <= 5 || prevDay !== currDay) {
          console.log(`📆 [${index}] prevDay=${prevDay} | currDay=${currDay} | boundary=${prevDay !== currDay}`);
        }

        if (prevDay !== currDay) {
          console.log(`🔄 DAY BOUNDARY DETECTED`);
          console.log(`   Previous: ${prevDatetime} (${prevDay})`);
          console.log(`   Current : ${currDatetime} (${currDay})`);
          console.log(`   SOC reset: ${soc.toFixed(1)}% → ${SOC_MIDNIGHT}%`);
          soc              = SOC_MIDNIGHT;
          cumulativeEnergy = 0;
        }
      }

      // ── Clean current ──────────────────────────────────────────────────────
      const rawCurrent = parseFloat(p.current) || 0;
      const current    = (Math.abs(rawCurrent) > 100) ? 0 : rawCurrent;

      // ── Time delta (hours) ─────────────────────────────────────────────────
      let dtHours = ASSUMED_DT_MIN / 60;
      if (index > 0) {
        const tPrev  = new Date(sortedPoints[index - 1].datetime).getTime();
        const tCurr  = new Date(p.datetime).getTime();
        const diffMs = tCurr - tPrev;
        if (diffMs > 0 && diffMs < 30 * 60 * 1000) {
          dtHours = diffMs / (1000 * 60 * 60);
        }
      }

      // ── Coulomb counting (discharging perspective) ─────────────────────────
      const socDelta = (current * dtHours / Q_NOM_AH) * 100;
      soc = Math.min(100, Math.max(0, soc - socDelta));

      // ── Energy accumulation ────────────────────────────────────────────────
      const energyStep  = VOLTAGE * current * dtHours;
      cumulativeEnergy += energyStep;

      // ── Log ────────────────────────────────────────────────────────────────
      const cleanTime = p.datetime.replace('T', ' ').split('.')[0].replace('Z', '');
      console.log(
        `[${index.toString().padStart(3, '0')}] ` +
        `TIME: ${cleanTime} | ` +
        `CURR: ${current.toFixed(2)}A | ` +
        `ΔT: ${(dtHours * 60).toFixed(2)}min | ` +
        `ΔSOC: -${socDelta.toFixed(3)}% | ` +
        `SOC: ${soc.toFixed(1)}% | ` +
        `STEP: ${energyStep.toFixed(3)}Wh | ` +
        `TOTAL: ${cumulativeEnergy.toFixed(2)}Wh`
      );

      return {
        datetime:      p.datetime,
        current:       current,
        voltage_inlet: VOLTAGE,
        soc:           Number(soc.toFixed(1)),
        energy:        Number(cumulativeEnergy.toFixed(2)),
        temperature:   p.temperature || 0,
      };
    });

    console.log('------------------------------------------------------------');
    console.log(
      `✅ FINISHED: ${flattenedPoints.length} points | ` +
      `SOC: ${soc0.toFixed(1)}% → ${soc.toFixed(1)}% | ` +
      `Total Energy: ${(cumulativeEnergy / 1000).toFixed(4)} kWh\n`
    );

    return NextResponse.json({
      metadata: {
        deviceId,
        meterstart:  0,
        source:      'AWS_IOT_CORE',
        soc_initial: soc0,
        soc_final:   Number(soc.toFixed(1)),
        q_nom_ah:    Q_NOM_AH,
        processedAt: new Date().toISOString(),
      },
      points: flattenedPoints,
    });

  } catch (error) {
    const isTimeout = error.name === 'TimeoutError' || error.code === 'ETIMEDOUT';
    console.error(
      `❌ API ${isTimeout ? 'TIMEOUT' : 'CRITICAL'} ERROR for ${deviceId}:`,
      error.message
    );
    return NextResponse.json(
      { error: isTimeout
          ? `AWS request timed out for ${deviceId} — table may not exist yet`
          : error.message
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}