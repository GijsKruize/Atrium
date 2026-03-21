/**
 * One-time migration: move document data from legacy `file` table columns
 * into the new `document` table.
 *
 * The old schema stored document metadata directly on the `file` table:
 *   - documentType, documentTitle, documentStatus, respondedAt, respondedById, respondReason
 *
 * The new schema uses a separate `document` table. This script:
 * 1. Checks if the old columns still exist on `file`
 * 2. Reads any rows with non-null documentType (i.e., files that were documents)
 * 3. Creates corresponding rows in the `document` table
 * 4. Skips files that already have a linked document (idempotent)
 *
 * Run BEFORE `prisma db push --accept-data-loss` so the data is preserved.
 *
 * Usage: DATABASE_URL="..." bun run packages/database/scripts/migrate-file-documents.ts
 */

import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    // Check if the old columns exist
    const columns = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'file' AND column_name IN ('documentType', 'documentTitle', 'documentStatus')
    `;

    if (columns.length === 0) {
      console.log("Legacy document columns not found on file table — nothing to migrate.");
      return;
    }

    console.log("Found legacy document columns on file table. Checking for data...");

    // Ensure the document table exists (it may not if this runs before prisma db push)
    const docTableExists = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'document'
      ) as exists
    `;

    if (!docTableExists[0]?.exists) {
      console.log("Document table does not exist yet. Run prisma db push first, then re-run this script.");
      console.log("WARNING: You must run prisma db push WITHOUT --accept-data-loss first to create the document table,");
      console.log("then run this migration, then run prisma db push --accept-data-loss to drop the old columns.");
      return;
    }

    // Query old document data from file table
    const legacyDocs = await prisma.$queryRaw<
      {
        id: string;
        filename: string;
        projectId: string;
        organizationId: string;
        uploadedById: string;
        createdAt: Date;
        documentType: string;
        documentTitle: string | null;
        documentStatus: string | null;
        respondedAt: Date | null;
        respondedById: string | null;
        respondReason: string | null;
      }[]
    >`
      SELECT id, filename, "projectId", "organizationId", "uploadedById", "createdAt",
             "documentType", "documentTitle", "documentStatus",
             "respondedAt", "respondedById", "respondReason"
      FROM file
      WHERE "documentType" IS NOT NULL
    `;

    if (legacyDocs.length === 0) {
      console.log("No legacy document data found. Nothing to migrate.");
      return;
    }

    console.log(`Found ${legacyDocs.length} file(s) with document data to migrate.`);

    let migrated = 0;
    let skipped = 0;

    for (const doc of legacyDocs) {
      // Check if a document already exists for this file (idempotent)
      const existing = await prisma.document.findFirst({
        where: { fileId: doc.id },
      });

      if (existing) {
        console.log(`  Skipping file ${doc.id} — document already exists (${existing.id})`);
        skipped++;
        continue;
      }

      // Map old status to new status
      let status = doc.documentStatus || "draft";
      // Old statuses: "pending", "accepted", "declined" — these map directly
      // New statuses also include: "draft", "signed", "voided", "expired"

      const newDoc = await prisma.document.create({
        data: {
          type: doc.documentType,
          title: doc.documentTitle || doc.filename,
          fileId: doc.id,
          projectId: doc.projectId,
          organizationId: doc.organizationId,
          uploadedById: doc.uploadedById,
          status,
          sentAt: status === "pending" ? doc.createdAt : null,
          createdAt: doc.createdAt,
        },
      });

      console.log(`  Migrated file ${doc.id} → document ${newDoc.id} (type=${doc.documentType}, status=${status})`);

      // If there was a response, create a DocumentResponse
      if (doc.respondedAt && doc.respondedById) {
        const action =
          status === "accepted" ? "accepted" :
          status === "declined" ? "declined" :
          "acknowledged";

        await prisma.documentResponse.create({
          data: {
            documentId: newDoc.id,
            userId: doc.respondedById,
            action,
            reason: doc.respondReason || undefined,
            createdAt: doc.respondedAt,
          },
        });

        console.log(`  Created response for document ${newDoc.id} (action=${action})`);
      }

      migrated++;
    }

    console.log(`\nMigration complete: ${migrated} migrated, ${skipped} skipped.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
