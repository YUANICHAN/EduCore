-- =====================================================================
-- EduCore: Assign Teacher Workloads + Align Students/Enrollments
-- Target DB: MySQL 8+
-- =====================================================================
-- Usage:
-- 1) Backup DB first.
-- 2) Set @target_academic_year_id.
-- 3) Run the script.
-- 4) Review post-check output.
-- =====================================================================

SET @target_academic_year_id := 1;
SET @strict_subject_coverage := 1;

-- =====================================================================
-- 1) PRE-CHECK AUDITS
-- =====================================================================

-- Active classes with no teacher
SELECT c.id, c.class_code, c.section_id, c.subject_id
FROM classes c
WHERE c.status = 'active'
  AND c.academic_year_id = @target_academic_year_id
  AND c.teacher_id IS NULL;

-- Class mismatch: subject program vs section program
SELECT c.id, c.class_code, s.program_id AS subject_program_id, sec.program_id AS section_program_id
FROM classes c
JOIN subjects s ON s.id = c.subject_id
JOIN sections sec ON sec.id = c.section_id
WHERE c.academic_year_id = @target_academic_year_id
  AND s.program_id <> sec.program_id;

-- Student mismatch: student program vs section program
SELECT st.id AS student_id, st.student_number, st.program_id AS student_program_id, sec.program_id AS section_program_id
FROM students st
JOIN sections sec ON sec.id = st.section_id
WHERE st.section_id IS NOT NULL
  AND st.program_id <> sec.program_id;

-- Enrollment mismatch against section/program/academic year
SELECT e.id AS enrollment_id, st.id AS student_id, c.id AS class_id
FROM enrollments e
JOIN students st ON st.id = e.student_id
JOIN classes c ON c.id = e.class_id
JOIN subjects sb ON sb.id = c.subject_id
WHERE e.status = 'enrolled'
  AND (
       st.section_id IS NULL
       OR c.section_id <> st.section_id
       OR sb.program_id <> st.program_id
       OR c.academic_year_id <> st.academic_year_id
      );

-- =====================================================================
-- 2) ASSIGN TEACHERS TO UNASSIGNED ACTIVE CLASSES
-- Rules:
-- - class must be active + unassigned
-- - subject.program_id must match section.program_id
-- - teacher employment_status must be active
-- - teacher specialization matches program_code or program_name
-- - assigning class must not exceed max_load
-- - choose teacher with lowest current load first
-- =====================================================================

DROP PROCEDURE IF EXISTS assign_teacher_workload;
DELIMITER $$

CREATE PROCEDURE assign_teacher_workload(IN p_target_ay BIGINT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_class_id BIGINT;
    DECLARE v_program_id BIGINT;
    DECLARE v_units INT;
    DECLARE v_teacher_id BIGINT;

    DECLARE class_cur CURSOR FOR
        SELECT c.id, s.program_id, COALESCE(s.units, 0) AS units
        FROM classes c
        JOIN subjects s ON s.id = c.subject_id
        JOIN sections sec ON sec.id = c.section_id
        WHERE c.status = 'active'
          AND c.academic_year_id = p_target_ay
          AND c.teacher_id IS NULL
          AND s.status = 'active'
          AND sec.status = 'active'
          AND s.program_id = sec.program_id
        ORDER BY c.id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN class_cur;

    read_loop: LOOP
        FETCH class_cur INTO v_class_id, v_program_id, v_units;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        SET v_teacher_id = NULL;

        SELECT t.id
        INTO v_teacher_id
        FROM teachers t
        JOIN programs p ON p.id = v_program_id
        WHERE t.employment_status = 'active'
          AND (
               UPPER(TRIM(COALESCE(t.specialization, ''))) = UPPER(TRIM(COALESCE(p.program_code, '')))
               OR UPPER(TRIM(COALESCE(t.specialization, ''))) = UPPER(TRIM(COALESCE(p.program_name, '')))
              )
          AND (
                COALESCE((
                    SELECT SUM(COALESCE(s2.units, 0))
                    FROM classes c2
                    JOIN subjects s2 ON s2.id = c2.subject_id
                    WHERE c2.teacher_id = t.id
                      AND c2.status = 'active'
                      AND c2.academic_year_id = p_target_ay
                ), 0) + v_units
              ) <= COALESCE(t.max_load, 24)
        ORDER BY
            COALESCE((
                SELECT SUM(COALESCE(s3.units, 0))
                FROM classes c3
                JOIN subjects s3 ON s3.id = c3.subject_id
                WHERE c3.teacher_id = t.id
                  AND c3.status = 'active'
                  AND c3.academic_year_id = p_target_ay
            ), 0) ASC,
            t.id ASC
        LIMIT 1;

        IF v_teacher_id IS NOT NULL THEN
            UPDATE classes
            SET teacher_id = v_teacher_id,
                updated_at = NOW()
            WHERE id = v_class_id;
        END IF;
    END LOOP;

    CLOSE class_cur;
END$$

DELIMITER ;

CALL assign_teacher_workload(@target_academic_year_id);

-- ---------------------------------------------------------------------
-- 2B) FORCE ASSIGN REMAINING ACTIVE UNASSIGNED CLASSES
-- Pass 1: respect max_load
-- Pass 2: ignore max_load (hard guarantee for assignment)
-- ---------------------------------------------------------------------

