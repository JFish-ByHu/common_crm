-- Existing DATETIME values are interpreted using the migration connection's session time zone.
-- Keep that session time zone consistent with the one used when the values were written.
ALTER TABLE `crm_users`
  ADD COLUMN `createTimeMs` BIGINT UNSIGNED NULL,
  ADD COLUMN `updateTimeMs` BIGINT UNSIGNED NULL;

UPDATE `crm_users`
SET
  `createTimeMs` = CAST(ROUND(UNIX_TIMESTAMP(`createTime`) * 1000) AS UNSIGNED),
  `updateTimeMs` = CAST(ROUND(UNIX_TIMESTAMP(`updateTime`) * 1000) AS UNSIGNED);

ALTER TABLE `crm_users`
  MODIFY COLUMN `createTimeMs` BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN `updateTimeMs` BIGINT UNSIGNED NOT NULL;

ALTER TABLE `crm_users`
  DROP COLUMN `createTime`,
  DROP COLUMN `updateTime`;

ALTER TABLE `crm_users`
  CHANGE COLUMN `createTimeMs` `createTime` BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN `updateTimeMs` `updateTime` BIGINT UNSIGNED NOT NULL;

ALTER TABLE `crm_auth_sessions`
  DROP INDEX `idx_crm_auth_sessions_expires_at`,
  ADD COLUMN `expiresAtMs` BIGINT UNSIGNED NULL,
  ADD COLUMN `revokedAtMs` BIGINT UNSIGNED NULL,
  ADD COLUMN `createTimeMs` BIGINT UNSIGNED NULL,
  ADD COLUMN `updateTimeMs` BIGINT UNSIGNED NULL;

UPDATE `crm_auth_sessions`
SET
  `expiresAtMs` = CAST(ROUND(UNIX_TIMESTAMP(`expiresAt`) * 1000) AS UNSIGNED),
  `revokedAtMs` = CASE
    WHEN `revokedAt` IS NULL THEN NULL
    ELSE CAST(ROUND(UNIX_TIMESTAMP(`revokedAt`) * 1000) AS UNSIGNED)
  END,
  `createTimeMs` = CAST(ROUND(UNIX_TIMESTAMP(`createTime`) * 1000) AS UNSIGNED),
  `updateTimeMs` = CAST(ROUND(UNIX_TIMESTAMP(`updateTime`) * 1000) AS UNSIGNED);

ALTER TABLE `crm_auth_sessions`
  MODIFY COLUMN `expiresAtMs` BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN `createTimeMs` BIGINT UNSIGNED NOT NULL,
  MODIFY COLUMN `updateTimeMs` BIGINT UNSIGNED NOT NULL;

ALTER TABLE `crm_auth_sessions`
  DROP COLUMN `expiresAt`,
  DROP COLUMN `revokedAt`,
  DROP COLUMN `createTime`,
  DROP COLUMN `updateTime`;

ALTER TABLE `crm_auth_sessions`
  CHANGE COLUMN `expiresAtMs` `expiresAt` BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN `revokedAtMs` `revokedAt` BIGINT UNSIGNED NULL,
  CHANGE COLUMN `createTimeMs` `createTime` BIGINT UNSIGNED NOT NULL,
  CHANGE COLUMN `updateTimeMs` `updateTime` BIGINT UNSIGNED NOT NULL,
  ADD INDEX `idx_crm_auth_sessions_expires_at`(`expiresAt`);
