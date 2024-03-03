export class Logger {
  private silent: boolean;

  constructor(silent: boolean = false) {
    this.silent = silent;
  }

  info(...messages: unknown[]): void {
    if (this.silent) {
      return;
    }
    console.info(...messages);
  }

  warn(...messages: unknown[]): void {
    if (this.silent) {
      return;
    }
    console.warn(...messages);
  }

  error(...messages: unknown[]): void {
    if (this.silent) {
      return;
    }
    console.error(...messages);
  }
}

export const logger = new Logger();
