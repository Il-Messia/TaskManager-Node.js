const cpuInterval = 0;
const ramInterval = 1;

const mesurementsLimit = 60;        // Numero massimo di misurazioni

var yCPUValue = new Array(mesurementsLimit);
for (var i = 0; i < mesurementsLimit; ++i) {
    yCPUValue[i] =0;
}

var yRAMValue = new Array(mesurementsLimit);
for (var i = 0; i < mesurementsLimit; ++i) {
    yRAMValue[i] =0;
}

var myCPUChart, myRAMChart;

var intervals = [{ intervalId: null, timing: 1000, function: manageCpuData },{ intervalId: null, timing: 1000, function: manageRAMData }];



function initChart(cavas) {
    const labels = getLabel();
    var data = {
        labels: labels,
        datasets: [{
            label: 'CPU usage',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderColor: 'rgb(75, 192, 192)',
            data: yCPUValue,
        }]
    };

    const config = {
        type: 'line',

        data: data,
        options: {
            fill: true,
            scales: {
                y: {
                    beginAtZero: true
                }, x: {
                    grid: {
                        offset: true
                    }
                }

            }
        }
    };
    return new Chart(
        cavas,
        config
    );
}

function initChart2(cavas) {
    const labels = getLabel();
    var data = {
        labels: labels,
        datasets: [{
            label: 'RAM usage',
            backgroundColor: 'rgba(61, 90, 254, 0.1)',
            borderColor: 'rgb(61, 90, 254)',
            data: yRAMValue,
        }]
    };

    const config = {
        type: 'line',

        data: data,
        options: {
            fill: true,
            scales: {
                y: {
                    beginAtZero: true
                }, x: {
                    grid: {
                        offset: true
                    }
                }

            }
        }
    };
    return new Chart(
        cavas,
        config
    );
}

/**
 * 
 *  GESTIONE CPU
 * 
 */


var isFirstTime = true;             // Permette di comprendere se siamo alla prima chiamata
var cpuMeasurements = null;         // Misurazioni registrate della CPU

/**
 * Restituisce un array di misurazioni inizializzato 
*/
function resetCPUMeseraments() {
    // Istanzio l'array
    var array = new Array(mesurementsLimit);
    // Inizializzo i valori
    for (var i = 0; i < mesurementsLimit; ++i) {
        array[i] = { totalTime: 0, idle: 0 };
    }
    // Ritorno l'array
    return array;

}

/**
 * Permette di inizializzare la lista
 * di label per l'asse x che rappresenterà il
 * numero di secondi trascorsi
*/
function getLabel() {
    // Inizializzo l'array
    var labels = new Array();
    // Inizializzo gli elementi
    for (var i = 0; i < mesurementsLimit; ++i) {
        labels.push(mesurementsLimit - i);
    }
    // Ritorno la lista di labels
    return labels;
}

/**
 * Allows to handle CPU usage chart
 */
function manageCpuData() {
    // Creating http request to query cpu usage on server
    const Http = new XMLHttpRequest();
    const url = `http://${window.location.host}/cpus`;   // --> Request URL
    
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

            // Shitf and push data
            cpuMeasurements.shift();
            cpuMeasurements.push({ total: absoluteTotal, idle: cpu.times.idle });

            // Is the first inserting, don't do anything
            if (isFirstTime) {
                isFirstTime = !isFirstTime;
                return;
            }

            // Total delta CPU time
            var deltaTotal = cpuMeasurements[cpuMeasurements.length - 1].total - cpuMeasurements[cpuMeasurements.length - 2].total;
            // Total delta idle CPU time
            var deltaIdle = cpuMeasurements[cpuMeasurements.length - 1].idle - cpuMeasurements[cpuMeasurements.length - 2].idle;
            // Real CPU usage in percentage
            var realUsage = 100 - (deltaIdle * 100 / deltaTotal);

            // Shift and push data
            yCPUValue.shift();
            yCPUValue.push(realUsage);
            
            // Check if CPU chart is inizialized
            if (myCPUChart != null) {
                myCPUChart.data.datasets[0].data = yCPUValue;
                myCPUChart.update();
            }
        }
        catch (ex) {
            console.log(Http.responseText);
            console.log(ex);
        }
    }
}

function manageRAMData(){
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
            yRAMValue.shift();
            yRAMValue.push( 100 - (RAMData.freeMemory * 100 / RAMData.totalAmount));
            
            // Check if CPU chart is inizialized
            if (myRAMChart != null) {
                myRAMChart.data.datasets[0].data = yRAMValue;
                myRAMChart.update();
            }
        }
        catch (ex) {
            console.log(Http.responseText);
            console.log(ex);
        }
    }
}

function startTimer(index) {

    if (index === null) {
        return;
    }

    if (cpuMeasurements === null) {
        cpuMeasurements = resetCPUMeseraments();
    }
    intervals[index].intervalId = setInterval(intervals[index].function, intervals[index].timing);

}

function endTimer(index) {

    if (index === null) {
        return;
    }

    clearInterval(intervals[index].intervalId);
}