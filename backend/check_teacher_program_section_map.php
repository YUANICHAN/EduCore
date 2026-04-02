<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=EduCore', 'root', '');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "--- BSBA-like teachers ---\n";
$sqlTeachers = "SELECT t.id,t.employee_id,t.first_name,t.last_name,t.department_id,t.specialization,d.code AS dept_code,d.name AS dept_name
FROM teachers t
LEFT JOIN departments d ON d.id=t.department_id
WHERE t.specialization LIKE '%BSBA%'
   OR d.code='BSBA'
   OR d.name LIKE '%Business%'
ORDER BY t.id";
foreach ($pdo->query($sqlTeachers) as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n--- Programs ---\n";
$sqlPrograms = "SELECT id,program_code,program_name,department_id,department
FROM programs
ORDER BY id";
foreach ($pdo->query($sqlPrograms) as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
}

echo "\n--- Sections + Program mapping (first 120) ---\n";
$sqlSections = "SELECT s.id,s.section_code,s.program_id,p.program_code,p.program_name,p.department_id,p.department
FROM sections s
LEFT JOIN programs p ON p.id=s.program_id
ORDER BY s.id
LIMIT 120";
foreach ($pdo->query($sqlSections) as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
}
