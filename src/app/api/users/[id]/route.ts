import { NextRequest, NextResponse } from "next/server";
import { getUser, updateUser } from "@/backend/users";
import { handleError } from "@/lib/errorHandler";

export async function GET(req: NextRequest, context: { params: { id: string } }) {
    try {
        const params = await context.params;
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const response = await getUser(id);
        return NextResponse.json(response, { status: response.status });
    } catch (error) {
        return handleError(error);
    }
    
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
    try {
        const params = await context.params;
        const id = parseInt(params.id, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
        }

        const body = await req.json();
        const response = await updateUser(id, body);
        return NextResponse.json(response, { status: response.status });
    } catch (error) {
        return handleError(error);
    }
    
}