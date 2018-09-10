react-inject-props
----

[![Build Status](https://travis-ci.org/awaw00/react-inject-props.svg?branch=master)](https://travis-ci.org/awaw00/react-inject-props)
[![npm version](https://badge.fury.io/js/react-inject-props.svg)](https://badge.fury.io/js/react-inject-props)
[![Dependency Status](https://david-dm.org/awaw00/react-inject-props.svg)](https://badge.fury.io/js/react-inject-props)

Inject props to your react component.

## 💾 Installation

`npm i inversify react-inject-props --save`

or

`yarn add inversify react-inject-props`

with typescript, you should install the "reflect-metadata" package as well:

`npm i reflect-metadata --save` or `yarn add reflect-metadata`

## ▶ Usage

- [get decorators](#decorators-creation)
- inject
  - [class](#class-injection)
  - [value](#value-injection)
  - [factory](#factory-injectiondynamic-value)
- [hierarchical injection](#hierarchical-injection)
- [useExisting](#use-existing-provider-if-already-bounded)
- [get container from props](#get-container-instance)
- [use ContainerContext directly](#use-containercontext-directly)

### Decorators creation
you can create decorators `InjectProps` and `ProvideProps` use `createPropsDecorators` function with a inversify container instance as the root container:

```typescript
import { Container } from 'inversify';
import { createPropsDecorators } from 'react-inject-props';

const container = new Container();
const {InjectProps, ProvideProps} = createPropsDecorators(container);
```

if rootContainer not specified, `createPropsDecorators` will create it internally, you can take it from the function result:

```typescript
import { createPropsDecorators } from 'react-inject-props';

const {InjectProps, ProvideProps, containerManager} = createPropsDecorators();
const rootContainer = containerManager.rootNode.container;
```

`react-inject-props` also exported `InjectProps`, `ProvideProps` and `containerManager` returned by `createPropsDecorators()`.

### Class injection

```typescript
import { injectable } from 'inversify';
import React from 'react';
import { render } from 'react-dom';

@injectable()
class Service {
  greeting () {
    console.log('hello world');
  }
}

// or simply
// @ProvideProps([
//   Service
// ])
@ProvideProps([
  {provide: Service, useClass: Service}
])
export class App extends React.Component {
  render () {
    return ...;
  }
}

interface PageProps {
  service?: Service;
}

@InjectProps({
  service: Service
})
export class Page extends React.Component<PageProps> {
  componentDidMount () {
    this.props.service!.greeting();
  }
  ...
}

render((
  <App>
    <Page/>
  </App>
), document.getElementById('root'));
```

in `Page` component, we can access `Service` instance by `this.props.service`, because we bind `Service` to container at `App` component with `ProvideProps` decorator and "Inject" it as `this.props.service` by `InjectProps`.

### Value Injection

```typescript
interface AppConfig {
  siteName: string;
}

const AppConfigToken = Symbol('appConfig');
const appConfig: AppConfig = {
  siteName: 'Github'
};

@ProvideProps([
  {provide: AppConfigToken, useValue: appConfig}
])
export class App extends React.Component {
}

interface PageProps {
  appConfig?: AppConfig
}

@InjectProps({
  appConfig: AppConfigToken
})
export class Page extends React.Component<PageProps> {
  componentDidMount () {
    console.log(this.props.appConfig!.siteName);
  }
}
```

### Factory Injection(dynamic value)

```typescript
@injectable()
class Service {
  getConfig () {
    return {
      siteName: 'Github'
    };
  }
}
const AppConfigToken = Symbol('appConfig');
function getAppConfig (service: Service) {
  return service.getConfig();
}

@ProvideProps([
  Service,
  {provide: AppConfigToken, useFactory: getAppConfig, deps: [Service]}
])
export class App extends React.Component {
}

interface PageProps {
  appConfig?: AppConfig
}

@InjectProps({
  appConfig: AppConfigToken
})
export class Page extends React.Component<PageProps> {
  componentDidMount () {
    console.log(this.props.appConfig!.siteName);
  }
}
```

### hierarchical injection

we can use multiple `ProvideProps` decorators in different hierarchies to implement an hierarchical injection system.

```typescript
@injectable()
class Service {
  id = Math.random();
}
@ProvideProps([
  Service
])
class App extends React.Component {}

@InjectProps({
  service: Service
})
class PageA extends React.Component {}

@InjectProps({
  service: Service
})
class CompInPageA extends React.Component {}

@ProvideProps([
  Service
])
@InjectProps({
  service: Service
})
class PageB extends React.Component {}


render((
  <App>
    <PageA>
      <CompInPageA/>
    </PageA>
    <PageB/>
  </App>
), ...);
```

in the above example, `PageA.props.service` is equals to `CompInPageA.props.service` and difference to `PageB.props.service`, case PageB is reprovide a `Service`.

### Use existing provider if already bounded

```typescript
@ProvideProps([
  {provide: Service, useClass: Service, useExisting: true}
])
class Comp extends React.Component { }

render ((
  <App>
    <Comp/>
  </App>
), ...);
```

if `Service` can be resolved in App's providers or `rootContainer`, the `Service` provider will be ignored.

### Get container instance

```typescript
import { Container } from 'inversify';

interface CompProps {
  container: Container;
}

@ProvideProps([
  Service
])
class Comp extends React.Component<CompProps> {
  componentDidMount () {
    const {container} = this.props;
    ...
  }
}
```

container of current component's hierarchy will also inject in component.props when use `ProvideProps` or `InjectProps` decorator.

### Use ContainerContext directly

```typescript
import { ContainerContext } from 'react-inject-props';

// or

import { createPropsDecorators } from 'react-inject-props';
const {ContainerContext} = createPropsDecorators();

// then use it in your component

class Comp extends React.Component {
  render () {
    return (
      <ContainerContext.Provider value={xxx}>
        ...
          ...
            <ContainerContext.Consumer>
              {(container: Container) => {
                ...
              }}
            </ContainerContext.Consumer>
          ...
        ...
      </ContainerContext.Provider>
    );
  }
}
```
