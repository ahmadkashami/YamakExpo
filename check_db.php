<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=yamak_integration_test", "root", "");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Check 24 applied migrations - check for migration table
echo "=== Database Tables ===\n";
$stmt = $pdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "Total tables: " . count($tables) . "\n";
foreach ($tables as $table) {
    echo "- $table\n";
}

// Check for migrations table
if (in_array('migrations', $tables)) {
    echo "\n=== Migrations Table ===\n";
    $stmt = $pdo->query("SELECT * FROM migrations ORDER BY batch");
    $migrations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($migrations as $m) {
        echo "{$m['batch']}: {$m['migration']}\n";
    }
}

// Check Service Request #2
echo "\n=== Service Requests ===\n";
if (in_array('service_requests', $tables)) {
    $stmt = $pdo->query("SELECT * FROM service_requests WHERE id = 2");
    $request = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($request) {
        echo "id: " . $request['id'] . "\n";
        echo "channel: " . $request['channel'] . "\n";
        echo "status: " . $request['status'] . "\n";
    } else {
        echo "Service Request #2 not found!\n";
    }
} else {
    echo "service_requests table not found\n";
}

// Check history entries
echo "\n=== History ===\n";
$historyTable = in_array('service_request_status_histories', $tables);
if ($historyTable) {
    $stmt = $pdo->query("SELECT * FROM service_request_status_histories WHERE service_request_id = 2 ORDER BY created_at");
    $histories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "History entries for request #2: " . count($histories) . "\n";
    foreach ($histories as $h) {
        echo "  id: {$h['id']}, from: {$h['from_status']}, to: {$h['to_status']}, actor: {$h['actor_type']}\n";
    }
} else {
    echo "service_request_status_histories table not found\n";
}

// Check synthetic users (app users)
echo "\n=== App Users ===\n";
if (in_array('app_users', $tables)) {
    $stmt = $pdo->query("SELECT * FROM app_users LIMIT 5");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $u) {
        echo "id: {$u['id']}, email: {$u['email']}, status: {$u['status']}\n";
    }
} else {
    echo "app_users table not found\n";
}

// Check idempotency records
echo "\n=== Idempotency Keys ===\n";
if (in_array('request_idempotency_keys', $tables)) {
    $stmt = $pdo->query("SELECT * FROM request_idempotency_keys LIMIT 5");
    $keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($keys as $k) {
        echo "id: {$k['id']}, key: {$k['idempotency_key']}, request_id: {$k['service_request_id']}\n";
    }
} else {
    echo "request_idempotency_keys table not found\n";
}

// Check services
echo "\n=== Services ===\n";
if (in_array('services', $tables)) {
    $stmt = $pdo->query("SELECT * FROM services");
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($services as $s) {
        echo "id: {$s['id']}, name: {$s['name']['en']}, status: {$s['status']}\n";
    }
} else {
    echo "services table not found\n";
}

echo "\n=== Done ===\n";