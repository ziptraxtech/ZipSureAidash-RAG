import { NextResponse } from 'next/server';

export async function GET(request) {
  const deviceId = "DEVICE-01"; // Specific ID for this route

  try {
    const response = await fetch(
      `https://le3tvo1cgc.execute-api.us-east-1.amazonaws.com/prod/get-data?table=acCurrent_Data`,
      { cache: 'no-store', signal: AbortSignal.timeout(15000) }
    );

    if (!response.ok) {
      return NextResponse.json({ error: `AWS Fetch Failed: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const rawPoints = typeof data.body === 'string' ? JSON.parse(data.body) : data;

    // 1. SORT DATA by combining Date (YYYY-MM-DD) and Time (HH:MM:SS)
    // Lexicographical sort works perfectly for these ISO-style strings
    const sortedPoints = [...rawPoints].sort((a, b) => {
      const dateTimeA = `${a.date} ${a.time}`;
      const dateTimeB = `${b.date} ${b.time}`;
      return dateTimeA.localeCompare(dateTimeB);
    });

    console.log(`\n--- DATA FETCHED FOR ${deviceId.toUpperCase()} ---`);
    
    // Display raw table of first 10 points
    console.table(sortedPoints.slice(0, 10), ["date", "time", "ac_current"]);

    let cumulativeEnergy = 0;
    
    const flattenedPoints = sortedPoints.map((p, index) => {
      const rawCurrent = parseFloat(p.ac_current) || 0;
      const voltage = 360;
      const current = rawCurrent < 0 ? 0 : rawCurrent;
      const fullDateTime = `${p.date}T${p.time}`;
      const dtHours = index === 0 ? 0 :
        (new Date(fullDateTime) - new Date(`${sortedPoints[index - 1].date}T${sortedPoints[index - 1].time}`)) / 3600000;
      const energyStep = voltage * current * dtHours;
      cumulativeEnergy += energyStep;
      
      const soc = Math.min(100, 10 + (index / sortedPoints.length) * 90);
      
      const fullDateTimeLog = `${p.date} ${p.time}`;

      // --- LOG ALL FINAL PARAMETERS PER POINT ---
      console.log(
        `[${index.toString().padStart(3, '0')}] ` +
        `TIME: ${fullDateTimeLog} | ` +
        `CURR: ${current.toFixed(2)}A | ` +
        `STEP: ${energyStep.toFixed(3)}Wh | ` +
        `TOTAL: ${cumulativeEnergy.toFixed(2)}Wh | ` +
        `SoC: ${soc.toFixed(1)}%`
      );

      return {
        datetime: `${p.date}T${p.time}`, // ISO format for frontend charts
        current: current,
        voltage_inlet: 360,
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
        source: "AWS_IOT_CORE_DEVICE_1",
        processedAt: new Date().toISOString()
      }, 
      points: flattenedPoints 
    });

  } catch (error) {
    console.error("❌ API CRITICAL ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}