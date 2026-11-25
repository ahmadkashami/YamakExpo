<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=yamak_integration_test", "root", "");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Check all service requests
echo "=== All Service Requests ===\n";
$stmt = $pdo->query("SELECT * FROM service_requests");
$requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total requests: " . count($requests) . "\n";
foreach ($requests as $r) {
    echo "id: {$r['id']}, channel: {$r['channel']}, status: {$r['status']}, app_user_id: {$r['app_user_id']}\n";
}

// Check app_users fully
echo "\n=== All App Users ===\n";
$stmt = $pdo->query("SELECT * FROM app_users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo "id: {$u['id']}, email: {$u['email']}, status: {$u['status']}, created_at: {$u['created_at']}\n";
}

// Check service_request_status_histories
echo "\n=== All Service Request Status Histories ===\n";
$stmt = $pdo->query("SELECT * FROM service_request_status_histories");
$histories = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total history entries: " . count($histories) . "\n";
foreach ($histories as $h) {
    echo "id: {$h['id']}, service_request_id: {$h['service_request_id']}, from: {$h['from_status']}, to: {$h['to_status']}, actor: {$h['actor_type']}, reason_note: {$h['reason_note']}\n";
}

// Check request_idempotency_keys
echo "\n=== All Idempotency Keys ===\n";
$stmt = $pdo->query("SELECT * FROM request_idempotency_keys");
$keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total keys: " . count($keys) . "\n";
foreach ($keys as $k) {
    echo "id: {$k['id']}, idempotency_key: {$k['idempotency_key']}, service_request_id: {$k['service_request_id']}\n";
}

// Check request_reasons
echo "\n=== All Request Reasons ===\n";
$stmt = $pdo->query("SELECT * FROM request_reasons");
$reasons = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total reasons: " . count($reasons) . "\n";
foreach ($reasons as $r) {
    echo "id: {$r['id']}, code: {$r['code']}, label: {$r['label_en']}\n";
}

// Check service_request_service pivot
echo "\n=== Service Request Services ===\n";
$stmt = $pdo->query("SELECT * FROM request_service");
$services = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total entries: " . count($services) . "\n";
foreach ($services as $s) {
    echo "id: {$s['id']}, service_request_id: {$s['service_request_id']}, service_id: {$s['service_id']}\n";
}

// Check companies and branches
echo "\n=== Companies ===\n";
$stmt = $pdo->query("SELECT * FROM companies");
$companies = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total companies: " . count($companies) . "\n";
foreach ($companies as $c) {
    echo "id: {$c['id']}, name: {$c['name']['en']}\n";
}

echo "\n=== Branches ===\n";
$stmt = $pdo->query("SELECT * FROM branches");
$branches = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total branches: " . count($branches) . "\n";
foreach ($branches as $b) {
    echo "id: {$b['id']}, name: {$b['name']['en']}, country_id: {$b['country_id']}\n";
}

echo "\n=== Done ===\n";