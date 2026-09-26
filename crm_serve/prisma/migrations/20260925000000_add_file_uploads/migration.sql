CREATE TABLE `crm_files` (
    `fileId` VARCHAR(64) NOT NULL,
    `category` VARCHAR(16) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `storageKey` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(128) NOT NULL,
    `extension` VARCHAR(16) NOT NULL,
    `size` INTEGER UNSIGNED NOT NULL,
    `uploadedBy` VARCHAR(64) NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'TEMPORARY',
    `createTime` BIGINT UNSIGNED NOT NULL,
    `updateTime` BIGINT UNSIGNED NOT NULL,
    UNIQUE INDEX `crm_files_storageKey_key` (`storageKey`),
    INDEX `crm_files_uploadedBy_createTime_idx` (`uploadedBy`, `createTime`),
    INDEX `crm_files_status_createTime_idx` (`status`, `createTime`),
    PRIMARY KEY (`fileId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
