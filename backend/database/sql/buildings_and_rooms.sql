-- Buildings and Rooms normalized schema (MySQL)
-- This script creates a buildings table and links rooms to it via rooms.building_id.

START TRANSACTION;

CREATE TABLE IF NOT EXISTS buildings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If you are creating rooms from scratch, use this:
CREATE TABLE IF NOT EXISTS rooms (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  building_id BIGINT UNSIGNED NOT NULL,
  room_number VARCHAR(50) NOT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT rooms_building_id_foreign FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE RESTRICT,
  UNIQUE KEY rooms_building_id_room_number_unique (building_id, room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If you already have a rooms table with a legacy `building` text column,
-- run this migration block instead (safe to run only once):
-- ALTER TABLE rooms ADD COLUMN building_id BIGINT UNSIGNED NULL;
-- INSERT INTO buildings(name, status)
-- SELECT DISTINCT r.building, 'active'
-- FROM rooms r
-- WHERE r.building IS NOT NULL AND r.building <> ''
-- ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
-- UPDATE rooms r
-- JOIN buildings b ON b.name = r.building
-- SET r.building_id = b.id
-- WHERE r.building_id IS NULL;
-- ALTER TABLE rooms
--   ADD CONSTRAINT rooms_building_id_foreign FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE RESTRICT,
--   ADD UNIQUE KEY rooms_building_id_room_number_unique (building_id, room_number);

COMMIT;
