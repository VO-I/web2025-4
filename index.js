const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

program
  .requiredOption('-h, --host <type>', 'Server host address')
  .requiredOption('-p, --port <type>', 'Server port')
  .requiredOption('-i, --input <type>', 'Input JSON file path');

program.parse(process.argv);

const options = program.opts();

const host = options.host;
const port = parseInt(options.port, 10);
const inputFilePathRaw = options.input;
const inputFilePath = path.resolve(inputFilePathRaw);

if (isNaN(port)) {
    console.error('Error: Port must be a number.');
    process.exit(1);
}

function startServer() {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Сервер запущено на ${host}:${port}. Очікування запитів...\n`);
    });

    server.listen(port, host, () => {
        console.log(`Server successfully started at http://${host}:${port}/`);
        console.log(`Reading data configuration from: ${inputFilePath}`);
        console.log('Waiting for requests...');
    });

    server.on('error', (err) => {
        console.error('Server error:', err);
        if (err.code === 'EADDRINUSE') {
            console.error(`Error: Port ${port} is already in use on host ${host}. Please choose another port or stop the conflicting application.`);
        }
        process.exit(1);
    });
}

async function checkFileAndStartServer() {
    try {
        await fs.access(inputFilePath, fs.constants.R_OK);
        console.log(`Input file found and accessible: ${inputFilePath}`);
        startServer();
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.error(`Error: Cannot find input file "${inputFilePathRaw}" (Resolved to: ${inputFilePath})`);
        } else if (err.code === 'EACCES') {
            console.error(`Error: Permission denied for reading input file "${inputFilePathRaw}" (Resolved to: ${inputFilePath})`);
        } else {
            console.error(`Error accessing file "${inputFilePathRaw}":`, err.message);
        }
        console.error("Please check the file path and permissions.");
        process.exit(1);
    }
}

checkFileAndStartServer();
