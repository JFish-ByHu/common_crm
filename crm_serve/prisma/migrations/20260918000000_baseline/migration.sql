CREATE TABLE `crm_users` (
  `userId` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `createTime` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updateTime` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `accountStatus` TINYINT UNSIGNED NOT NULL DEFAULT 1,

  UNIQUE INDEX `uk_crm_users_username`(`username`),
  UNIQUE INDEX `uk_crm_users_email`(`email`),
  PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
