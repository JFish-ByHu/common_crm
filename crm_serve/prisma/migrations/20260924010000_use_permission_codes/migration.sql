-- Keep the menu foreign key indexed before removing the old action-key index.
CREATE INDEX `crm_menu_actions_menuId_idx` ON `crm_menu_actions`(`menuId`);
ALTER TABLE `crm_menu_actions`
  DROP INDEX `crm_menu_actions_menuId_actionKey_key`,
  DROP COLUMN `actionKey`;

-- Existing action IDs and role grants remain unchanged. Invalidate old snapshots.
UPDATE `crm_authorization_state` SET `revision` = `revision` + 1 WHERE `id` = 1;
