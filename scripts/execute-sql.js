#!/usr/bin/env node

/**
 * SQL Migration Executor for Supabase
 * 
 * This script reads a SQL file and executes each statement via Supabase REST API.
 * It's designed for production use with proper error handling and progress tracking.
 * 
 * Usage:
 *   node execute-sql.js [options]
 * 
 * Options:
 *   --file, -f       Path to SQL file (default: ../supabase/migrations/999_complete_migration.sql)
 *   --env, -e        Path to .env file (default: ../apps/admin-dashboard/.env.local)
 *   --dry-run, -d    Parse and split SQL without executing
 *   --continue, -c   Continue on error (default: stop on first error)
 *   --verbose, -v    Show verbose output including full SQL statements
 *   --help, -h       Show this help message
 * 
 * Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL    - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY   - Supabase service role key (required for DDL operations)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Logger utility with colors and timestamps
 */
class Logger {
  static timestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  static info(message) {
    console.log(`${colors.dim}[${this.timestamp()}]${colors.reset} ${colors.blue}ℹ${colors.reset} ${message}`);
  }

  static success(message) {
    console.log(`${colors.dim}[${this.timestamp()}]${colors.reset} ${colors.green}✓${colors.reset} ${message}`);
  }

  static warn(message) {
    console.log(`${colors.dim}[${this.timestamp()}]${colors.reset} ${colors.yellow}⚠${colors.reset} ${message}`);
  }

  static error(message) {
    console.error(`${colors.dim}[${this.timestamp()}]${colors.reset} ${colors.red}✗${colors.reset} ${message}`);
  }

  static progress(current, total, message) {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((current / total) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    console.log(`${colors.dim}[${this.timestamp()}]${colors.reset} ${colors.cyan}[${bar}]${colors.reset} ${percentage}% ${message}`);
  }

  static verbose(message) {
    if (global.verboseMode) {
      console.log(`${colors.dim}[${this.timestamp()}]${colors.reset} ${colors.magenta}➤${colors.reset} ${colors.dim}${message}${colors.reset}`);
    }
  }

  static divider() {
    console.log(colors.dim + '─'.repeat(80) + colors.reset);
  }

  static header(title) {
    console.log('\n' + colors.bright + colors.cyan + title + colors.reset);
    Logger.divider();
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    file: path.join(__dirname, '..', 'supabase', 'migrations', '999_complete_migration.sql'),
    envFile: null, // Will search for .env.local in common locations
    dryRun: false,
    continueOnError: false,
    verbose: false,
    showHelp: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--file':
      case '-f':
        options.file = args[++i];
        break;
      case '--env':
      case '-e':
        options.envFile = args[++i];
        break;
      case '--dry-run':
      case '-d':
        options.dryRun = true;
        break;
      case '--continue':
      case '-c':
        options.continueOnError = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        global.verboseMode = true;
        break;
      case '--help':
      case '-h':
        options.showHelp = true;
        break;
      default:
        if (arg.startsWith('-')) {
          Logger.warn(`Unknown option: ${arg}`);
        }
    }
  }

  return options;
}

/**
 * Show help message
 */
function showHelp() {
  console.log(`
${colors.bright}SQL Migration Executor for Supabase${colors.reset}

Executes SQL statements via Supabase REST API with proper error handling.

${colors.bright}Usage:${colors.reset}
  node execute-sql.js [options]

${colors.bright}Options:${colors.reset}
  --file, -f <path>     Path to SQL file 
                        (default: ../supabase/migrations/999_complete_migration.sql)
  --env, -e <path>      Path to .env file
                        (searches: .env.local, apps/admin-dashboard/.env.local)
  --dry-run, -d         Parse SQL without executing
  --continue, -c        Continue on error (default: stop on first error)
  --verbose, -v         Show verbose output with full SQL statements
  --help, -h            Show this help message

${colors.bright}Environment Variables:${colors.reset}
  NEXT_PUBLIC_SUPABASE_URL     Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY    Supabase service role key

${colors.bright}Examples:${colors.reset}
  node execute-sql.js
  node execute-sql.js -f ./my-migration.sql -e ./.env
  node execute-sql.js --dry-run --verbose
  node execute-sql.js --continue -v
`);
}

/**
 * Load environment variables from file
 */
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      envVars[key] = value;
    }
  });

  return envVars;
}

/**
 * Find and load environment configuration
 */
