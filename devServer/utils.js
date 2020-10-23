const FileSystem = require('fs');
const Path = require('path');

module.exports = {
    readFile,
    readDirectory,
    readTsConfig,
    debounce,
};

function readFile(filePath, options) {
    console.info('readFile: ', filePath);

    return new Promise((resolve, reject) => {
        FileSystem.readFile(filePath, options, (error, content) => {
            if (error) {
                reject(error);
            } else {
                resolve(content);
            }
        });
    });
}

function readDirectory(path) {
    return new Promise((resolve, reject) => {
        FileSystem.readdir(path, { withFileTypes: true }, (error, dirEntries) => {
            if (error) {
                reject(error);
            } else {
                resolve(dirEntries);
            }
        });
    });
}

function readTsConfig() {
    const tsconfigPath = Path.join(process.cwd(), 'tsconfig.json');
    const tsconfig = FileSystem.readFileSync(tsconfigPath).toString();

    return JSON.parse(tsconfig);
}

function debounce(fnc, delay = 200, immediate = false) {
    let timeoutId;

    return (...args) => {
        if (immediate && !timeoutId) {
            fnc(...args);
        }
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fnc(...args), delay);
    };
}
