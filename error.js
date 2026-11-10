import chalk from 'chalk';

export default function error(msg) {
    console.log(chalk.red('Error!') + ' ' + msg);
    process.exit(1);
}