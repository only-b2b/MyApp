const axios = require('axios');

const HUBS = [
  "Law College Rd, near FTII Institute, Shanti Sheela Society, Erandwane, Pune, Maharashtra 411004, India",
  "City woods, Shop 18 opp Gool Poonawalla Garden, Salisbury Park, Pune, Maharashtra 411037, India",
  "Fortaleza Complex, 2nd Floor, above NM Medical, Kalyani Nagar, Pune, Maharashtra 411006, India",
  "Survey No.8/10, 3rd Floor, Manhar House, Next to Saibaba Mandir, Satara Rd, Pune, Maharashtra 411037, India",
  "9th Floor, ICC Towers, B Wing, Senapati Bapat Rd, Pune, Maharashtra 411016, India",
];

const PACKAGES = {
  basic:   { price: 499,  etaMin: 120 },
  premium: { price: 999,  etaMin: 180 },
  deluxe:  { price: 1499, etaMin: 240 },
};

// GET /quote?packageId=premium&(destLat=..&destLng=.. | destAddress=..)
app.get('/quote', async (req, res) => {
  try {
    const { packageId, destLat, destLng, destAddress } = req.query;
    const pkg = PACKAGES[packageId];
    if (!pkg) return res.status(400).json({ error: 'BAD_PACKAGE' });

    // build destination (lat,lng preferred)
    let destination;
    if (destLat && destLng) {
      destination = `${destLat},${destLng}`;
    } else if (destAddress) {
      destination = destAddress;
    } else {
      return res.status(400).json({ error: 'NO_DESTINATION' });
    }

    const originsParam = HUBS.map(encodeURIComponent).join('|');
    const url =
      `https://maps.googleapis.com/maps/api/distancematrix/json` +
      `?units=metric&mode=driving&departure_time=now&traffic_model=best_guess` +
      `&origins=${originsParam}` +
      `&destinations=${encodeURIComponent(destination)}` +
      `&key=${process.env.GOOGLE_MAPS_API_KEY}`;

    const { data } = await axios.get(url);
    if (data.status !== 'OK') {
      return res.status(502).json({ error: 'GMAPS_ERROR', status: data.status });
    }

    // Pick best hub by min duration_in_traffic (fallback to duration)
    let best = null;
    data.rows.forEach((row, i) => {
      const el = row.elements?.[0];
      if (!el || el.status !== 'OK') return;
      const dur = el.duration_in_traffic?.value ?? el.duration?.value; // seconds
      if (dur == null) return;

      const candidate = {
        hubIndex: i,
        hubAddress: HUBS[i],
        distanceMeters: el.distance?.value ?? null,
        distanceText: el.distance?.text ?? '',
        durationSec: el.duration?.value ?? null,
        durationText: el.duration?.text ?? '',
        durationInTrafficSec: el.duration_in_traffic?.value ?? dur,
        durationInTrafficText: el.duration_in_traffic?.text ?? el.duration?.text ?? '',
      };
      if (!best || candidate.durationInTrafficSec < best.durationInTrafficSec) {
        best = candidate;
      }
    });

    if (!best) return res.status(404).json({ error: 'NO_ROUTE' });

    const serviceMin = pkg.etaMin;
    const travelMin = Math.round(best.durationInTrafficSec / 60);
    const totalEtaMin = travelMin + serviceMin;

    return res.json({
      packageId,
      price: pkg.price,
      destination: destination,
      nearestHub: {
        label: best.hubAddress,
        index: best.hubIndex,
      },
      distance: {
        meters: best.distanceMeters,
        text: best.distanceText,
      },
      travel: {
        seconds: best.durationInTrafficSec,
        text: best.durationInTrafficText,
      },
      service: {
        minutes: serviceMin,
      },
      totalEta: {
        minutes: totalEtaMin,
      },
    });
  } catch (e) {
    console.error('QUOTE_ERROR', e.message);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});
