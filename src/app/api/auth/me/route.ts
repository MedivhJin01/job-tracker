import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/authMiddleware";
import prisma from "@/lib/prisma";
import { handleError } from "@/lib/errorHandler";


export async function GET(req: NextRequest) {
    try {
        const userData: any = verifyToken(req);

        const user = await prisma.user.findUnique({
            where: { id: userData.id },
            select: { id: true, email: true, role: true, name: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        return handleError(error);
    }
}
