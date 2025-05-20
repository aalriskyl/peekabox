-- AlterTable
ALTER TABLE `Session` 
    DROP COLUMN `isUsed`,
    ADD COLUMN `status` ENUM('ACTIVE', 'USED', 'EXPIRED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `sessionCodeId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `Session_sessionCodeId_key` ON `Session`(`sessionCodeId`);

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_sessionCodeId_fkey` FOREIGN KEY (`sessionCodeId`) REFERENCES `SessionCode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
