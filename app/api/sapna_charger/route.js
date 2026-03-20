
// /app/api/sapna_charger/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data/data.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const parsedBody = JSON.parse(fileContent);

    // 1. Capture metadata dynamically
    const metadata = parsedBody.start_transaction || {};

    // 2. Universal Flattening
    const flattenedData = [];
    if (parsedBody.metervalues) {
      parsedBody.metervalues.forEach((entry) => {
        (entry.payload?.meterValue || []).forEach((mv) => {
          const point = {
            datetime: mv.timestamp,
            current: 0, voltage: 0, soc: 0, energy: 0
          };

          mv.sampledValue?.forEach((sample) => {
            const val = parseFloat(sample.value) || 0;
            if (sample.measurand === "Current.Import") point.current = val;
            if (sample.measurand === "Voltage" && sample.location === "Inlet") {
              point.voltage_inlet = val;
            }
            if (sample.measurand === "SoC") point.soc = val;
            if (sample.measurand === "Energy.Active.Import.Register") point.energy = val;
          });
          flattenedData.push(point);
        });
      });
    }

    return NextResponse.json({ metadata, points: flattenedData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}