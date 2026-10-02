const { PrismaClient } = require("@prisma/client");

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

// Resilient wrapper with 1 automatic retry on transient pooler drops / latency timeouts
const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        try {
          return await query(args);
        } catch (err) {
          if (
            err.code === "P1001" ||
            err.message?.includes("ConnectionReset") ||
            err.message?.includes("connection was forcibly closed") ||
            err.message?.includes("Can't reach database server")
          ) {
            console.warn(`[Prisma Retry] Transient connection drop on ${model}.${operation}. Retrying...`);
            await new Promise((resolve) => setTimeout(resolve, 800));
            return await query(args);
          }
          throw err;
        }
      },
    },
  },
});

module.exports = prisma;

