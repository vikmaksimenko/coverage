angular.module('coverage', ['ngMaterial', 'ngMessages'])
    .controller('MainCtrl', function($http) {
        var mainCtrl = this;

        mainCtrl.loading = false;
        mainCtrl.nesting = 1;

        mainCtrl.getProjects = function() {
            mainCtrl.loading = true;
            mainCtrl.loginError = null;
            $http.post("/coverage/get_projects.php", mainCtrl.creds)
                .then(function(resp) {
                    mainCtrl.projects = resp.data;
                    mainCtrl.loading = false;
                    mainCtrl.selected += 1;
                }, function(resp) {
                    mainCtrl.loading = false;
                    mainCtrl.loginError = resp.data;
                });
        }

        mainCtrl.getSections = function(projectId) {
            mainCtrl.project = _getProject(projectId);
            mainCtrl.loading = true;
            mainCtrl.projectsError = null;
            var data = angular.copy(mainCtrl.creds);
            data.projectId = projectId;

            $http.post("/coverage/get_statistic.php", data)
                .then(function(resp) {
                    mainCtrl.statistic = resp.data;
                    mainCtrl.loading = false;
                    mainCtrl.selected += 1;

                    mainCtrl.totals = _countTotals(mainCtrl.statistic);
                    mainCtrl.runChart();
                }, function(resp) {
                    mainCtrl.loading = false;
                    mainCtrl.projectsError = resp.data;
                });
        }

        mainCtrl.runChart = function() {
            mainCtrl.filtered = mainCtrl.statistic.filter(function(value) {
                return value.depth == mainCtrl.nesting - 1;
            });

            var labels = mainCtrl.filtered.reduce(function(acc, currentValue, index, array) {
                acc.push(currentValue["full_name"])
                return acc;
            }, []);

            var automated = mainCtrl.filtered.reduce(function(acc, currentValue, index, array) {
                acc.push(currentValue["automated_cases_number"]);
                return acc;
            }, []);

            var notAutomated = mainCtrl.filtered.reduce(function(acc, currentValue, index, array) {
                acc.push(currentValue["cases_number"] - currentValue["automated_cases_number"]);
                return acc;
            }, []);

            var chartData = {
                labels: labels,
                datasets: [{
                    label: "Automated Cases",
                    backgroundColor: "#FF80AB",
                    data: automated
                }, {
                    label: "Not Automated",
                    backgroundColor: "#3F51B5",
                    data: notAutomated
                }, ]
            };

            if (mainCtrl.chart) {
                mainCtrl.chart.destroy();
            }
            var ctx = document.getElementById("canvas").getContext("2d");
            mainCtrl.chart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    title: {
                        display: true,
                        text: mainCtrl.project.name + " - " + mainCtrl.project.announcement + " - " + mainCtrl.totals.totalCases + " cases"
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false
                    },
                    responsive: true,
                    scales: {
                        xAxes: [{
                            stacked: true,
                        }],
                        yAxes: [{
                            stacked: true
                        }]
                    }
                }
            });

        }

        mainCtrl.generateCSV = function() {
            var data = [
                ["name1", "city1", "some other info"],
                ["name2", "city2", "more info"]
            ];
            var csvContent = "";
            mainCtrl.filtered.forEach(function(el, index) {
                csvContent += el["full_name"] + "," + el["automated_cases_number"] + "," + el["cases_number"] + "\n";
            });

            // var encodedUri = encodeURI(csvContent);
            // var link = document.createElement("a");
            // link.setAttribute("href", encodedUri);
            // link.setAttribute("download", "data.csv");
            // document.body.appendChild(link); // Required for FF

            // link.click(); // This will download the data file named "my_data.csv".


            var a = document.createElement('a');
            a.href = 'data:attachment/csv,' + encodeURIComponent(csvContent);
            a.target = '_blank';
            a.download = 'data.csv';

            document.body.appendChild(a);
            a.click();
        }

        function _getProject(projectId) {
            for (var i = 0; i < mainCtrl.projects.length; i++) {
                if (mainCtrl.projects[i].id == parseInt(projectId)) {
                    return mainCtrl.projects[i];
                }
            }
        }

        function _countTotals(data) {
            var total = data.reduce(function(acc, currentValue, index, array) {
                if (currentValue["depth"] == 0) {
                    acc.totalCases += currentValue["cases_number"];
                    acc.totalAutomated += currentValue["automated_cases_number"];
                }
                return acc;
            }, {
                totalCases: 0,
                totalAutomated: 0
            });

            // Draw Pie Chart for totals
            var chartData = {
                labels: ["Automated Cases", "Not Automated"],
                datasets: [{
                    label: "Total",
                    backgroundColor: [
                        "#FF80AB",
                        "#3F51B5"
                    ],
                    data: [
                        total.totalAutomated,
                        total.totalCases - total.totalAutomated
                    ]
                }]
            };

            if (mainCtrl.totalChart) {
                mainCtrl.totalChart.destroy();
            }
            var ctx = document.getElementById("totalCanvas").getContext("2d");
            mainCtrl.totalChart = new Chart(ctx, {
                type: 'pie',
                data: chartData,
                options: {
                    title: {
                        display: true,
                        text: " Total - " + total.totalCases + " cases"
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false
                    },
                    responsive: true
                }
            });

            return total;
        }
    });