CREATE TABLE `crm_roles` (
  `roleId` VARCHAR(64) NOT NULL,
  `roleName` VARCHAR(64) NOT NULL,
  `roleCode` VARCHAR(64) NOT NULL,
  `roleStatus` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `remark` VARCHAR(255) NULL,
  `createTime` BIGINT UNSIGNED NOT NULL,
  `updateTime` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`roleId`),
  UNIQUE INDEX `uk_crm_roles_code` (`roleCode`),
  INDEX `idx_crm_roles_status_created` (`roleStatus`, `createTime`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crm_user_roles` (
  `userId` VARCHAR(64) NOT NULL,
  `roleId` VARCHAR(64) NOT NULL,
  `createTime` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`userId`, `roleId`),
  INDEX `idx_crm_user_roles_role` (`roleId`),
  CONSTRAINT `fk_crm_user_roles_user` FOREIGN KEY (`userId`) REFERENCES `crm_users` (`userId`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_crm_user_roles_role` FOREIGN KEY (`roleId`) REFERENCES `crm_roles` (`roleId`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
