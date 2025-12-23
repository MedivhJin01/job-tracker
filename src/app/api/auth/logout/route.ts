import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import { verifyToken } from "@/lib/authMiddleware";
import { deleteJwtSession } from "@/lib/jwtSession";

export async function POST(req: NextRequest) {
    try {
        const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
        const token = req.cookies.get("token")?.value;
        if (token) {
            const claims = verifyToken(req);
            await deleteJwtSession(claims.jti);
        }

        response.cookies.set("token", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            expires: new Date(0), // expire immediately
            path: "/",
        });

        return response;
    } catch (error) {
        return handleError(error); 
    }
}