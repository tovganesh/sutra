import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  max?: number;
}

export class DatabaseService {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      connectionString: config.connectionString,
      host: config.host || 'localhost',
      port: config.port || 5432,
      user: config.user || 'sutra_admin',
      password: config.password || 'sutra_secure_pass',
      database: config.database || 'sutra_db',
      max: config.max || 20,
    });

    this.pool.on('error', (err) => {
      console.error('[Sutra Database] Unexpected idle client error:', err);
    });
  }

  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Executes a parameterized query.
   */
  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  /**
   * Runs an operation inside a database transaction.
   */
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Closes the connection pool gracefully.
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}
