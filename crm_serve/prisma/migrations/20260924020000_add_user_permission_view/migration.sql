-- Register the new read-only capability without granting it to ordinary roles.
START TRANSACTION;
UPDATE `crm_authorization_state` SET `revision` = `revision` + 1 WHERE `id` = 1;
SET @now = CAST(ROUND(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000) AS UNSIGNED);

INSERT INTO `crm_menu_actions`
  (`actionId`, `menuId`, `name`, `permissionCode`, `sortOrder`, `enabled`, `createTime`, `updateTime`)
SELECT 'crm_action_users_viewPermissions', `menuId`, '查看权限', 'system:users:viewPermissions', 80, true, @now, @now
FROM `crm_menus` WHERE `componentKey` = 'system-users';

INSERT INTO `crm_api_permission_rules` (`ruleId`, `actionId`, `httpMethod`, `path`)
VALUES ('crm_rule_users_viewPermissions', 'crm_action_users_viewPermissions', 'GET', '/users/permissions');

INSERT INTO `crm_permission_audits`
  (`auditId`, `actorId`, `operation`, `targetId`, `detail`, `createTime`)
VALUES (
  'crm_audit_users_viewPermissions', 'system:migration', 'createAction',
  'crm_action_users_viewPermissions',
  JSON_OBJECT('permissionCode', 'system:users:viewPermissions', 'httpMethod', 'GET', 'path', '/users/permissions'),
  @now
);
COMMIT;