UPDATE classes c
SET c.teacher_id = (
    SELECT t.id
    FROM teachers t
    WHERE t.employment_status = 'active'
      AND (
            COALESCE((
                SELECT SUM(COALESCE(s2.units, 0))
                FROM classes c2
                JOIN subjects s2 ON s2.id = c2.subject_id
                WHERE c2.teacher_id = t.id
                  AND c2.status = 'active'
                  AND c2.academic_year_id = @target_academic_year_id
            ), 0)
          ) <= COALESCE(t.max_load, 24)
    ORDER BY
      COALESCE((
        SELECT SUM(COALESCE(s3.units, 0))
        FROM classes c3
        JOIN subjects s3 ON s3.id = c3.subject_id
        WHERE c3.teacher_id = t.id
          AND c3.status = 'active'
          AND c3.academic_year_id = @target_academic_year_id
      ), 0) ASC,
      t.id ASC
    LIMIT 1
),
c.updated_at = NOW()
WHERE c.status = 'active'
  AND c.academic_year_id = @target_academic_year_id
  AND c.teacher_id IS NULL;

UPDATE classes c
SET c.teacher_id = (
    SELECT t.id
    FROM teachers t
    WHERE t.employment_status = 'active'
    ORDER BY
      COALESCE((
        SELECT SUM(COALESCE(s3.units, 0))
        FROM classes c3
        JOIN subjects s3 ON s3.id = c3.subject_id
        WHERE c3.teacher_id = t.id
          AND c3.status = 'active'
          AND c3.academic_year_id = @target_academic_year_id
      ), 0) ASC,
      t.id ASC
    LIMIT 1
),
c.updated_at = NOW()
WHERE c.status = 'active'
  AND c.academic_year_id = @target_academic_year_id
  AND c.teacher_id IS NULL;

-- ---------------------------------------------------------------------
-- 2C) ENSURE EACH ACTIVE TEACHER HAS AT LEAST 1 ACTIVE CLASS (IF POSSIBLE)
-- Rebalances from teachers with >1 active classes in target AY.
-- ---------------------------------------------------------------------

DROP PROCEDURE IF EXISTS ensure_teacher_minimum_workload;
DELIMITER $$

