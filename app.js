// Base requirements
const http = require('http');
const os = require('os');
const fs = require('fs');

// Costants
const port = 8882;
const address = '0.0.0.0';  //  --> For docker binding, because 127.0.0.1 bind on container

// Create the server
const server = http.createServer((req, res) => {
  // Analize the URL request
  switch (req.url) {
    // These are the base URLs that load the base page
    case '/':
    case '/index.html':
    case '/home.html':
      loadFile('index.html', res);
      break;
    // Request of the base core script
    case '/script/core.js':
      loadFile('.' + req.url, res);
      break;
    case '/node_modules/chart.js/dist/chart.js':
      loadFile('.' + req.url, res);
      break;
    case '/js/uikit.min.js':
      loadFile('.' + req.url, res);
      break;
    case '/js/uikit-icons.min.js':
      loadFile('.' + req.url, res);
      break;
    case '/css/uikit.min.css':
      loadFile('.' + req.url, res);
      break;
    // Request the CPUs info
    case '/CPUs':
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(getCpusInfo());
      break;
    case '/CPUs/analitic':
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(getCpusInfo(true));
      break;
    // Request the RAM info
    case '/RAM':
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(getRamInfo());
      break;
    // Default request, try to send the file requested
    default:
      res.statusCode = 404;
      res.end('Page not found');
      console.log('Request failed: ', req.url);
      break;
  }
});

// Start the server
server.listen(port,
  address,
  () => { console.log(`Server started at http://${address}:${port}`); });

/**
 * Allow to load a file and prepare the
 * base information for the request
 * @param {string} filePath the file path
 * @param {Http.response} response allow to respond directly
 * @returns the file content o the error
 */
function loadFile(filePath, response) {
  try {
    // Try to open the file
    fs.readFile(filePath, 'utf8', (err, data) => {
      // Check if there is an error
      if (err) {
        response.statusCode = 404;
        response.end(JSON.stringify(err));
        console.log('Load file error: ', err);
      } else {
        response.statusCode = 200;
        response.end(data);
      }
    });
  } catch (error) {
    // Exception generated
    response.statusCode = 404;
    response.end(JSON.stringify(error));
    console.log('Load file exception: ', err);
  }
}

/**
 * Handles the CPUs info, it can have two behaviours:
 * analitic = true => return information about every core
 * analitic = false => return general information
 * default behaviour => analitic = false
 * @param {boolean} analitic 
 * @returns CPUs info
 */
function getCpusInfo(analitic = false) {
  // Get the CPUs info
  var cpusInfo = os.cpus();

  // Analitic mode ON, there is anything
  // to do, i can return now  
  if (analitic) {
    return JSON.stringify(cpusInfo);
  }

  // A little check
  if (cpusInfo.length == 0) {
    return JSON.stringify(cpusInfo);
  }

  // Template data structure
  var template = cpusInfo[0];

  // Skip the first row, we have already save the
  // data in the template
  for (var i = 1; i < cpusInfo.length; ++i) {
    template.speed += cpusInfo[i].speed;
    template.times.idle += cpusInfo[i].times.idle;
    template.times.irq += cpusInfo[i].times.irq;
    template.times.nice += cpusInfo[i].times.nice;
    template.times.sys += cpusInfo[i].times.sys;
    template.times.user += cpusInfo[i].times.user;
  }

  // Calculate the average values
  template.speed /= cpusInfo.length;
  template.times.idle /= cpusInfo.length;
  template.times.irq /= cpusInfo.length;
  template.times.nice /= cpusInfo.length;
  template.times.sys /= cpusInfo.length;
  template.times.user /= cpusInfo.length;

  // Ritorno le informazioni
  return JSON.stringify(template);
}

/**
 * Handles the RAM info
 * @returns the RAM info
 */
function getRamInfo() {
  var result = { totalAmount: os.totalmem(), freeMemory: os.freemem() };
  return JSON.stringify(result);
}