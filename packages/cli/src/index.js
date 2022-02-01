#! /usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import autoCompletePrompt from 'inquirer-autocomplete-prompt';

inquirer.registerPrompt('autocomplete', autoCompletePrompt);

import './commands/daemon.js';
import './commands/did.js';
import './commands/purge.js';

process.title = 'slashtags';

if (!process.argv.slice(2).length) {
  program.outputHelp();
} else {
  program.parse(process.argv);
}
