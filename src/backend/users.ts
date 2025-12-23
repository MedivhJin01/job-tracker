import prisma from "@/lib/prisma";
import { InvalidError, NotFoundError, InternalServerError } from "@/lib/errors";
import { handleError } from "@/lib/errorHandler";
import bcrypt from "bcryptjs";


export async function getAllUsers() {
    try {
        const users = await prisma.user.findMany();
        return { status: 200, data: users };
    } catch (error) {
        console.error("Error fetching all users:", error);
        return handleError(new InternalServerError());
    }
}

export async function getUser(id: number) {
    try {
        if (!id || isNaN(id)) {
            throw new InvalidError("Invalid User ID");
        }

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                resumes: true,
            },
        });

        if (!user) {
            throw new NotFoundError("User not found");
        }

        const { resumes, ...rest } = user;
        const has_resume = resumes.length > 0;

        return { status: 200, data: { ...rest, has_resume } };
    } catch (error) {
        return handleError(error);
    }
}

export async function updateUser(
    id: number,
    data: Partial<{ name: string; email: string; education: string; password: string }>
) {
    try {
        if (!id || isNaN(id)) {
            throw new InvalidError("Invalid User ID");
        }

        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new NotFoundError("User not found");
        }

        if (data.password) {
            if (data.password.length < 8) {
                throw new InvalidError("Password must be at least 8 characters long");
            }
            data.password = await bcrypt.hash(data.password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data,
        });

        return { status: 200, message: "User updated successfully", data: updatedUser };
    } catch (error) {
        console.error("Error updating user:", error);
        return handleError(error);
    }
}