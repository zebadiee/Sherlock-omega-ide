/**
 * Enhanced Logger for Sherlock Ω
 * Provides structured logging with multiple levels and outputs
 */

import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  source?: string;
}

export class Logger {
  private logLevel: LogLevel;
  private logHistory: LogEntry[] = [];
  private maxHistorySize: number = 1000;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.logLevel = level;
  }

  debug(message: string, data?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, data, source);
  }

  info(message: string, data?: any, source?: string): void {
    this.log(LogLevel.INFO, message, data, source);
  }

  warn(message: string, data?: any, source?: string): void {
    this.log(LogLevel.WARN, message, data, source);
  }

  error(message: string, data?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, data, source);
  }

  fatal(message: string, data?: any, source?: string): void {
    this.log(LogLevel.FATAL, message, data, source);
  }

  private log(level: LogLevel, message: string, data?: any, source?: string): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      source
    };

    // Add to history
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }

    // Console output with colors
    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = chalk.gray(entry.timestamp);
    const source = entry.source ? chalk.blue(`[${entry.source}]`) : '';
    let levelStr = '';
    let messageColor = chalk.white;

    switch (entry.level) {
      case LogLevel.DEBUG:
        levelStr = chalk.gray('DEBUG');
        messageColor = chalk.gray;
        break;
      case LogLevel.INFO:
        levelStr = chalk.blue('INFO ');
        messageColor = chalk.white;
        break;
      case LogLevel.WARN:
        levelStr = chalk.yellow('WARN ');
        messageColor = chalk.yellow;
        break;
      case LogLevel.ERROR:
        levelStr = chalk.red('ERROR');
        messageColor = chalk.red;
        break;
      case LogLevel.FATAL:
        levelStr = chalk.magenta('FATAL');
        messageColor = chalk.magenta;
        break;
    }

    const logLine = `${timestamp} ${levelStr} ${source} ${messageColor(entry.message)}`;
    console.log(logLine);

    if (entry.data) {
      console.log(chalk.gray('  Data:'), entry.data);
    }
  }

  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory(): void {
    this.logHistory = [];
  }

  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  getLevel(): LogLevel {
    return this.logLevel;
  }
}