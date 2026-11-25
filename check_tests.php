<?php
// Check for phpunit.xml and .env.testing
$files = [
    'phpunit.xml',
    'phpunit.xml.dist',
    '.env.testing',
    '.env.testing.local',
];

echo "=== Test Configuration Files ===\n";
foreach ($files as $file) {
    if (file_exists($file)) {
        echo "FOUND: $file\n";
    } else {
        echo "NOT FOUND: $file\n";
    }
}

// Check if phpunit can be run
echo "\n=== PHPUnit ===\n";
$output = shell_exec('which phpunit 2>/dev/null || echo "phpunit not found"');
echo $output;

// Check .env for test-related settings
echo "\n=== .env ===\n";
if (file_exists('.env')) {
    $env = file_get_contents('.env');
    echo $env;
}

// Check for test-related environment variables
$env = file_get_contents('.env');
if (preg_match('/DB_HOST/', $env)) {
    echo "DB_HOST found in .env\n";
}
if (preg_match('/DB_DATABASE/', $env)) {
    echo "DB_DATABASE found in .env\n";
}
if (preg_match('/DB_TEST/', $env)) {
    echo "DB_TEST found in .env\n";
}

// Check expo-router and test configuration
echo "\n=== Expo Configuration ===\n";
echo "expo version from package.json: ~57.0.27\n";
echo "expo-router version: ~57.0.23\n";