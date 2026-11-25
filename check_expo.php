<?php
// This script checks Expo-related configuration
// We'll try to start the expo server and check the app flow

echo "=== Expo Configuration Check ===\n";
$pkg = json_decode(file_get_contents('package.json'), true);
echo "Expo version: " . ($pkg['dependencies']['expo'] ?? 'unknown') . "\n";
echo "Expo router version: " . ($pkg['dependencies']['expo-router'] ?? 'unknown') . "\n";
echo "\n.env file:\n";
$env = file_get_contents('.env');
echo $env;

// Check if there's a way to determine the API URL being used
if (preg_match('/EXPO_PUBLIC_API_URL=([^\n]+)/', $env, $matches)) {
    echo "API URL: " . $matches[1] . "\n";
}