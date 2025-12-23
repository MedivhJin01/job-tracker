import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { putJwtSession } from "@/lib/jwtSession";
import { InvalidError } from "@/lib/errors";

// add JWT_SECRET is set in .env
const SECRET_KEY = process.env.JWT_SECRET!; 

export async function registerUser({ email, password, role, name }: { email: string, password: string, role: string, name: string }) {
    if (role !== "APPLICANT" && role !== "RECRUITER") {
        throw new InvalidError("Invalid role");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new InvalidError("User already exists.");
    }
    if (password.length < 8) {
        throw new InvalidError("Password must be at least 8 characters long");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, password: hashedPassword, role, name },
    });

    const jti = nanoid(32);

    await putJwtSession(jti, {
        userId: user.id,
        role: String(user.role),
        createdAt: Date.now(),
    });

    // Generate JWT Token
    const token = jwt.sign(
        { id: user.id, role: String(user.role), jti },
        SECRET_KEY,
        { expiresIn: "7d" }
    );

    return { message: "User registered successfully", token };
}

export async function loginUser({ email, password }: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new InvalidError("Invalid email or password");
    }
    console.log(user.role)
    console.log(String(user.role))
    const jti = nanoid(32);

    await putJwtSession(jti, {
        userId: user.id,
        role: String(user.role),
        createdAt: Date.now(),
    });

    const token = jwt.sign(
        { id: user.id, role: String(user.role), jti },
        SECRET_KEY,
        { expiresIn: "7d" }
    );

    return { token, user };
}