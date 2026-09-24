-- 为历史普通用户补齐前缀；管理员按已确认的历史主键定位，不根据用户名授予身份。
-- crm_auth_sessions.userId 的 ON UPDATE CASCADE 自动同步关联记录。
-- 撤销受影响的会话，旧 JWT 中的 sub 不再匹配新主键，用户需要重新登录。
START TRANSACTION;

SET @user_id_migration_time = CAST(UNIX_TIMESTAMP(CURRENT_TIMESTAMP(3)) * 1000 AS UNSIGNED);

UPDATE `crm_auth_sessions` AS sessions
INNER JOIN `crm_users` AS users ON users.`userId` = sessions.`userId`
SET sessions.`revokedAt` = @user_id_migration_time,
    sessions.`updateTime` = @user_id_migration_time
WHERE sessions.`revokedAt` IS NULL
  AND (
    users.`userId` REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    OR users.`userId` = 'crm_user_01a05a9f-6991-72cd-ad6d-47ec8f9686f6'
  );

UPDATE `crm_users`
SET `userId` = CASE
      WHEN `userId` = 'crm_user_01a05a9f-6991-72cd-ad6d-47ec8f9686f6'
        THEN 'crm_admin_01a05a9f-6991-72cd-ad6d-47ec8f9686f6'
      ELSE CONCAT('crm_user_', `userId`)
    END,
    `updateTime` = @user_id_migration_time
WHERE `userId` REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
   OR `userId` = 'crm_user_01a05a9f-6991-72cd-ad6d-47ec8f9686f6';

COMMIT;
