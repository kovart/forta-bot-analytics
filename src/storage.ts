import axis, { AxiosResponse } from 'axios';
import { fetchJwt } from 'forta-agent';

const DATABASE_URL = 'https://research.forta.network/database/bot/';

export type LogFunction = (...args: any[]) => unknown;

export interface IBotStorage<T extends object> {
  load(key: string): Promise<T | null>;
  save(key: string, obj: T): Promise<void>;
}

export class InMemoryBotStorage<T extends object> implements IBotStorage<T> {
  private readonly log: LogFunction;
  private readonly storage: Map<string, unknown>;

  constructor(log?: LogFunction) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.log = log || (() => {});
    this.storage = new Map<string, unknown>();
  }

  async load<T>(key: string): Promise<T | null> {
    return <T>this.storage.get(key) || null;
  }

  async save(key: string, obj: T) {
    this.storage.set(key, obj);
  }
}

export class FortaBotStorage<T extends object> implements IBotStorage<T> {
  private readonly log: LogFunction;

  constructor(log?: LogFunction) {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.log = log || (() => {});
  }

  private async getClient() {
    const token: string | undefined = await fetchJwt({});

    if (!token) {
      throw new Error('Cannot fetch token jwt');
    }

    this.log('Fetched token', token.slice(0, 4) + '...');

    return axis.create({
      baseURL: DATABASE_URL,
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
  }

  async load<T>(key: string): Promise<T | null> {
    const client = await this.getClient();

    let response: AxiosResponse;

    try {
      response = await client.get(key);
      this.log(`Fetched data: ${key}`);
      if (!response.data) {
        throw new Error('Data is missing');
      }
    } catch (e) {
      this.log(`Data doesn't exist: ${key}`);
      return null;
    }

    try {
      return response.data;
    } catch (e) {
      this.log(`Cannot parse fetched data: ${key}`, e);
      throw e;
    }
  }

  async save(key: string, obj: T) {
    const client = await this.getClient();

    try {
      await client.post(key, obj);
      this.log(`Uploaded ${key}`);
    } catch (e) {
      this.log('Cannot upload data', e);
      throw e;
    }
  }
}