function loadConfig(options) {
  const searchPaths = [];
  
  if (options.envFile) {
    searchPaths.push(options.envFile);
  }
  
  // Common locations
  searchPaths.push(
    path.join(__dirname, '..', 'apps', 'admin-dashboard', '.env.local'),
    path.join(__dirname, '..', 'apps', 'admin-dashboard', '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env')
  );

  let envVars = {};
  let loadedFrom = null;

  for (const envPath of searchPaths) {
    if (fs.existsSync(envPath)) {
      envVars = loadEnvFile(envPath);
      if (Object.keys(envVars).length > 0) {
        loadedFrom = envPath;
        break;
      }
    }
  }

  // Merge with process.env (process.env takes precedence)
  const config = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY,
  };

  return { config, loadedFrom };
}

/**
 * SQL Parser - splits SQL into individual statements
 * Handles dollar-quoted strings, comments, and semicolons
 */
class SQLParser {
  constructor(sql) {
    this.sql = sql;
    this.position = 0;
    this.statements = [];
  }

  /**
   * Parse SQL and return array of statements
   */
  parse() {
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarQuoteTag = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inLineComment = false;
    let inBlockComment = false;
    let escaped = false;

    const chars = this.sql.split('');

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const nextChar = chars[i + 1] || '';
      const prevChar = chars[i - 1] || '';

      // Handle line comments (--)
      if (!inDollarQuote && !inSingleQuote && !inDoubleQuote && !inBlockComment) {
        if (char === '-' && nextChar === '-') {
          inLineComment = true;
          currentStatement += char;
          continue;
        }
        if (inLineComment && char === '\n') {
          inLineComment = false;
          currentStatement += char;
          continue;
        }
        if (inLineComment) {
          currentStatement += char;
          continue;
        }
      }

      // Handle block comments (/* */)
      if (!inDollarQuote && !inSingleQuote && !inDoubleQuote && !inLineComment) {
        if (char === '/' && nextChar === '*') {
          inBlockComment = true;
          currentStatement += char;
          continue;
        }
        if (inBlockComment && char === '*' && nextChar === '/') {
          inBlockComment = false;
          currentStatement += char + nextChar;
          i++; // Skip next char
          continue;
        }
        if (inBlockComment) {
          currentStatement += char;
          continue;
        }
      }

      // Handle dollar-quoted strings ($tag$...$tag$)
      if (!inSingleQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
        if (char === '$') {
          if (!inDollarQuote) {
            // Look for opening tag
            const match = this.sql.substring(i).match(/^\$([A-Za-z0-9_]*)\$/);
            if (match) {
              inDollarQuote = true;
              dollarQuoteTag = match[1];
              currentStatement += match[0];
              i += match[0].length - 1;
              continue;
            }
          } else {
            // Look for closing tag
            const closingTag = `$${dollarQuoteTag}$`;
            if (this.sql.substring(i, i + closingTag.length) === closingTag) {
              inDollarQuote = false;
              dollarQuoteTag = '';
              currentStatement += closingTag;
              i += closingTag.length - 1;
              continue;
            }
          }
        }
      }

      // Handle single quotes
      if (!inDollarQuote && !inDoubleQuote && !inLineComment && !inBlockComment) {
        if (char === "'" && !escaped) {
          inSingleQuote = !inSingleQuote;
        }
        escaped = char === '\\' && !escaped;
      }

      // Handle double quotes
      if (!inDollarQuote && !inSingleQuote && !inLineComment && !inBlockComment) {
        if (char === '"' && !escaped) {
          inDoubleQuote = !inDoubleQuote;
        }
      }

      currentStatement += char;

      // Statement terminator
      if (char === ';' && !inDollarQuote && !inSingleQuote && !inDoubleQuote && 
          !inLineComment && !inBlockComment) {
        const trimmed = currentStatement.trim();
        if (trimmed) {
          this.statements.push(trimmed);
        }
        currentStatement = '';
      }
    }

    // Handle last statement without semicolon
    const trimmed = currentStatement.trim();
    if (trimmed) {
      this.statements.push(trimmed + ';');
    }

