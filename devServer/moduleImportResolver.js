const utils = require('./utils');

const tsConfig = utils.readTsConfig();
const devBuildFolder = tsConfig.compilerOptions.outDir;

const rootFolderRegExp = new RegExp(`.*${devBuildFolder}/`);

let nodeModulesPath = '../node_modules';

module.exports = resolveImports;

const nodeModuleResolutions = {
    three: 'three/build/three.module',
    'cannon-es': 'cannon-es/dist/cannon-es',
    'cannon-es-debugger': 'cannon-es-debugger/dist/cannon-es-debugger',
};
const nodeModulesRegExp = new RegExp(`^(${Object.keys(nodeModuleResolutions).join('|')})`);
const importRegExp = /(import[\s\S]*?from) ('|")(.+)('|")/g;
const extensionRegExp = /\.js$/;

function setNodeModulesPath(filePath) {
    const directoryDepth = filePath.replace(rootFolderRegExp, '').split('/').length;

    nodeModulesPath = '../'.repeat(directoryDepth) + 'node_modules';
}

function resolveImports(fileContentString, filePath) {
    setNodeModulesPath(filePath);

    return fileContentString.replace(importRegExp, alterModuleResolution);
}

function alterModuleResolution(fullMatch, importDefinition, stringOpeningTag, importPath, stringClosingTag) {
    let path = importPath;
    if (nodeModuleResolutions[path]) {
        path = nodeModuleResolutions[path];
    }
    if (nodeModulesRegExp.test(path)) {
        path = `${nodeModulesPath}/${path}`;
    }
    if (!extensionRegExp.test(path)) {
        path = `${path}.js`;
    }

    return `${importDefinition} ${stringOpeningTag}${path}${stringClosingTag}`;
}
