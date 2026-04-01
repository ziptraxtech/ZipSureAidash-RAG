// /app/api/charger-data/route.js
import { NextResponse } from 'next/server';
import { date } from 'zod/v4';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // Get the device ID from the URL (e.g., ?device=device2)
  const deviceId = searchParams.get('device') || 'device2';

  try {
    const response = await fetch(
      `https://le3tvo1cgc.execute-api.us-east-1.amazonaws.com/prod/get-data?table=${deviceId}`,
      { cache: 'no-store', signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      return NextResponse.json({ error: `AWS Fetch Failed: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const rawPoints = typeof data.body === 'string' ? JSON.parse(data.body) : data;

    // 1. SORT DATA by the datetime string as data comes in random order from AWS
    const sortedPoints = [...rawPoints].sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    console.log(`\n--- DATA FETCHED FOR ${deviceId.toUpperCase()} ---`);
    console.table(sortedPoints.slice(0, 10), ["datetime", "current", "temperature"]);


    let cumulativeEnergy = 0;
    
    const flattenedPoints = sortedPoints.map((p, index) => {
      const rawCurrent = parseFloat(p.current) || 0;
      const voltage = 230; // Constant placeholder as AWS doesn't provide Voltage
      const current = (rawCurrent < 0 || rawCurrent > 100) ? 0 : rawCurrent;
      // Calculate incremental energy (Wh) assuming ~1 minute intervals
      // (V * A * (1/60 hours))
      const energyStep = (voltage * current * (1 / 60));
      cumulativeEnergy += energyStep;
      const soc = Math.min(100, 10 + (index / sortedPoints.length) * 90);
      const cleanTime = p.datetime.replace('T', ' ').split('.')[0].replace('Z', '');
      // --- LOG ALL FINAL PARAMETERS PER POINT ---
      console.log(
        `[${index.toString().padStart(3, '0')}] ` +
        `TIME: ${cleanTime} | ` +
        `CURR: ${current.toFixed(2)}A | ` +
        `STEP: ${energyStep.toFixed(3)}Wh | ` +
        `TOTAL: ${cumulativeEnergy.toFixed(2)}Wh | ` +
        `SoC: ${soc.toFixed(1)}%`
      );

      return {
        datetime: p.datetime,
        current: current,
        voltage_inlet: voltage,
        soc: Number(soc.toFixed(1)),
        energy: Number(cumulativeEnergy.toFixed(2)), 
        temperature: p.temperature || 0
      };
    });
    console.log(`------------------------------------------------------------`);
    console.log(`✅ FINISHED: ${flattenedPoints.length} points | Total Energy: ${(cumulativeEnergy / 1000).toFixed(4)} kWh\n`);

    return NextResponse.json({ 
      metadata: { 
        deviceId, 
        meterstart: 0, 
        source: "AWS_IOT_CORE",
        processedAt: new Date().toISOString()
      }, 
      points: flattenedPoints 
    });

  } catch (error) {
    const isTimeout = error.name === 'TimeoutError' || error.code === 'ETIMEDOUT';
    console.error(`❌ API ${isTimeout ? 'TIMEOUT' : 'CRITICAL'} ERROR for ${deviceId}:`, error.message);
    return NextResponse.json(
      { error: isTimeout ? `AWS request timed out for ${deviceId} — table may not exist yet` : error.message },
      { status: isTimeout ? 504 : 500 }
    );
  }
}