import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import { RequestHistory } from "@/app/lib/models";
import { getAuthFromRequest } from "@/app/lib/auth";

// Page numbers and sizes come from the query string, so clamp them: a limit
// of 0 means "everything" to MongoDB and a page of 0 means a negative skip.
function intParam(value: string | null, fallback: number, min: number, max: number) {
  const n = parseInt(value ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const sp = req.nextUrl.searchParams;
    const page = intParam(sp.get("page"), 1, 1, 10_000);
    const limit = intParam(sp.get("limit"), 10, 1, 100);
    const skip = (page - 1) * limit;

    // The list leaves bodies out; open one item to get its full record.
    const [history, total] = await Promise.all([
      RequestHistory.find({ user: auth.id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .select("-request.body -response.body")
        .lean(),
      RequestHistory.countDocuments({ user: auth.id }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return NextResponse.json({
      success: true,
      history,
      pagination: {
        currentPage: page,
        totalPages,
        totalRequests: total,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch request history" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const result = await RequestHistory.deleteMany({ user: auth.id });

    return NextResponse.json({
      message: "All request history cleared",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear history error:", error);
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}
