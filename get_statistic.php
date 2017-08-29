<?php 

require 'testrail.php';

$params = json_decode(file_get_contents('php://input'),true);

$client = new TestRailAPIClient('https://ecflow.testrail.net/');
$client->set_user($params["login"]);
$client->set_password($params["password"]);

try {
	$sections = $client->send_get("get_sections/" . $params["projectId"]);
} catch(TestRailAPIException $e) {
	header(':', true, 400);
	echo $e->getMessage();
	return;
}


usort($sections, function($a, $b) {
	return $a["depth"] < $b["depth"];
});

$sections_dict = array();

for ($i=0; $i < count($sections); $i++) { 
	$sections_dict[$sections[$i]["id"]] = array(
		"cases_number" => 0,
		"automated_cases_number" => 0,
		"cases_number" => 0,
		"automated_cases_number" => 0,
		"full_name" => $sections[$i]["name"],
		"depth" => $sections[$i]["depth"]
	);
}

try {
	$cases = $client->send_get('get_cases/' . $params["projectId"]); 
} catch(TestRailAPIException $e) {
	header(':', true, 400);
	echo $e->getMessage();
	return;
}

foreach ($cases as $case) {
	$sections_dict[$case["section_id"]]["cases_number"] += 1;
	if($case["custom_automated"]) {
		$sections_dict[$case["section_id"]]["automated_cases_number"] += 1;
	}
}
foreach ($sections as $section) {
	if ($section["parent_id"] != null) {
		$sections_dict[$section["parent_id"]]["cases_number"] += $sections_dict[$section["id"]]["cases_number"];
		$sections_dict[$section["parent_id"]]["automated_cases_number"] += $sections_dict[$section["id"]]["automated_cases_number"];
		$sections_dict[$section["id"]]["full_name"] = $sections_dict[$section["parent_id"]]["full_name"] . " - " . $sections_dict[$section["id"]]["full_name"];
	}
}

echo json_encode(array_values($sections_dict));

?>
