#! /usr/bin/env node

// pipe in the file
// git grep Order_Line_Items__c.Air_PO__c -- '*.profile' | cut -d':' -f1 | file-parser matchString='Order_Line_Items__c.Air_PO__c'

// or pass in as a parameter
// file-parser matchString=test.one sourceFile=test-file


const path = require('path');
const fs = require('fs');
const readline = require('readline');
const yaml_config = require('node-yaml-config');
const args = process.argv.slice(2);

// we need a match string, if nothing else

if (args.length < 1) {
    return console.log('usage :: file-parser matchString={} [sourceFile={} blockStart={} blockEnd={}]');
}

// load the configuration - which can be later overidden by CLI parameters

var config = yaml_config.load(__dirname + '/config.yml');

// get the named parameters (x=y) from the CLI

var argsNamed = {};
args.reduce((result, argument) => {
    if (argument.match('=')) {
        var argParts = argument.split('=');
        result[argParts[0]] = argParts[1];
    }
    return result;
}, argsNamed);

// merge CLI with configuration

var options = Object.assign({}, config, argsNamed);

// show the options
if (options.showDebug) {
    console.log(`options -> ${JSON.stringify(options)}`);
}

// Curry the function we need to parse a file

var parseFile = function(fileName, outputStream) {

    if (options.showDebug) {
        console.log(`parseFile -> ${fileName}`);
    }

    var blockBuffer = [];
    var readingBlock = 'off';

    return function(input) {

        if (input.match(options.blockStart)) {
            readingBlock = 'on';
        } else if (input.match(options.blockEnd)) {
            readingBlock = 'off';
        }

        if (readingBlock == 'on') {
            blockBuffer.push(`${input}`);
        } else {
            if (blockBuffer != '') {
                if (!blockBuffer.join('').match(options.matchString)) {
                    outputStream.write(`${blockBuffer.join('\r\n')}\r\n${input}\r\n`);
                }
                blockBuffer.length = 0;
            } else {
                outputStream.write(`${input}\r\n`);
            }
        }

    }
}

// the function that handles parsing a file via a read stream

var parseFileName = function(sourceFileName) {

    var fullPath = path.join(process.cwd(),sourceFileName);
    var fileParts = path.parse(fullPath);
    var destinationFile = path.join(fileParts.dir, 'parser-output', fileParts.name + fileParts.ext);
    var outputStream = fs.createWriteStream(destinationFile);

    readline.createInterface({
        input: fs.createReadStream(fullPath)
    })
    .on('line', parseFile(fullPath, outputStream))
    .on('close', () => {
        console.log(`finished processing -> ${sourceFileName}`);
        outputStream.end();
    });
}

// if we have got this far, we will need an output folder.
// we're going to create this synchronously because it's a one off operation

var outputDirectory = path.join(process.cwd(),'parser-output');
if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
}

// read the file to parse as a parameter if there

if (options.sourceFile) {
    parseFileName(options.sourceFile);
    return;
}

// if reading files from stdin (via pipe) process each new line as a new file

readline.createInterface({
  input: process.stdin
}).on('line', parseFileName);

// end
