<?php
try {
    $pdo = new PDO(
        'mysql:host=127.0.0.1;dbname=EduCore;port=3306',
        'root',
        ''
    );
    
    echo "=== ACADEMIC YEARS ===\n";
    $stmt = $pdo->query("SELECT id, year_code, semester FROM academic_years ORDER BY id DESC LIMIT 10");
    foreach ($stmt as $row) {
        echo "ID: {$row['id']} | Year Code: {$row['year_code']} | Semester: {$row['semester']}\n";
    }
    
    echo "\n=== SECTIONS ===\n";
    $stmt = $pdo->query("SELECT id, section_code, program_id, academic_year_id FROM sections WHERE section_code LIKE '%BSHM%' LIMIT 5");
    foreach ($stmt as $row) {
        echo "ID: {$row['id']} | Code: {$row['section_code']} | Program ID: {$row['program_id']} | AY ID: {$row['academic_year_id']}\n";
    }
    
    echo "\n=== PROGRAMS ===\n";
    $stmt = $pdo->query("SELECT id, program_code, program_name FROM programs WHERE program_code = 'BSHM'");
    foreach ($stmt as $row) {
        echo "ID: {$row['id']} | Code: {$row['program_code']} | Name: {$row['program_name']}\n";
    }
    
    echo "\n=== SUBJECTS (1st semester for BSHM) ===\n";
    $stmt = $pdo->query("SELECT id, subject_code, subject_name, semester, program_id FROM subjects WHERE program_id = (SELECT id FROM programs WHERE program_code = 'BSHM') AND semester = '1st' LIMIT 10");
    foreach ($stmt as $row) {
        echo "ID: {$row['id']} | Code: {$row['subject_code']} | Name: {$row['subject_name']} | Semester: {$row['semester']}\n";
    }
    
    echo "\n=== CLASSES (BSHM-1A, 2025-2026 1st, 1st semester) ===\n";
    // First get the section ID for BSHM-1A in 2025-2026 1st
    $sec_stmt = $pdo->query("SELECT s.id FROM sections s 
                            JOIN academic_years ay ON s.academic_year_id = ay.id 
                            WHERE s.section_code = 'BSHM-1A' AND ay.year_code = '2025-2026 1st'");
    $sec_row = $sec_stmt->fetch();
    
    if ($sec_row) {
        echo "Section ID for BSHM-1A in 2025-2026 1st: " . $sec_row['id'] . "\n";
        $section_id = $sec_row['id'];
        
        $stmt = $pdo->prepare("SELECT c.id, c.class_code, s.subject_code, s.semester 
                             FROM classes c 
                             JOIN subjects s ON c.subject_id = s.id 
                             WHERE c.section_id = ? AND s.semester = '1st'");
        $stmt->execute([$section_id]);
        echo "Classes found: " . $stmt->rowCount() . "\n";
        foreach ($stmt as $row) {
            echo "  Class ID: {$row['id']} | Code: {$row['class_code']} | Subject: {$row['subject_code']} | Semester: {$row['semester']}\n";
        }
    } else {
        echo "Section BSHM-1A not found in 2025-2026 1st\n";
    }
    
    echo "\n=== STUDENTS (enrollment_status = 'enrolled') ===\n";
    $stmt = $pdo->query("SELECT id, student_number, first_name, last_name, enrollment_status FROM students WHERE enrollment_status = 'enrolled' LIMIT 5");
    $count = $pdo->query("SELECT COUNT(*) as cnt FROM students WHERE enrollment_status = 'enrolled'")->fetch();
    echo "Total enrolled students: " . $count['cnt'] . "\n";
    
    echo "\n=== ENROLLMENTS (for BSHM-1A classes) ===\n";
    if ($sec_row) {
        $section_id = $sec_row['id'];
        $stmt = $pdo->prepare("SELECT COUNT(DISTINCT e.id) as cnt FROM enrollments e 
                             JOIN classes c ON e.class_id = c.id 
                             WHERE c.section_id = ? AND e.status = 'enrolled'");
        $stmt->execute([$section_id]);
        $result = $stmt->fetch();
        echo "Enrollments with status='enrolled': " . $result['cnt'] . "\n";
        
        // Also check for other statuses
        $stmt = $pdo->prepare("SELECT e.status, COUNT(*) as cnt FROM enrollments e 
                             JOIN classes c ON e.class_id = c.id 
                             WHERE c.section_id = ? 
                             GROUP BY e.status");
        $stmt->execute([$section_id]);
        echo "Enrollment status breakdown:\n";
        foreach ($stmt as $row) {
            echo "  {$row['status']}: {$row['cnt']}\n";
        }
    }
    
} catch (PDOException $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
