<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=EduCore', 'root', '');

$stmt = $pdo->query('SELECT COUNT(*) as cnt FROM classes');
$result = $stmt->fetch();
echo 'Total classes: ' . $result['cnt'] . PHP_EOL;

$stmt = $pdo->query('SELECT COUNT(*) as cnt FROM enrollments');
$result = $stmt->fetch();
echo 'Total enrollments: ' . $result['cnt'] . PHP_EOL;

echo PHP_EOL . 'Classes by section:' . PHP_EOL;
$stmt = $pdo->query('SELECT s.section_code, COUNT(c.id) as class_count FROM classes c 
                     JOIN sections s ON c.section_id = s.id 
                     GROUP BY c.section_id, s.section_code');
foreach ($stmt as $row) {
    echo $row['section_code'] . ': ' . $row['class_count'] . PHP_EOL;
}