CREATE PROCEDURE ensure_teacher_minimum_workload(IN p_target_ay BIGINT)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_teacher_id BIGINT;
    DECLARE v_specialization VARCHAR(255);
    DECLARE v_class_id BIGINT;

    DECLARE cur CURSOR FOR
        SELECT t.id, COALESCE(t.specialization, '')
        FROM teachers t
        WHERE t.employment_status = 'active'
          AND NOT EXISTS (
              SELECT 1
              FROM classes c
              WHERE c.teacher_id = t.id
                AND c.status = 'active'
                AND c.academic_year_id = p_target_ay
          )
        ORDER BY t.id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO v_teacher_id, v_specialization;
        IF done = 1 THEN
            LEAVE read_loop;
        END IF;

        SET v_class_id = NULL;

        -- Prefer donor class whose subject program matches teacher specialization
        SELECT c.id
          INTO v_class_id
        FROM classes c
        JOIN subjects s ON s.id = c.subject_id
        JOIN programs p ON p.id = s.program_id
        WHERE c.status = 'active'
          AND c.academic_year_id = p_target_ay
          AND c.teacher_id IS NOT NULL
          AND (
                SELECT COUNT(*)
                FROM classes c2
                WHERE c2.teacher_id = c.teacher_id
                  AND c2.status = 'active'
                  AND c2.academic_year_id = p_target_ay
              ) > 1
          AND (
                UPPER(TRIM(COALESCE(v_specialization, ''))) = UPPER(TRIM(COALESCE(p.program_code, '')))
                OR UPPER(TRIM(COALESCE(v_specialization, ''))) = UPPER(TRIM(COALESCE(p.program_name, '')))
              )
        ORDER BY
          (
            SELECT COUNT(*)
            FROM classes c3
            WHERE c3.teacher_id = c.teacher_id
              AND c3.status = 'active'
              AND c3.academic_year_id = p_target_ay
          ) DESC,
          c.id ASC
        LIMIT 1;

        -- Fallback: any donor class from teacher with >1 active classes
        IF v_class_id IS NULL THEN
            SELECT c.id
              INTO v_class_id
            FROM classes c
            WHERE c.status = 'active'
              AND c.academic_year_id = p_target_ay
              AND c.teacher_id IS NOT NULL
              AND (
                    SELECT COUNT(*)
                    FROM classes c2
                    WHERE c2.teacher_id = c.teacher_id
                      AND c2.status = 'active'
                      AND c2.academic_year_id = p_target_ay
                  ) > 1
            ORDER BY
              (
                SELECT COUNT(*)
                FROM classes c3
                WHERE c3.teacher_id = c.teacher_id
                  AND c3.status = 'active'
                  AND c3.academic_year_id = p_target_ay
              ) DESC,
              c.id ASC
            LIMIT 1;
        END IF;

        IF v_class_id IS NOT NULL THEN
            UPDATE classes
            SET teacher_id = v_teacher_id,
                updated_at = NOW()
            WHERE id = v_class_id;
        END IF;
    END LOOP;

    CLOSE cur;
END$$

DELIMITER ;

CALL ensure_teacher_minimum_workload(@target_academic_year_id);

-- ---------------------------------------------------------------------
-- 2D) AUTO-CREATE MISSING ACTIVE CLASSES FOR ACTIVE SUBJECTS
-- Creates one active class per (section, subject, academic year) when missing,
-- limited to matching program and grade_level.
-- ---------------------------------------------------------------------

INSERT INTO classes (
    class_code,
    subject_id,
    teacher_id,
    section_id,
    academic_year_id,
    schedule,
    capacity,
    enrolled_count,
    status,
    created_at,
    updated_at
)
SELECT
    LEFT(
        CONCAT(
            'AUTO-',
            COALESCE(sec.section_code, sec.id), '-',
            COALESCE(sb.subject_code, sb.id), '-',
            @target_academic_year_id
        ),
        50
    ) AS class_code,
    sb.id AS subject_id,
    NULL AS teacher_id,
    sec.id AS section_id,
    @target_academic_year_id AS academic_year_id,
    NULL AS schedule,
    COALESCE(sec.capacity, 30) AS capacity,
    0 AS enrolled_count,
    'active' AS status,
    NOW() AS created_at,
    NOW() AS updated_at
FROM sections sec
JOIN subjects sb
  ON sb.program_id = sec.program_id
 AND sb.status = 'active'
 AND sb.grade_level = sec.grade_level
WHERE sec.status = 'active'
  AND sec.academic_year_id = @target_academic_year_id
  AND NOT EXISTS (
      SELECT 1
      FROM classes c
      WHERE c.section_id = sec.id
        AND c.subject_id = sb.id
        AND c.academic_year_id = @target_academic_year_id
  );

-- Assign teachers for any newly created classes
CALL assign_teacher_workload(@target_academic_year_id);

UPDATE classes c
SET c.teacher_id = (
    SELECT t.id
    FROM teachers t
    WHERE t.employment_status = 'active'
    ORDER BY
      COALESCE((
        SELECT SUM(COALESCE(s3.units, 0))
        FROM classes c3
        JOIN subjects s3 ON s3.id = c3.subject_id
        WHERE c3.teacher_id = t.id
          AND c3.status = 'active'
          AND c3.academic_year_id = @target_academic_year_id
      ), 0) ASC,
      t.id ASC
    LIMIT 1
),
c.updated_at = NOW()
WHERE c.status = 'active'
  AND c.academic_year_id = @target_academic_year_id
  AND c.teacher_id IS NULL;

