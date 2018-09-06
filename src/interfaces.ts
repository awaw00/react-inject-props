import { interfaces } from 'inversify';

export interface StandardClassProvider<T> {
  provide: interfaces.ServiceIdentifier<T>;
  useClass: interfaces.Newable<T>;
}

export type ClassProvider<T = any> = Function | StandardClassProvider<T> | interfaces.Newable<T>;

export interface ValueProvider<T = any> {
  provide: interfaces.ServiceIdentifier<T>;
  useValue: any;
}

export interface FactoryProvider<T = any> {
  provide: interfaces.ServiceIdentifier<T>;
  useFactory: (...args: any[]) => T | ((...args: any[]) => T);
  deps?: interfaces.ServiceIdentifier<any>[];
}

export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;