    return this.statements;
  }

  /**
   * Get statement type for better logging
   */
  static getStatementType(statement) {
    const upper = statement.toUpperCase().trim();
    
    if (upper.startsWith('CREATE TABLE')) return 'CREATE TABLE';
    if (upper.startsWith('CREATE INDEX')) return 'CREATE INDEX';
    if (upper.startsWith('CREATE UNIQUE INDEX')) return 'CREATE UNIQUE INDEX';
    if (upper.startsWith('CREATE OR REPLACE FUNCTION')) return 'CREATE FUNCTION';
    if (upper.startsWith('CREATE FUNCTION')) return 'CREATE FUNCTION';
    if (upper.startsWith('CREATE OR REPLACE TRIGGER')) return 'CREATE TRIGGER';
    if (upper.startsWith('CREATE TRIGGER')) return 'CREATE TRIGGER';
    if (upper.startsWith('CREATE EXTENSION')) return 'CREATE EXTENSION';
    if (upper.startsWith('CREATE TYPE')) return 'CREATE TYPE';
    if (upper.startsWith('CREATE POLICY')) return 'CREATE POLICY';
    if (upper.startsWith('ALTER TABLE')) return 'ALTER TABLE';
    if (upper.startsWith('DROP TABLE')) return 'DROP TABLE';
    if (upper.startsWith('DROP INDEX')) return 'DROP INDEX';
    if (upper.startsWith('DROP FUNCTION')) return 'DROP FUNCTION';
    if (upper.startsWith('DROP TRIGGER')) return 'DROP TRIGGER';
    if (upper.startsWith('INSERT INTO')) return 'INSERT';
    if (upper.startsWith('UPDATE ')) return 'UPDATE';
    if (upper.startsWith('DELETE FROM')) return 'DELETE';
    if (upper.startsWith('SELECT ')) return 'SELECT';
    if (upper.startsWith('GRANT ')) return 'GRANT';
    if (upper.startsWith('REVOKE ')) return 'REVOKE';
    if (upper.startsWith('COMMENT ON')) return 'COMMENT';
    if (upper.startsWith('--')) return 'COMMENT';
    
    return 'SQL';
  }

  /**
   * Extract object name from statement for better logging
   */
  static extractObjectName(statement) {
    const upper = statement.toUpperCase();
    const type = this.getStatementType(statement);
    
    // Try to extract name after the type keywords
    const patterns = [
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.]+)/i,
      /CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.]+)/i,
      /CREATE\s+UNIQUE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.]+)/i,
      /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+([\w.]+)/i,
      /CREATE\s+FUNCTION\s+([\w.]+)/i,
      /CREATE\s+OR\s+REPLACE\s+TRIGGER\s+([\w.]+)/i,
      /CREATE\s+TRIGGER\s+([\w.]+)/i,
      /CREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?([\w.]+)/i,
      /CREATE\s+TYPE\s+([\w.]+)/i,
      /CREATE\s+POLICY\s+([\w.]+)/i,
      /ALTER\s+TABLE\s+([\w.]+)/i,
    ];

    for (const pattern of patterns) {
      const match = statement.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}

/**
 * Supabase SQL Executor using REST API
 */
class SupabaseSQLExecutor {
  constructor(supabaseUrl, serviceRoleKey) {
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
    this.baseUrl = supabaseUrl.replace(/\/$/, '');
  }

  /**
   * Execute a single SQL statement
   */
  async execute(sql, statementType, objectName) {
    const url = `${this.baseUrl}/rest/v1/rpc/exec_sql`;
    
    // Alternative: Use raw SQL endpoint if exec_sql not available
    const fallbackUrl = `${this.baseUrl}/rest/v1/`;

    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({ query: sql });
      
      const parsedUrl = new URL(url);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.serviceRoleKey}`,
          'apikey': this.serviceRoleKey,
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      Logger.verbose(`Request URL: ${url}`);
      Logger.verbose(`Statement type: ${statementType}`);
      if (objectName) Logger.verbose(`Object: ${objectName}`);

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          // 200-299 are success codes
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              success: true,
              statusCode: res.statusCode,
              data: data ? JSON.parse(data) : null,
            });
          } else {
            let errorMessage = `HTTP ${res.statusCode}`;
            try {
              const errorData = JSON.parse(data);
              errorMessage = errorData.message || errorData.error || errorMessage;
              if (errorData.hint) errorMessage += ` (Hint: ${errorData.hint})`;
              if (errorData.details) errorMessage += ` - ${errorData.details}`;
            } catch {
              errorMessage += `: ${data}`;
            }
            reject(new Error(errorMessage));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Test connection to Supabase
   */
  async testConnection() {
    try {
      // Try a simple query
      const result = await this.execute('SELECT 1 as connection_test;', 'SELECT', 'connection_test');
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArgs();

  if (options.showHelp) {
    showHelp();
    process.exit(0);
  }

  Logger.header('SQL Migration Executor for Supabase');

  // Load configuration
  const { config, loadedFrom } = loadConfig(options);
  
  if (loadedFrom) {
    Logger.info(`Loaded environment from: ${loadedFrom}`);
  } else {
    Logger.warn('No .env file found. Using environment variables or command line args.');
  }

  // Validate configuration
  if (!config.supabaseUrl) {
    Logger.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    Logger.info('Set it in your .env file or pass as environment variable');
    process.exit(1);
  }

  if (!config.serviceRoleKey) {
    Logger.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    Logger.info('Set it in your .env file or pass as environment variable');
    process.exit(1);
  }

  Logger.info(`Supabase URL: ${config.supabaseUrl}`);
  Logger.info(`SQL File: ${options.file}`);
  
  if (options.dryRun) {
    Logger.warn('DRY RUN MODE - No SQL will be executed');
  }

  Logger.divider();

  // Read SQL file
  if (!fs.existsSync(options.file)) {
    Logger.error(`SQL file not found: ${options.file}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(options.file, 'utf-8');
  Logger.info(`SQL file size: ${sqlContent.length} bytes`);

