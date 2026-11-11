import chalk from 'chalk';

export function error(msg) {
    console.log(chalk.red('Error!') + ' ' + msg);
    process.exit(1);
}

export function warning(msg) {
    console.log(chalk.bold(chalk.yellow('WARNING!')) + '\n' + chalk.yellow(msg));
}

export function info(msg) {
    console.log(chalk.bold(chalk.cyan(msg)));
}
