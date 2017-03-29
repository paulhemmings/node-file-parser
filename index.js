#! /usr/bin/env node

// pipe in the file
// git grep Order_Line_Items__c.Air_PO__c -- '*.profile' | cut -d':' -f1 | file-parser

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

console.log(`options -> ${JSON.stringify(options)}`);

// Curry the function we need to parse a file

var parseFile = function(fileName) {
    console.log(`parseFile -> ${fileName}`);
    var blockBuffer = '';
    var fileParts = path.parse(fileName);
    var destinationFile = path.join(fileParts.dir, fileParts.name + ".edited" + fileParts.ext);
    var outputStream = fs.createWriteStream(destinationFile);
    var readingBlock = 'off';
    return function(input) {

        if (input.match(options.blockStart)) {
            readingBlock = 'on';
        } else if (input.match(options.blockEnd)) {
            readingBlock = 'off';
        }

        if (readingBlock == 'on') {
            if (blockBuffer!='') {
                blockBuffer += '\r\n';
            }
            blockBuffer += `${input}`;
        } else {
            if (blockBuffer != '') {
                if (!blockBuffer.match(options.matchString)) {
                    // console.log(`${blockBuffer}`);
                    outputStream.write(`${blockBuffer}\r\n${input}\r\n`);
                }
                blockBuffer = '';
            } else {
                outputStream.write(`${input}\r\n`);
            }
        }

    }
}

// the function that handles parsing a file via a read stream

var parseFileName = function(sourceFileName) {
    console.log(`parseFileName -> ${sourceFileName}`);
    readline.createInterface({
        input: fs.createReadStream(path.join(process.cwd(),sourceFileName))
    }).on('line', parseFile(path.join(process.cwd(),sourceFileName)));
}

// read the file to parse from stdin (piped in) or as a parameter

readline.createInterface({
  input: options.sourceFile ? fs.createReadStream(options.sourceFile) : process.stdin
}).on('line', options.sourceFile ? parseFile(options.sourceFile) : parseFileName );

// end
