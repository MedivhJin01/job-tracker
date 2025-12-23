import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "@/backend/users";

export async function GET(req: NextRequest) {
    const response = await getAllUsers();
    return NextResponse.json(response, { status: response.status });
}