  // Parse SQL into statements
  const parser = new SQLParser(sqlContent);
  const statements = parser.parse();
  
  Logger.info(`Parsed ${statements.length} SQL statements`);
  Logger.divider();

  if (statements.length === 0) {
    Logger.warn('No SQL statements found in file');
    process.exit(0);
  }

  // Dry run: just show what would be executed
  if (options.dryRun) {
    Logger.header('Dry Run - Statements to Execute');
    statements.forEach((stmt, index) => {
      const type = SQLParser.getStatementType(stmt);
      const name = SQLParser.extractObjectName(stmt);
      const displayName = name ? ` (${name})` : '';
      console.log(`${(index + 1).toString().padStart(3)}. ${type}${displayName}`);
      if (options.verbose) {
        console.log(colors.dim + stmt.substring(0, 200) + (stmt.length > 200 ? '...' : '') + colors.reset);
        console.log();
      }
    });
    Logger.divider();
    Logger.success('Dry run completed');
    process.exit(0);
  }

  // Initialize executor and test connection
  const executor = new SupabaseSQLExecutor(config.supabaseUrl, config.serviceRoleKey);
  
  Logger.info('Testing connection to Supabase...');
  const connectionTest = await executor.testConnection();
  
  if (!connectionTest.success) {
    Logger.error(`Connection failed: ${connectionTest.error}`);
    Logger.info('Please check:');
    Logger.info('  1. Your Supabase URL is correct');
    Logger.info('  2. Your service role key is valid');
    Logger.info('  3. Network connectivity to Supabase');
    Logger.info('  4. The exec_sql RPC function exists in your database');
    process.exit(1);
  }
  
  Logger.success('Connection successful');
  Logger.divider();

  // Execute statements
  Logger.header('Executing SQL Statements');
  
  const results = {
    total: statements.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const type = SQLParser.getStatementType(statement);
    const name = SQLParser.extractObjectName(statement);
    const displayName = name ? ` (${name})` : '';
    const progressMsg = `${type}${displayName}`;

    Logger.progress(i + 1, statements.length, progressMsg);
    Logger.verbose(`Full statement:\n${statement}`);

    try {
      await executor.execute(statement, type, name);
      results.successful++;
      Logger.success(`Statement ${i + 1}/${statements.length}: ${type}${displayName}`);
    } catch (error) {
      results.failed++;
      results.errors.push({
        statement: i + 1,
        type,
        name,
        error: error.message,
        sql: statement.substring(0, 200) + (statement.length > 200 ? '...' : ''),
      });
      
      Logger.error(`Statement ${i + 1}/${statements.length} failed: ${type}${displayName}`);
      Logger.error(`  Error: ${error.message}`);

      if (!options.continueOnError) {
        Logger.divider();
        Logger.error('Execution stopped due to error');
        Logger.info('Use --continue or -c flag to continue on errors');
        break;
      }
    }
  }

  // Summary
  Logger.divider();
  Logger.header('Execution Summary');
  
  console.log(`  Total statements: ${results.total}`);
  console.log(`  ${colors.green}Successful: ${results.successful}${colors.reset}`);
  console.log(`  ${results.failed > 0 ? colors.red : colors.green}Failed: ${results.failed}${colors.reset}`);

  if (results.errors.length > 0) {
    Logger.divider();
    Logger.header('Error Details');
    results.errors.forEach((err, index) => {
      console.log(`\n${colors.red}Error ${index + 1}:${colors.reset}`);
      console.log(`  Statement: ${err.statement}`);
      console.log(`  Type: ${err.type}`);
      if (err.name) console.log(`  Object: ${err.name}`);
      console.log(`  Message: ${err.error}`);
      if (options.verbose) {
        console.log(`  SQL: ${err.sql}`);
      }
    });
  }

  Logger.divider();
  
  if (results.failed === 0) {
    Logger.success('All statements executed successfully!');
    process.exit(0);
  } else if (options.continueOnError) {
    Logger.warn(`Completed with ${results.failed} error(s)`);
    process.exit(1);
  } else {
    Logger.error('Execution failed');
    process.exit(1);
  }
}

// Run main function
main().catch((error) => {
  Logger.error(`Unexpected error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
