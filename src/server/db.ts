import mongoose from 'mongoose';

export const DEFAULT_MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://portfolio08292:portfolio136366@cluster0.xqhmhxd.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0';

export interface DbStatus {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  uriConfigured: string;
  databaseName: string;
  host?: string;
  pingMs?: number;
  lastConnectedAt?: string;
  lastError?: string;
}

let connectionState: DbStatus = {
  status: 'disconnected',
  uriConfigured: maskUri(DEFAULT_MONGODB_URI),
  databaseName: 'portfolio',
};

function maskUri(uri: string): string {
  try {
    return uri.replace(/:([^@]+)@/, ':*****@');
  } catch {
    return 'mongodb+srv://*****';
  }
}

export async function connectToDatabase(customUri?: string) {
  const uriToUse = customUri || process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  try {
    if (mongoose.connection.readyState === 1 && (!customUri || customUri === DEFAULT_MONGODB_URI)) {
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
