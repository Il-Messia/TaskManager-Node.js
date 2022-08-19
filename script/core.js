// Costants
const intervalsIndexes = {
    cpu: 0,     // Index of the cpu interval
    ram: 1,     // Index of the ram interval
};

const mesurementsLimit = 30;    // Max number of mesurements

// Contains the CPU chart data
var cpuData = {
    chart: null,                                        // chart reference
    xLabels: null,                                      // labels of x values
    yValues: null,                                      // the y values
    mesurements: null,                                  // list of CPU mesurements, CPU specific field
    title: 'CPU usage',                                 // title of the chart
    analitic: false,                                    // analitic cpus
    backgroundColor: 'rgba(3, 169, 244, 0.3)',          // fill area color
    borderColor: 'rgb(3, 169, 244)',                    // line color
    CPUInfoField: null,                                 // field for display the CPU information
    usageField: null,                                   // field for display CPU usage
    idleField: null,                                    // field for display CPU idle
};

// Contains the RAM chart data
var ramData = {
    chart: null,                                        // chart reference
    xLabels: null,                                      // labels of x values
    yValues: null,                                      // the y values
    title: 'RAM usage',                                 // title of the chart
    backgroundColor: 'rgba(255, 82, 82, 0.3)',          // fill area color
    borderColor: 'rgb(255, 82, 82)',                    // line color
    totalRamField: null,                                // field for display the total amount of RAM
    usedRamField: null,                                 // field for display the current used RAM
    freeRamField: null,                                 // field for display the current free RAM
};

// List of iterval that allow to handle the start o the end of the refresh
var intervals = [{ intervalId: null, timing: 500, function: manageCpuData },
{ intervalId: null, timing: 500, function: manageRAMData }];

/**
 * Start the interval for refreshing
 * @param {number} index the index the interval 
 */
function startTimer(index) {
    if (index === null || index > intervals.length) {
        return;
    }
    intervals[index].intervalId = setInterval(intervals[index].function, intervals[index].timing);
}

/**
 * Stop the interval, so stop the refreshing
 * @param {number} index the index the interval
 */
function endTimer(index) {
    if (index === null || index > intervals.length) {
        return;
    }
    clearInterval(intervals[index].intervalId);
    intervals[index].intervalId = null;
}

/**
 * Allow to update the duration of the refresh
 * @param {number} duration offset timer 
 * @param {HTMLElement} buttonElement reference to the principal button
 */
function refreshIntervalDuration(duration, buttonElement) {
    for (const property in intervalsIndexes) {
        intervals[intervalsIndexes[property]].timing = duration;
        if (intervals[intervalsIndexes[property]].intervalId != null) {
            endTimer(intervalsIndexes[property]);
            startTimer(intervalsIndexes[property]);
        }
    }

    if (buttonElement != null) {
        buttonElement.innerHTML = 'REFRESH RATE: ' + duration / 1000 + 's';
    }
}

/**
 * Generate the x label values
 * @returns a list that contain x labels
 */
function getLabel() {
    // Create the array
    var labels = new Array();
    // Inizialize elements
    for (var i = 0; i < mesurementsLimit; ++i) {
        labels.push(mesurementsLimit - i);
    }
    // Returnt the list
    return labels;
}

/**
 * Allow to initialize the chart and chart data
 * @param {HTMLElement} canvas the canvas associated to the chart
 * @param {*} chartData
 */
function initChart(canvas, chartData) {

    // Check the integrity
    if (chartData === null || canvas === null) {
        return;
    }

    // Inizialize x labels
    chartData.xLabels = getLabel();
    // Inizialize y values
    chartData.yValues = new Array(mesurementsLimit);
    for (var i = 0; i < mesurementsLimit; ++i) {
        chartData.yValues[i] = 0;
    }

    var data = {
        labels: chartData.xLabels,
        datasets: [{
            label: chartData.title,
            backgroundColor: chartData.backgroundColor,
            borderColor: chartData.borderColor,
            data: chartData.yValues,
            pointRadius: 0,
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            fill: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        type: 'linear',
                        min: 0,
                        max: 100
                    }
                }, x: {
                    grid: {
                        offset: true
                    }
                }

            }
        }
    };
    chartData.chart = new Chart(
        canvas,
        config
    );
}

/**
 * Handle the request to the server and
 * caluclute the data for the chart
 */
