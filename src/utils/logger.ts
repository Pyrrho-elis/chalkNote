import * as pc from 'picocolors';

export class Logger {
  static info(message: string): void {
    console.log(pc.blue('ℹ'), message);
  }

  static success(message: string): void {
    console.log(pc.green('✅'), message);
  }

  static warn(message: string): void {
    console.log(pc.yellow('⚠️'), message);
  }

  static error(message: string): void {
    console.log(pc.red('❌'), message);
  }

  static step(step: number, total: number, message: string): void {
    console.log(pc.cyan(`[${step}/${total}]`), message);
  }

  static title(message: string): void {
    console.log('\n' + pc.bold(pc.magenta('🚀 ' + message)) + '\n');
  }

  static section(message: string): void {
    console.log('\n' + pc.bold(message));
  }
}