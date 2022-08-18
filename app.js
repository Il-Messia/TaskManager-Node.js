const http = require('http');
const os = require('os');
const fs = require('fs');

const server = http.createServer((req, res) => {

  switch (req.url) {
    case '/':
    case '/index.html':
    case '/home.html':
      fs.readFile('index.html', 'utf8', (err, data) => {
        res.statusCode = 200;
        res.end(data);
      });
      break;
    case '/cpus':
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(getCpusInfo());
      break;
    case '/RAM':
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(getRamInfo());
      break;
    default:
      try {
        fs.readFile('.' + req.url, 'utf8', (err, data) => {
          if (err != null) {
            res.statusCode = 404;
            res.end(JSON.stringify(err));
          } else {
            res.statusCode = 200;
            res.end(data);
          }
        });
      } catch (e) {
      }
      break;
  }


});

server.listen(8882, 'localhost', () => { console.log('Server started at http://localhost:8882'); });

/**
 * Permette di ottenere le informazioni sulle
 * statistiche di utilizzo del processore
 * @param analitic permette di poter avere le informazioni
 *                  in modo analitico, per ogni core. 
 *                  Valore di default [false]
 * @return le informazioni richieste in formato JSON
*/
function getCpusInfo(analitic = false) {
  // Ottengo le informazioni del processore
  var cpusInfo = os.cpus();

  // Se vengono richieste le informazioni in modalità
  // analitica ritorno subito  
  if (analitic) {
    return JSON.stringify(cpusInfo);
  }

  // Controllo comunque di avere informazioni
  if (cpusInfo.length == 0) {
    return JSON.stringify(cpusInfo);
  }

  // Variabile di template
  var template = cpusInfo[0];

  // ATTENZIONE: salto tranquillamente la prima 
  //             in quanto l'ho già assegnata
  for (var i = 1; i < cpusInfo.length; ++i) {
    template.speed += cpusInfo[i].speed;
    template.times.idle += cpusInfo[i].times.idle;
    template.times.irq += cpusInfo[i].times.irq;
    template.times.nice += cpusInfo[i].times.nice;
    template.times.sys += cpusInfo[i].times.sys;
    template.times.user += cpusInfo[i].times.user;
  }

  // Estraggo una media
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
 * Return RAM information like
 * usage and total amount
 * @return data in JSON format
 */
function getRamInfo() {
  var result = { totalAmount: os.totalmem(), freeMemory: os.freemem() };
  return JSON.stringify(result);
}