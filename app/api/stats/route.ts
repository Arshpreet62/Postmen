import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/app/lib/db";
import { RequestHistory } from "@/app/lib/models";
import { getAuthFromRequest } from "@/app/lib/auth";

// "Delivered" means the host answered with 2xx or 3xx, the same rule the
// outbox filter and the postmarks use.
const DELIVERED = { $and: [{ $gte: ["$response.status", 200] }, { $lt: ["$response.status", 400] }] };

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!mongoose.isValidObjectId(auth.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = new mongoose.Types.ObjectId(auth.id);
    // Counted in the database; bodies never leave it.
    const [summary] = await RequestHistory.aggregate([
      { $match: { user } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                delivered: { $sum: { $cond: [DELIVERED, 1, 0] } },
              },
            },
          ],
          methods: [{ $group: { _id: "$method", n: { $sum: 1 } } }],
          statuses: [{ $group: { _id: "$response.status", n: { $sum: 1 } } }],
          // Older entries were saved before durations were measured; skip them.
          durations: [
            { $match: { "response.durationMs": { $type: "number" } } },
            { $sort: { "response.durationMs": 1 } },
            { $group: { _id: null, all: { $push: "$response.durationMs" } } },
          ],
        },
      },
    ]);

    const totalRequests: number = summary?.totals[0]?.total ?? 0;
    const successfulRequests: number = summary?.totals[0]?.delivered ?? 0;
    const durations: number[] = summary?.durations[0]?.all ?? [];
    const mid = Math.floor(durations.length / 2);
    const medianDurationMs = durations.length
      ? durations.length % 2
        ? durations[mid]
        : Math.round((durations[mid - 1] + durations[mid]) / 2)
      : null;

    const methodBreakdown: Record<string, number> = {};
    for (const m of summary?.methods ?? []) methodBreakdown[m._id] = m.n;
    const statusBreakdown: Record<string, number> = {};
    for (const s of summary?.statuses ?? []) statusBreakdown[String(s._id ?? 0)] = s.n;

    return NextResponse.json({
      totalRequests,
      medianDurationMs,
      timedRequests: durations.length,
      successfulRequests,
      failedRequests: totalRequests - successfulRequests,
      successRate: totalRequests > 0 ? Number(((successfulRequests / totalRequests) * 100).toFixed(2)) : 0,
      methodBreakdown,
      statusBreakdown,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 });
  }
}
