import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/backend/auth";
import { handleError } from "@/lib/errorHandler";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { token, user } = await loginUser(body);

        // Store JWT securely in a cookie
        const response = NextResponse.json({ message: "Login successful", user }, { status: 200 });
        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        return handleError(error);
    }
}
