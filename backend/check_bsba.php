<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=EduCore', 'root', '');

// Get BSBA-1A section details
echo "=== BSBA-1A Details ===\n";
$stmt = $pdo->query("SELECT s.id, s.section_code, s.program_id, s.academic_year_id 
                     FROM sections s 
                     WHERE s.section_code = 'BSBA-1A'");
$section = $stmt->fetch();
if ($section) {
    echo "Section ID: " . $section['id'] . "\n";
    echo "Program ID: " . $section['program_id'] . "\n";
    echo "Academic Year ID: " . $section['academic_year_id'] . "\n";
    
    $section_id = $section['id'];
    
    // Get classes for this section
    echo "\nClasses in BSBA-1A:\n";
    $stmt = $pdo->prepare("SELECT c.id, c.class_code, s.subject_code 
                          FROM classes c 
                          JOIN subjects s ON c.subject_id = s.id 
                          WHERE c.section_id = ?");
    $stmt->execute([$section_id]);
    foreach ($stmt as $class) {
        echo "  Class ID: " . $class['id'] . " | Code: " . $class['class_code'] . " | Subject: " . $class['subject_code'] . "\n";
    }
    
    // Get enrollments
    echo "\nEnrollments in BSBA-1A:\n";
    $stmt = $pdo->prepare("SELECT e.id, e.student_id, e.status, st.student_number, st.first_name, st.last_name 
                          FROM enrollments e 
                          JOIN students st ON e.student_id = st.id 
                          JOIN classes c ON e.class_id = c.id 
                          WHERE c.section_id = ?");
    $stmt->execute([$section_id]);
    $count = 0;
    foreach ($stmt as $enroll) {
        echo "  Student: " . $enroll['student_number'] . " - " . $enroll['first_name'] . " " . $enroll['last_name'] . " | Status: " . $enroll['status'] . "\n";
        $count++;
    }
    echo "Total enrollments: " . $count . "\n";
} else {
    echo "Section not found\n";
}
