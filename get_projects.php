<?php 

require 'testrail.php';

$params = json_decode(file_get_contents('php://input'),true);


$client = new TestRailAPIClient('https://ecflow.testrail.net/');
$client->set_user($params["login"]);
$client->set_password($params["password"]);

try {
	$projects = $client->send_get('get_projects');
	echo json_encode($projects);
} catch(TestRailAPIException $e) {
	header(':', true, 400);
	echo $e->getMessage();
}
 ?>

