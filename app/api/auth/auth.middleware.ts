import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends NextApiRequest {
  user?: any;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request
    req.user = user;

    // Continue to the API route handler
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