CALL ensure_teacher_minimum_workload(@target_academic_year_id);

-- ---------------------------------------------------------------------
-- 2E) STRICT SUBJECT COVERAGE (OPTIONAL)
-- If enabled, ensures every active subject has at least one active class
-- with assigned teacher in target academic year.
-- Strategy:
--   1) Create fallback sections when no matching section exists.
--   2) Create missing classes for uncovered active subjects.
--   3) Re-run teacher assignment/rebalance.
-- ---------------------------------------------------------------------

-- 2E-1: Create fallback sections for active subjects lacking any section
INSERT INTO sections (
    section_code,
    program_id,
    grade_level,
    academic_year_id,
    capacity,
    adviser_id,
    room_number,
    status,
    created_at,
    updated_at
)
SELECT
    LEFT(CONCAT('AUTO-', p.program_code, '-', REPLACE(sb.grade_level, ' ', ''), '-', @target_academic_year_id), 50) AS section_code,
    sb.program_id,
    sb.grade_level,
    @target_academic_year_id,
    30,
    NULL,
    'TBA',
    'active',
    NOW(),
    NOW()
FROM subjects sb
JOIN programs p ON p.id = sb.program_id
WHERE @strict_subject_coverage = 1
  AND sb.status = 'active'
  AND NOT EXISTS (
      SELECT 1
      FROM sections sec
      WHERE sec.program_id = sb.program_id
        AND sec.grade_level = sb.grade_level
        AND sec.academic_year_id = @target_academic_year_id
        AND sec.status = 'active'
  );

-- 2E-2: For any remaining uncovered active subject, create at least one class
INSERT INTO classes (
    class_code,
    subject_id,
    teacher_id,
    section_id,
    academic_year_id,
    schedule,
    capacity,
    enrolled_count,
    status,
    created_at,
    updated_at
)
SELECT
    LEFT(CONCAT('AUTO-SUBJ-', sb.subject_code, '-', @target_academic_year_id), 50) AS class_code,
    sb.id AS subject_id,
    NULL AS teacher_id,
    (
      SELECT MIN(sec2.id)
      FROM sections sec2
      WHERE sec2.program_id = sb.program_id
        AND sec2.grade_level = sb.grade_level
        AND sec2.academic_year_id = @target_academic_year_id
        AND sec2.status = 'active'
    ) AS section_id,
    @target_academic_year_id AS academic_year_id,
    NULL AS schedule,
    30 AS capacity,
    0 AS enrolled_count,
    'active' AS status,
    NOW() AS created_at,
    NOW() AS updated_at
FROM subjects sb
WHERE @strict_subject_coverage = 1
  AND sb.status = 'active'
  AND EXISTS (
      SELECT 1
      FROM sections sec
      WHERE sec.program_id = sb.program_id
        AND sec.grade_level = sb.grade_level
        AND sec.academic_year_id = @target_academic_year_id
        AND sec.status = 'active'
  )
  AND NOT EXISTS (
      SELECT 1
      FROM classes c
      WHERE c.subject_id = sb.id
        AND c.academic_year_id = @target_academic_year_id
        AND c.status = 'active'
  );

CALL assign_teacher_workload(@target_academic_year_id);

UPDATE classes c
SET c.teacher_id = (
    SELECT t.id
    FROM teachers t
    WHERE t.employment_status = 'active'
    ORDER BY
      COALESCE((
        SELECT SUM(COALESCE(s3.units, 0))
        FROM classes c3
        JOIN subjects s3 ON s3.id = c3.subject_id
        WHERE c3.teacher_id = t.id
          AND c3.status = 'active'
          AND c3.academic_year_id = @target_academic_year_id
      ), 0) ASC,
      t.id ASC
    LIMIT 1
),
c.updated_at = NOW()
WHERE @strict_subject_coverage = 1
  AND c.status = 'active'
  AND c.academic_year_id = @target_academic_year_id
  AND c.teacher_id IS NULL;

CALL ensure_teacher_minimum_workload(@target_academic_year_id);

