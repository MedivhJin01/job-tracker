import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import { verifyToken } from "@/lib/authMiddleware";
import { getApplication, updateApplication, deleteApplication } from "@/backend/applications";
import { InvalidError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (Number.isNaN(id)) throw new InvalidError("Invalid application ID");

    const result = await getApplication(id);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const user = verifyToken(req) as { id: number; role: string };

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (Number.isNaN(id)) throw new InvalidError("Invalid application ID");

    if (user.role !== "APPLICANT") {
      throw new InvalidError("Only applicants can update applications");
    }

    const body = await req.json();
    const updated = await updateApplication(id, user.id, body);
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const user = verifyToken(req) as { id: number; role: string };

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (Number.isNaN(id)) throw new InvalidError("Invalid application ID");

    if (user.role !== "APPLICANT") {
      throw new InvalidError("Only applicants can delete applications");
    }

    const result = await deleteApplication(id, user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}