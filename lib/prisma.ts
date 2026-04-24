import { Pool } from "pg"; // pg থেকে Pool ইম্পোর্ট করতে হবে
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client/client";
import { config } from "../src/config";

const connectionString = `${config.databaseUrl}`;

const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export { prisma };