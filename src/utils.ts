import { Container, interfaces } from 'inversify';
import { Provider, ClassProvider, ValueProvider, FactoryProvider } from './interfaces';

export function isClassProvider (provider: Provider): provider is ClassProvider {
  return (<any>provider).provide && typeof (<any>provider).useClass === 'function' || typeof provider === 'function';
}

export function isValueProvider (provider: Provider): provider is ValueProvider {
  return 'useValue' in provider;
}

export function isFactoryProvider (provider: Provider): provider is FactoryProvider {
  return 'useFactory' in provider;
}

export function filterPropsNeedInject (propsFromParent: any, propsNeedInject: any) {
  const _propsNeedInject = {...propsNeedInject};
  for (const key in propsFromParent) {
    if (key in propsNeedInject) {
      delete _propsNeedInject[key];
    }
  }

  return _propsNeedInject;
}

export function resolveProps (container: Container, propsNeedInject: any) {
  const injectedProps: any = {};
  for (const propsKey in propsNeedInject) {
    if (propsNeedInject.hasOwnProperty(propsKey)) {
      const propsType = propsNeedInject[propsKey];
      injectedProps[propsKey] = container.get(propsType);
    }

  }
  return injectedProps;
}

export function bindProviders (parentContainer: Container, providers: any[]) {
  const container = parentContainer.createChild(parentContainer.options);

  let needBind;
  for (let provider of providers) {
    const provide: interfaces.ServiceIdentifier<any> = typeof provider === 'function' ? provider : provider.provide;
    let provideClass: any;
    let provideValue: any;
    let provideFactory: any;
    let factoryDeps: any[] = [];
    let useExisting = false;

    if (isClassProvider(provider)) {
      if (typeof provider === 'function') {
        provideClass = provider;
      } else {
        provideClass = provider.useClass;
        useExisting = provider.useExisting === true;
      }
    } else if (isValueProvider(provider)) {
      provideValue = provider.useValue;
      useExisting = provider.useExisting === true;
    } else if (isFactoryProvider(provider)) {
      provideFactory = provider.useFactory;
      factoryDeps = provider.deps || [];
      useExisting = provider.useExisting === true;
    }

    if (useExisting) {
      if (parentContainer.isBound(provide)) {
        continue;
      }
    }

    needBind = true;

    if (useExisting) {
      if (container.isBound((provide))) {
        continue;
      }
    }

    if (provideClass) {
      container.bind(provide).to(provideClass).inSingletonScope();
    } else if (provideValue !== void 0) {
      container.bind(provide).toConstantValue(provideValue);
    } else if (provideFactory) {
      if (factoryDeps.length > 0) {
        const orgProvideFactory = provideFactory;
        provideFactory = (context: interfaces.Context) => {
          const deps = factoryDeps.map(dep => {
            return context.container.get(dep);
          });
          return orgProvideFactory.apply(null, deps);
        };
      }
      container.bind(provide).toDynamicValue(provideFactory);
    }
  }

  if (needBind) {
    return container;
  }

  return null;
}
