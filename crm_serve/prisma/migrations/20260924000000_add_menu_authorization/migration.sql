-- Existing administrator is assigned once by the user's explicit request.
-- Runtime authorization uses the protected role, never username or ID prefixes.
ALTER TABLE `crm_roles` ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE `crm_menus` (
  `menuId` VARCHAR(64) NOT NULL,
  `parentId` VARCHAR(64) NULL,
  `menuType` VARCHAR(16) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `permissionCode` VARCHAR(128) NOT NULL,
  `routePath` VARCHAR(255) NULL,
  `componentKey` VARCHAR(128) NULL,
  `icon` VARCHAR(64) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `visible` BOOLEAN NOT NULL DEFAULT true,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `createTime` BIGINT UNSIGNED NOT NULL,
  `updateTime` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`menuId`),
  UNIQUE INDEX `crm_menus_permissionCode_key` (`permissionCode`),
  UNIQUE INDEX `crm_menus_routePath_key` (`routePath`),
  UNIQUE INDEX `crm_menus_componentKey_key` (`componentKey`),
  INDEX `crm_menus_parentId_sortOrder_idx` (`parentId`, `sortOrder`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crm_menu_actions` (
  `actionId` VARCHAR(64) NOT NULL,
  `menuId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `permissionCode` VARCHAR(128) NOT NULL,
  `actionKey` VARCHAR(64) NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `createTime` BIGINT UNSIGNED NOT NULL,
  `updateTime` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`actionId`),
  UNIQUE INDEX `crm_menu_actions_permissionCode_key` (`permissionCode`),
  UNIQUE INDEX `crm_menu_actions_menuId_actionKey_key` (`menuId`, `actionKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crm_api_permission_rules` (
  `ruleId` VARCHAR(64) NOT NULL,
  `actionId` VARCHAR(64) NOT NULL,
  `httpMethod` VARCHAR(8) NOT NULL,
  `path` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`ruleId`),
  UNIQUE INDEX `crm_api_permission_rules_httpMethod_path_key` (`httpMethod`, `path`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crm_role_menus` (
  `roleId` VARCHAR(64) NOT NULL, `menuId` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`roleId`, `menuId`), INDEX `crm_role_menus_menuId_idx` (`menuId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `crm_role_menu_actions` (
  `roleId` VARCHAR(64) NOT NULL, `actionId` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`roleId`, `actionId`), INDEX `crm_role_menu_actions_actionId_idx` (`actionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `crm_authorization_state` (
  `id` INTEGER NOT NULL, `revision` BIGINT UNSIGNED NOT NULL DEFAULT 1, PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `crm_permission_audits` (
  `auditId` VARCHAR(64) NOT NULL, `actorId` VARCHAR(64) NOT NULL,
  `operation` VARCHAR(64) NOT NULL, `targetId` VARCHAR(64) NOT NULL,
  `detail` JSON NOT NULL, `createTime` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`auditId`), INDEX `crm_permission_audits_createTime_idx` (`createTime`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `crm_menus` ADD CONSTRAINT `crm_menus_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `crm_menus`(`menuId`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `crm_menu_actions` ADD CONSTRAINT `crm_menu_actions_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `crm_menus`(`menuId`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `crm_api_permission_rules` ADD CONSTRAINT `crm_api_permission_rules_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `crm_menu_actions`(`actionId`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `crm_role_menus` ADD CONSTRAINT `crm_role_menus_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `crm_roles`(`roleId`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `crm_role_menus` ADD CONSTRAINT `crm_role_menus_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `crm_menus`(`menuId`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `crm_role_menu_actions` ADD CONSTRAINT `crm_role_menu_actions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `crm_roles`(`roleId`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `crm_role_menu_actions` ADD CONSTRAINT `crm_role_menu_actions_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `crm_menu_actions`(`actionId`) ON DELETE CASCADE ON UPDATE CASCADE;

START TRANSACTION;
SET @now = CAST(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000 AS UNSIGNED);
INSERT INTO `crm_authorization_state` (`id`, `revision`) VALUES (1, 1);
INSERT INTO `crm_roles` (`roleId`, `roleName`, `roleCode`, `roleStatus`, `remark`, `createTime`, `updateTime`, `isSystem`)
VALUES ('crm_role_platform_admin', '平台管理员', 'platform_super_admin', 1, '系统保留角色，拥有全部权限', @now, @now, true);
INSERT INTO `crm_user_roles` (`userId`, `roleId`, `createTime`)
SELECT `userId`, 'crm_role_platform_admin', @now FROM `crm_users` WHERE BINARY `username` = 'admin';

INSERT INTO crm_menus (menuId,parentId,menuType,name,permissionCode,routePath,componentKey,icon,sortOrder,visible,enabled,createTime,updateTime) VALUES ('crm_menu_system',NULL,'DIRECTORY','系统管理','system',NULL,NULL,'Setting',20,true,true,@now,@now);
INSERT INTO crm_menus (menuId,parentId,menuType,name,permissionCode,routePath,componentKey,icon,sortOrder,visible,enabled,createTime,updateTime) VALUES ('crm_menu_users','crm_menu_system','PAGE','用户管理','system:users','/system/users','system-users','User',10,true,true,@now,@now);
INSERT INTO crm_menus (menuId,parentId,menuType,name,permissionCode,routePath,componentKey,icon,sortOrder,visible,enabled,createTime,updateTime) VALUES ('crm_menu_roles','crm_menu_system','PAGE','角色管理','system:roles','/system/roles','system-roles','UserFilled',20,true,true,@now,@now);
INSERT INTO crm_menus (menuId,parentId,menuType,name,permissionCode,routePath,componentKey,icon,sortOrder,visible,enabled,createTime,updateTime) VALUES ('crm_menu_menus','crm_menu_system','PAGE','菜单管理','system:menus','/system/menus','system-menus','Menu',30,true,true,@now,@now);
INSERT INTO crm_menus (menuId,parentId,menuType,name,permissionCode,routePath,componentKey,icon,sortOrder,visible,enabled,createTime,updateTime) VALUES ('crm_menu_customer',NULL,'PAGE','客户管理','customer:view','/customer','customer-list','OfficeBuilding',30,true,true,@now,@now);
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_users_view','crm_menu_users','查看用户','system:users:view','view',0,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_view_0','crm_action_users_view','GET','/users/list');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_view_1','crm_action_users_view','GET','/users/onlineStatus');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_view_2','crm_action_users_view','GET','/users/selectList');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_users_create','crm_menu_users','新增用户','system:users:create','create',10,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_create_0','crm_action_users_create','POST','/users/create');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_users_edit','crm_menu_users','编辑用户','system:users:edit','edit',20,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_edit_0','crm_action_users_edit','PATCH','/users/update');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_users_updateAccountStatus','crm_menu_users','修改账号状态','system:users:updateAccountStatus','updateAccountStatus',30,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_updateAccountStatus_0','crm_action_users_updateAccountStatus','PATCH','/users/updateAccountStatus');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_users_delete','crm_menu_users','删除用户','system:users:delete','delete',40,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_delete_0','crm_action_users_delete','DELETE','/users/delete');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_users_batchDelete','crm_menu_users','批量删除用户','system:users:batchDelete','batchDelete',50,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_batchDelete_0','crm_action_users_batchDelete','DELETE','/users/batchDelete');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_users_logout','crm_menu_users','强制登出','system:users:logout','logout',60,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_logout_0','crm_action_users_logout','POST','/users/logout');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_users_assignRoles','crm_menu_users','分配角色','system:users:assignRoles','assignRoles',70,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_assignRoles_0','crm_action_users_assignRoles','GET','/users/roles');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_assignRoles_1','crm_action_users_assignRoles','PATCH','/users/assignRoles');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_users_assignRoles_2','crm_action_users_assignRoles','GET','/roles/selectList');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_roles_view','crm_menu_roles','查看角色','system:roles:view','view',0,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_view_0','crm_action_roles_view','GET','/roles/list');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_view_1','crm_action_roles_view','GET','/roles/detail');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_roles_create','crm_menu_roles','新增角色','system:roles:create','create',10,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_create_0','crm_action_roles_create','POST','/roles/create');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_roles_edit','crm_menu_roles','编辑角色','system:roles:edit','edit',20,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_edit_0','crm_action_roles_edit','PATCH','/roles/update');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_roles_updateRoleStatus','crm_menu_roles','修改角色状态','system:roles:updateRoleStatus','updateRoleStatus',30,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_updateRoleStatus_0','crm_action_roles_updateRoleStatus','PATCH','/roles/updateRoleStatus');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_roles_delete','crm_menu_roles','删除角色','system:roles:delete','delete',40,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_delete_0','crm_action_roles_delete','DELETE','/roles/delete');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_roles_batchDelete','crm_menu_roles','批量删除角色','system:roles:batchDelete','batchDelete',50,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_batchDelete_0','crm_action_roles_batchDelete','DELETE','/roles/batchDelete');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_roles_assignPermissions','crm_menu_roles','分配权限','system:roles:assignPermissions','assignPermissions',60,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_assignPermissions_0','crm_action_roles_assignPermissions','GET','/roles/permissions');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_assignPermissions_1','crm_action_roles_assignPermissions','GET','/roles/permissionTree');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_roles_assignPermissions_2','crm_action_roles_assignPermissions','PATCH','/roles/updatePermissions');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_menus_view','crm_menu_menus','查看菜单','system:menus:view','view',0,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_view_0','crm_action_menus_view','GET','/menus/list');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_view_1','crm_action_menus_view','GET','/menus/tree');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_view_2','crm_action_menus_view','GET','/menus/actions/list');
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_view_3','crm_action_menus_view','GET','/menus/endpoints');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_menus_create','crm_menu_menus','新增菜单','system:menus:create','create',10,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_create_0','crm_action_menus_create','POST','/menus/create');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_menus_edit','crm_menu_menus','编辑菜单','system:menus:edit','edit',20,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_edit_0','crm_action_menus_edit','PATCH','/menus/update');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_menus_delete','crm_menu_menus','删除菜单','system:menus:delete','delete',30,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_delete_0','crm_action_menus_delete','DELETE','/menus/delete');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_menus_batchDelete','crm_menu_menus','批量删除菜单','system:menus:batchDelete','batchDelete',40,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_batchDelete_0','crm_action_menus_batchDelete','DELETE','/menus/batchDelete');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_menus_createAction','crm_menu_menus','新增按钮','system:menus:createAction','createAction',50,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_createAction_0','crm_action_menus_createAction','POST','/menus/actions/create');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_menus_editAction','crm_menu_menus','编辑按钮','system:menus:editAction','editAction',60,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_editAction_0','crm_action_menus_editAction','PATCH','/menus/actions/update');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_menus_deleteAction','crm_menu_menus','删除按钮','system:menus:deleteAction','deleteAction',70,true,@now,@now);
INSERT INTO crm_api_permission_rules (ruleId,actionId,httpMethod,path) VALUES ('crm_rule_menus_deleteAction_0','crm_action_menus_deleteAction','DELETE','/menus/actions/delete');
INSERT INTO crm_menu_actions (actionId,menuId,name,permissionCode,actionKey,sortOrder,enabled,createTime,updateTime) VALUES ('crm_action_customer_view','crm_menu_customer','查看客户','customer:details:view','view',0,true,@now,@now);
COMMIT;
