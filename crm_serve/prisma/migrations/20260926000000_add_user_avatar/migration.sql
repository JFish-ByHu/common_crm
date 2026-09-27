ALTER TABLE `crm_users`
  ADD COLUMN `avatarFileId` VARCHAR(64) NULL,
  ADD UNIQUE INDEX `uk_crm_users_avatar_file` (`avatarFileId`),
  ADD CONSTRAINT `fk_crm_users_avatar_file` FOREIGN KEY (`avatarFileId`)
    REFERENCES `crm_files` (`fileId`) ON DELETE RESTRICT ON UPDATE CASCADE;
