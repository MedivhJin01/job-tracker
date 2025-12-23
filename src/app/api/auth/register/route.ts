import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/backend/auth";
import { handleError } from "@/lib/errorHandler";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const result = await registerUser(body);

        const response = NextResponse.json({ message: "Register successful" }, { status: 200 });
        response.cookies.set("token", result.token, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
    } catch (error) {
        return handleError(error); 
    }
}