## node-file-parser
App that parses a file (or list of files via pipe) and strips out any matching blocks. Used to remove file permissions from a list of Salesforce .profiles

### What it does
Strips blocks of text from multiple files based on 3 simple parameters; start block, end block, and match string.

### Use case
Say you have 30 profiles that all contain field permissions for a field that has now been removed. You want to search through all the files, find the ones that have the reference to the field name, and then remove the entire XML block from that file. Using this app you could feed in the list of 30 files, and it would create a copy of each file in a sub-folder which is identical, apart from the block is removed.

### Installation
```
$ git clone https://github.com/paulhemmings/node-file-parser
$ cd node-file-parser
$ npm install
$ npm link
```

#### Example
The "Order_Line_Items__c.Air_PO__c" field is removed. This is referenced in 30+ different files. In each file the following XML block is present. You want to remove this entire block from all 30 files. In this example "fieldPermissions" is the start block, "/fieldPermissions" the end block. These are the default start and end blocks defined within Config.yml. They can be overloaded via the command line parameters.
```
    <fieldPermissions>
        <editable>true</editable>
        <field>Order_Line_Items__c.Air_PO__c</field>
        <readable>true</readable>
    </fieldPermissions>
```

Find all the files ending in ".profile" that contain this string and return those files as a 1 column list. Feed those list of files into the file parser, giving it the match string (field to be removed)

```
$ git grep Order_Line_Items__c.Air_PO__c -- '*.profile' | cut -d':' -f1 | file-parser matchString='Order_Line_Items__c.Air_PO__c'
```

This will process all the files in parallel. Go to the folder "parser-output" and see all the files with their original names and content, minus that block
