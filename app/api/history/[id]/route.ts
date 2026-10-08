import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/app/lib/db";
import { RequestHistory } from "@/app/lib/models";
import { getAuthFromRequest } from "@/app/lib/auth";

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await dbConnect();

    const request = await RequestHistory.findOne({
      _id: id,
      user: auth.id,
    }).lean();

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ request });
  } catch (error) {
    console.error("Fetch request error:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const auth = getAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await dbConnect();

    const deletedRequest = await RequestHistory.findOneAndDelete({
      _id: id,
      user: auth.id,
    });

    if (!deletedRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error("Delete request error:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 },
    );
  }
}
