-- The failed migration only added and populated these temporary columns.
-- Original DATETIME columns remain intact, so removing the temporary copies restores the pre-migration schema.
ALTER TABLE `crm_users`
  DROP COLUMN `createTimeMs`,
  DROP COLUMN `updateTimeMs`;
