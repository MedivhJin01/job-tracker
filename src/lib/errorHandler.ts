import { APIError, InternalServerError } from "./errors";
import { NextResponse } from "next/server";

export function handleError(error: unknown) {
    if (error instanceof APIError) {
        return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Unhandled Error:", error); 
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
