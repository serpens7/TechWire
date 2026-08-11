import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        // tsx, а не ts-node: генератор prisma-client отдаёт клиент исходниками
        // на TypeScript, но с расширением .js в путях импорта
        // (require('./internal/class.js') при файле class.ts). ts-node в
        // CommonJS-режиме такие спецификаторы не разрешает, tsx — разрешает.
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: process.env['DATABASE_URL'],
    },
});
