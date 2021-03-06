#! /usr/bin/env node
'use strict';

const ArgumentParser = require('argparse').ArgumentParser;
const path           = require('path');
const fs             = require('fs');

const parser = new ArgumentParser({
    version: '1.0.5',
    addHelp: true,
    description: 'MySQLees CLI'
});

parser.addArgument(
    ['-m', '--migrate'],
    {
        action: 'storeTrue',
        help: 'Migrate Schemas'
    }
);

parser.addArgument(
    ['-c', '--config'],
    {
        help: 'Configuration File'
    }
);

const args = parser.parseArgs();

if (args.migrate) {
        
    const cwd        = process.cwd();
    const config     = args.config ? args.config : 'mysqlees.json'; 
    const configPath = path.join(cwd, config);
    
    if (fs.existsSync(configPath)) {
        let json;
        try {
            json = JSON.parse(fs.readFileSync(configPath));
        } catch(err) {
            console.log(`Error: Faild to parse configuration file (${config})`);
            process.exit();
        }
        
        if (!json.migration.connection && json.migration.connection.host === undefined && 
            json.migration.connection.user === undefined && json.migration.connection.password === undefined &&
            json.migration.connection.database === undefined) {
                console.log(`Error: Invalid connection configuration for migration. Please visit official documentation (https://github.com/rupinder-developer/MySQLees) for reference.`);
                process.exit();
        }

        let error = false; // Error Flag
        for(let value of json.migration.models) {
            if (fs.existsSync(path.join(value+'.js'))) {
                let model = require(path.join(cwd, value));
                if (!(model && model._$schema)) {
                    error = true;
                    console.log(`Error: Failed to parse model (${value}). Use module.exports to export your model instance.`);
                }
            } else {
                error = true;
                console.log(`Error: Model not found!! (Invalid Path: ${value})`);
            }
        }
        
        if (error) {
            console.log(`Error: Migration Failed!!`);
        } else {
            for(let value of json.migration.models) {
                let model = require(path.join(cwd, value));
                if (model && model._$schema) {
                    model._$schema().implementSchema(model.modelName, json.migration.connection);
                } 
            }
        }
    } else {
        console.log(`Error: ${config} not found!! (Invalid Path: ${path.join(cwd, config)})`);
        process.exit();
    }
}


