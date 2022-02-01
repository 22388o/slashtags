import { program } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs';
import { homedir } from 'os';

const purge = program
  .command('purge')
  .description('Delete slashtags cli metadata');

purge
  .command('all')
  .description('Purge all slashtags storage on disk')
  .action(async (alias) => {
    const path = homedir() + '/.slash/';

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'sure',
        choices: ['yes', 'no'],
        message:
          'Are you sure you want to delete all slashtags data at ' + path + '?',
      },
    ]);

    if (answers.sure === 'yes') {
      fs.rmdirSync(path, {
        recursive: true,
      });

      console.log('Deleted Slashtags storage directory ' + path);
    }
  });

purge
  .command('logs')
  .description('Purge slashtags error logs')
  .action(async (alias) => {
    const path = homedir() + '/.slash/error.log';

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'sure',
        choices: ['yes', 'no'],
        message: 'Are you sure you want to delete error logs at ' + path + '?',
      },
    ]);

    if (answers.sure === 'yes') {
      try {
        fs.unlinkSync(path);
      } catch (error) {}

      console.log('Deleted error logs at ' + path);
    }
  });
