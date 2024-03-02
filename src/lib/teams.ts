import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTeams() {
    return await prisma.team.findMany();
}

export async function getTeam(slug: string) {
    return await prisma.team.findUnique({
        where: {
            slug: slug,
        },
    });
}