DROP PROCEDURE IF EXISTS assign_teacher_workload;
DROP PROCEDURE IF EXISTS ensure_teacher_minimum_workload;

-- =====================================================================
-- 3) ALIGN STUDENTS TO SECTIONS (program + year)
-- =====================================================================

UPDATE students st
JOIN sections sec ON sec.id = st.section_id
SET st.program_id = sec.program_id,
    st.grade_level = sec.grade_level,
    st.updated_at = NOW()
WHERE st.section_id IS NOT NULL
  AND (
       st.program_id <> sec.program_id
       OR COALESCE(st.grade_level, '') <> COALESCE(sec.grade_level, '')
      );

UPDATE students
SET enrollment_status = 'unassigned',
    updated_at = NOW()
WHERE section_id IS NULL
  AND enrollment_status <> 'unassigned';

-- =====================================================================
-- 4) ENROLLMENT ALIGNMENT
-- - delete invalid enrolled rows
-- - create missing enrolled rows for student's active section classes
-- - enforce subject grade_level = section grade_level during insert
-- =====================================================================

START TRANSACTION;

DELETE e
FROM enrollments e
JOIN students st ON st.id = e.student_id
JOIN classes c ON c.id = e.class_id
JOIN subjects sb ON sb.id = c.subject_id
WHERE e.status = 'enrolled'
  AND (
       st.section_id IS NULL
       OR c.section_id <> st.section_id
       OR sb.program_id <> st.program_id
       OR c.academic_year_id <> st.academic_year_id
      );

INSERT INTO enrollments (
    student_id,
    class_id,
    enrollment_date,
    status,
    created_at,
    updated_at
)
SELECT
    st.id AS student_id,
    c.id AS class_id,
    CURDATE() AS enrollment_date,
    'enrolled' AS status,
    NOW() AS created_at,
    NOW() AS updated_at
FROM students st
JOIN sections sec ON sec.id = st.section_id
JOIN classes c ON c.section_id = sec.id
JOIN subjects sb ON sb.id = c.subject_id
LEFT JOIN enrollments e
       ON e.student_id = st.id
      AND e.class_id = c.id
WHERE st.section_id IS NOT NULL
  AND st.program_id = sec.program_id
  AND st.academic_year_id = @target_academic_year_id
  AND c.academic_year_id = @target_academic_year_id
  AND c.status = 'active'
  AND c.teacher_id IS NOT NULL
  AND sb.program_id = st.program_id
  AND sb.grade_level = sec.grade_level
  AND e.id IS NULL;

UPDATE classes c
LEFT JOIN (
    SELECT class_id, COUNT(*) AS cnt
    FROM enrollments
    WHERE status = 'enrolled'
    GROUP BY class_id
) x ON x.class_id = c.id
SET c.enrolled_count = COALESCE(x.cnt, 0),
    c.updated_at = NOW();

COMMIT;

-- =====================================================================
-- 5) POST-CHECK
-- =====================================================================

SELECT COUNT(*) AS unassigned_active_classes
FROM classes
WHERE status = 'active'
  AND academic_year_id = @target_academic_year_id
  AND teacher_id IS NULL;

SELECT COUNT(*) AS active_teachers_without_workload
FROM teachers t
WHERE t.employment_status = 'active'
  AND NOT EXISTS (
      SELECT 1
      FROM classes c
      WHERE c.teacher_id = t.id
        AND c.status = 'active'
        AND c.academic_year_id = @target_academic_year_id
  );

SELECT COUNT(*) AS active_subjects_without_assigned_class
FROM subjects s
WHERE s.status = 'active'
  AND NOT EXISTS (
      SELECT 1
      FROM classes c
      WHERE c.subject_id = s.id
        AND c.status = 'active'
        AND c.academic_year_id = @target_academic_year_id
        AND c.teacher_id IS NOT NULL
  );

SELECT COUNT(*) AS invalid_enrollments_remaining
FROM enrollments e
JOIN students st ON st.id = e.student_id
JOIN classes c ON c.id = e.class_id
JOIN subjects sb ON sb.id = c.subject_id
WHERE e.status = 'enrolled'
  AND (
       st.section_id IS NULL
       OR c.section_id <> st.section_id
       OR sb.program_id <> st.program_id
       OR c.academic_year_id <> st.academic_year_id
      );
