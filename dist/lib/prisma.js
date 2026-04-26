"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../src/generated/client/client");
const config_1 = require("../src/config");
const connectionString = `${config_1.config.databaseUrl}`;
// 1. Initialize Connection Pool
const pool = new pg_1.Pool({ connectionString });
// 2. Initialize Prisma PG Adapter
const adapter = new adapter_pg_1.PrismaPg(pool);
// 3. Instantiate Base Prisma Client
const basePrisma = new client_1.PrismaClient({ adapter });
// List of models that actually have the 'deletedAt' field in schema.prisma
const softDeleteModels = ['User', 'Conversation', 'Message'];
// --- LATEST PRISMA CLIENT EXTENSION FOR SOFT DELETE ---
const prisma = basePrisma.$extends({
    query: {
        $allModels: {
            // $allOperations catches every query (find, delete, count, etc.)
            async $allOperations({ model, operation, args, query }) {
                // If the model doesn't support soft delete, run the query normally
                if (!model || !softDeleteModels.includes(model)) {
                    return query(args);
                }
                // Cast to any — model is already verified to support soft delete via softDeleteModels.
                // The $allOperations args type is a massive union; casting is the recommended pattern.
                const softArgs = args;
                // 1. Convert 'delete' to 'update' (Soft Delete)
                if (operation === 'delete') {
                    return basePrisma[model].update({
                        ...softArgs,
                        data: { deletedAt: new Date() },
                    });
                }
                // 2. Convert 'deleteMany' to 'updateMany'
                if (operation === 'deleteMany') {
                    return basePrisma[model].updateMany({
                        ...softArgs,
                        data: { deletedAt: new Date(), ...(softArgs.data || {}) },
                    });
                }
                // 3. Filter out soft-deleted records for all read operations
                const readOperations = [
                    'findUnique',
                    'findFirst',
                    'findMany',
                    'findFirstOrThrow',
                    'aggregate',
                    'count',
                ];
                if (readOperations.includes(operation)) {
                    softArgs.where = { ...(softArgs.where || {}), deletedAt: null };
                }
                return query(args);
            },
        },
    },
});
exports.prisma = prisma;
