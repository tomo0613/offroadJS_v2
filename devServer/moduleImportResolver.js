module.exports = resolveImports;

const importRegExp = /(import.+from) ('|")(.+)('|")/g;

function resolveImports(fileContentString) {
    return fileContentString.replace(importRegExp, alterModuleResolution);
}

function alterModuleResolution(fullMatch, importDefinition, stringOpeningTag, importPath, stringClosingTag) {
    let path = importPath;

    if (!path.endsWith('.js')) {
        path = `${path}.js`;
    }

    return `${importDefinition} ${stringOpeningTag}${path}${stringClosingTag}`;
}
