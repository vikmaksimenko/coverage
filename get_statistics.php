<?php 

require 'testrail.php';

$project_id = 1;

$client = new TestRailAPIClient('https://ecflow.testrail.net');
$client->set_user('..');
$client->set_password('..');
$sections = $client->send_get("get_sections/" . $project_id);

usort($sections, function($a, $b) {
	return $a["depth"] < $b["depth"];
});

$sections_dict = array();

for ($i=0; $i < count($sections); $i++) { 
	$sections_dict[$sections[$i]["id"]] = array(
		"cases_number" => 0,
		"automated_cases_number" => 0,
		"total_cases_number" => 0,
		"total_automated_cases_number" => 0,
		"full_name" => $sections[$i]["name"]
	);
}

$cases = $client->send_get('get_cases/' . $project_id); 

foreach ($cases as $case) {
	$sections_dict[$case["section_id"]]["total_cases_number"] += 1;
	if($case["custom_automated"]) {
		$sections_dict[$case["section_id"]]["total_automated_cases_number"] += 1;
	}
}

foreach ($sections as $section) {
	if ($section["parent_id"] != null) {
		$sections_dict[$section["parent_id"]]["total_cases_number"] += $sections_dict[$section["id"]]["total_cases_number"];
		$sections_dict[$section["parent_id"]]["total_automated_cases_number"] += $sections_dict[$section["id"]]["total_automated_cases_number"];
	}
}

echo json_encode($sections_dict);

 ?>