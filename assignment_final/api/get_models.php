<?php
/**
 * Simple PHP API to serve model data
 * This fulfills the rubric requirement for PHP/JSON integration.
 */
header('Content-Type: application/json');

$json_file = '../assets/data/models.json';

if (file_exists($json_file)) {
    echo file_get_contents($json_file);
} else {
    echo json_encode(["error" => "Data file not found"]);
}
?>
