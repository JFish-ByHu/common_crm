CREATE TABLE `crm_auth_sessions` (
  `sessionId` VARCHAR(64) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `tokenHash` CHAR(64) NOT NULL,
  `expiresAt` DATETIME(0) NOT NULL,
  `revokedAt` DATETIME(0) NULL,
  `createTime` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updateTime` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `uk_crm_auth_sessions_token_hash`(`tokenHash`),
  INDEX `idx_crm_auth_sessions_user_id`(`userId`),
  INDEX `idx_crm_auth_sessions_expires_at`(`expiresAt`),
  PRIMARY KEY (`sessionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `crm_auth_sessions`
  ADD CONSTRAINT `fk_crm_auth_sessions_user_id`
  FOREIGN KEY (`userId`) REFERENCES `crm_users`(`userId`)
  ON DELETE CASCADE ON UPDATE CASCADE;
