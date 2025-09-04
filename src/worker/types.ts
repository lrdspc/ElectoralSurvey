import { Context } from 'hono';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CustomContext extends Context {
  get: {
    (key: 'user'): User;
    <T>(key: string): T;
  };
  set: {
    (key: 'user', value: User): void;
    (key: string, value: any): void;
  };
}