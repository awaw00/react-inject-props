import { Container, interfaces } from 'inversify';

export interface StandardClassProvider<T> {
  provide: interfaces.ServiceIdentifier<T>;
  useClass: interfaces.Newable<T>;
  useExisting?: boolean;
}

export type ClassProvider<T = any> = Function | StandardClassProvider<T> | interfaces.Newable<T>;

export interface ValueProvider<T = any> {
  provide: interfaces.ServiceIdentifier<T>;
  useValue: any;
  useExisting?: boolean;
}

export interface FactoryProvider<T = any> {
  provide: interfaces.ServiceIdentifier<T>;
  useFactory: (...args: any[]) => T | ((...args: any[]) => T);
  deps?: interfaces.ServiceIdentifier<any>[];
  useExisting?: boolean;
}

export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;

export interface ContainerNode {
  container: Container;
  providers: Provider[];
  parentNode?: ContainerNode;
  childNodes: ContainerNode[];
}
