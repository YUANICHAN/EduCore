<?php
// Simple data check script
$dbPath = __DIR__ . '/database/eduCoreSQL.sql';
if (!file_exists($dbPath)) {
    die("SQL file not found");
}

// Try to connect to the database using .env
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    die('.env file not found');
}

foreach (file($envFile) as $line) {
    if (strpos($line, 'DB_') === 0) {
        echo $line;
    }
}
?>