function manageCpuData() {
    // Creating http request to query cpu usage on server
    const Http = new XMLHttpRequest();
    const url = `http://${window.location.host}/CPUs`;   // --> Request URL

    // Open the connection and send the request
    Http.open('GET', url);
    Http.send();

    // Listener on request response
    Http.onreadystatechange = () => {

        // Only completed request:
        // 0	|   UNSENT	            |    Client has been created. open() not called yet.
        // 1	|   OPENED	            |    open() has been called.
        // 2	|   HEADERS_RECEIVED	|    send() has been called, and headers and status are available.
        // 3	|   LOADING	            |    Downloading; responseText holds partial data.
        // 4	|   DONE	            |    The operation is complete.
        if (Http.readyState != 4) {
            return;
        }

        try {

            // Parse the json response
            var cpu = JSON.parse(Http.responseText),
                absoluteTotal = 0;                  // Absolute total of CPU times in milliseconds

            // Accumulate all CPU times
            for (var type in cpu.times) {
                absoluteTotal += cpu.times[type];
            }

            // Check the mesurements
            if (cpuData.mesurements === null) {
                cpuData.mesurements = new Array();
            }

            // If i have the pool of two element i can shift the data
            if (cpuData.mesurements.length === 2) {
                // Shitf data
                cpuData.mesurements.shift();
            }
            // Push the new data
            cpuData.mesurements.push({ total: absoluteTotal, idle: cpu.times.idle });

            // Is the first inserting, don't do anything
            if (cpuData.mesurements.length <= 1) {
                return;
            }

            // Total delta CPU time
            var deltaTotal = cpuData.mesurements[1].total - cpuData.mesurements[0].total;
            // Total delta idle CPU time
            var deltaIdle = cpuData.mesurements[1].idle - cpuData.mesurements[0].idle;
            // Real CPU usage in percentage
            var realUsage = 100 - (deltaIdle * 100 / deltaTotal);

            // Shift and push data
            cpuData.yValues.shift();
            cpuData.yValues.push(realUsage);

            // Check if CPU chart is inizialized
            if (cpuData.chart != null) {
                cpuData.chart.data.datasets[0].data = cpuData.yValues;
                cpuData.chart.update();
            }

            if (cpuData.CPUInfoField != null) {
                cpuData.CPUInfoField.innerHTML = 'CPU: ' + cpu.model;
            }

            if (cpuData.usageField != null) {
                cpuData.usageField.innerHTML = 'Usage: ' + parseFloat(realUsage).toFixed(2) + '%';
            }

            if (cpuData.idleField != null) {
                cpuData.idleField.innerHTML = 'Idle: ' + parseFloat(100 - realUsage).toFixed(2) + '%';
            }
        }
        catch (ex) {
            console.log(Http.responseText);
            console.log(ex);
        }
    }
}

/**
 * Handle the request to the server and
 * caluclute the data for the chart
 */
function manageRAMData() {
    // Creating http request to query cpu usage on server
    const Http = new XMLHttpRequest();
    const url = `http://${window.location.host}/RAM`;   // --> Request URL

    // Open the connection and send the request
    Http.open('GET', url);
    Http.send();

    // Listener on request response
    Http.onreadystatechange = () => {

        // Only completed request:
        // 0	|   UNSENT	            |    Client has been created. open() not called yet.
        // 1	|   OPENED	            |    open() has been called.
        // 2	|   HEADERS_RECEIVED	|    send() has been called, and headers and status are available.
        // 3	|   LOADING	            |    Downloading; responseText holds partial data.
        // 4	|   DONE	            |    The operation is complete.
        if (Http.readyState != 4) {
            return;
        }

        try {

            // Parse the json response
            var RAMData = JSON.parse(Http.responseText);

            // Shift and push data
            ramData.yValues.shift();
            ramData.yValues.push(100 - (RAMData.freeMemory * 100 / RAMData.totalAmount));

            // Check if CPU chart is inizialized
            if (ramData.chart != null) {
                ramData.chart.data.datasets[0].data = ramData.yValues;
                ramData.chart.update();
            }

            if (ramData.totalRamField != null) {
                ramData.totalRamField.innerHTML = 'Total RAM: ' + parseFloat(RAMData.totalAmount / 1073741824).toFixed(2) + 'GB';
            }

            if (ramData.usedRamField != null) {
                ramData.usedRamField.innerHTML = 'Used RAM: ' + parseFloat(100 - (RAMData.freeMemory * 100 / RAMData.totalAmount)).toFixed(2) + '%';
            }

            if (ramData.freeRamField != null) {
                ramData.freeRamField.innerHTML = 'Free RAM: ' + parseFloat(100 - (100 - (RAMData.freeMemory * 100 / RAMData.totalAmount))).toFixed(2) + '%';
            }
        }
        catch (ex) {
            console.log(Http.responseText);
            console.log(ex);
        }
    }
}