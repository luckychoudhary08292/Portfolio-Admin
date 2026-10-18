import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export const getMongoUri = () => process.env.MONGODB_URI || '';

export interface DbStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  uriConfigured: string;
  databaseName: string;
  host?: string;
  pingMs?: number;
  lastConnectedAt?: string;
  lastError?: string;
}

function maskUri(uri?: string): string {
  if (!uri) return 'Not configured (set MONGODB_URI)';
  try {
    return uri.replace(/:([^@]+)@/, ':*****@');
  } catch {
    return 'mongodb+srv://*****';
  }
}

let connectionState: DbStatus = {
  status: 'disconnected',
  uriConfigured: maskUri(getMongoUri()),
  databaseName: 'portfolio',
};

export async function connectToDatabase(customUri?: string) {
  const uriToUse = customUri || getMongoUri();

  if (!uriToUse) {
    connectionState = {
      status: 'error',
      uriConfigured: 'Not configured',
      databaseName: 'portfolio',
      lastError: 'MONGODB_URI environment variable is not defined. Please set MONGODB_URI in .env',
    };
    console.warn('[MongoDB] Cannot connect: MONGODB_URI environment variable is missing.');
    return { success: false, error: 'MONGODB_URI environment variable is missing.' };
  }

  try {
    if (mongoose.connection.readyState === 1 && (!customUri || customUri === getMongoUri())) {
      return { success: true, message: 'Already connected to MongoDB' };
    }

    if (customUri && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    connectionState.status = 'connecting';
    connectionState.lastError = undefined;

    console.log('[MongoDB] Connecting to cluster...');
    const start = Date.now();
    await mongoose.connect(uriToUse, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
      dbName: 'portfolio',
    });
    const pingMs = Date.now() - start;

    connectionState = {
      status: 'connected',
      uriConfigured: maskUri(uriToUse),
      databaseName: mongoose.connection.name || 'portfolio',
      host: mongoose.connection.host,
      pingMs,
      lastConnectedAt: new Date().toISOString(),
      lastError: undefined,
    };

    console.log(`[MongoDB] Successfully connected to ${mongoose.connection.host}/${mongoose.connection.name} in ${pingMs}ms`);
    return { success: true, pingMs };
  } catch (err: any) {
    console.error('[MongoDB] Connection error:', err.message);
    connectionState = {
      status: 'error',
      uriConfigured: maskUri(uriToUse),
      databaseName: 'portfolio',
      lastError: err.message || 'Failed to connect to MongoDB cluster',
    };
    return { success: false, error: err.message };
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('[MongoDB] Disconnected');
  if (connectionState.status !== 'error') {
    connectionState.status = 'disconnected';
  }
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection event error:', err);
  connectionState.status = 'error';
  connectionState.lastError = err.message;
});

export async function getDbStatus(): Promise<DbStatus> {
  const readyState = mongoose.connection.readyState;
  let currentStatus: DbStatus['status'] = 'disconnected';
  if (readyState === 1) currentStatus = 'connected';
  else if (readyState === 2) currentStatus = 'connecting';
  else if (connectionState.status === 'error') currentStatus = 'error';

  let pingMs: number | undefined;
  if (readyState === 1 && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - start;
    } catch (e: any) {
      // ping failed
    }
  }

  return {
    ...connectionState,
    status: currentStatus,
    host: mongoose.connection.host || connectionState.host,
    databaseName: mongoose.connection.name || 'portfolio',
    pingMs: pingMs ?? connectionState.pingMs,
  };
}
