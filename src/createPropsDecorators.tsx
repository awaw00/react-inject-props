import React from 'react';
import { Container } from 'inversify';
import { Provider } from './interfaces';
import { resolveProps, bindProviders } from './utils';

export function createPropsDecorators(rootContainer?: Container) {
  if (!rootContainer) {
    rootContainer = new Container();
  }
  const ContainerContext = React.createContext(rootContainer);

  function InjectProps<P = any>(propsNeedInject: {}) {
    return function(Comp: any) {
      class PropsInjector extends React.PureComponent {
        public render() {
          return (
            <ContainerContext.Consumer>
              {(c: Container) => {
                return <Comp {...this.props} {...resolveProps(c, propsNeedInject)} />;
              }}
            </ContainerContext.Consumer>
          );
        }
      }

      return PropsInjector as typeof Comp;
    };
  }

  function ProvideProps<P = any>(providers: Provider[]) {
    return function(Comp: any) {
      class PropsProvider extends React.PureComponent<P> {
        public render() {
          return (
            <ContainerContext.Consumer>
              {(container: Container) => {
                const childContainer = new Container();
                childContainer.parent = container;
                bindProviders(childContainer, providers);

                return (
                  <ContainerContext.Provider value={childContainer}>
                    <Comp {...this.props} />
                  </ContainerContext.Provider>
                );
              }}
            </ContainerContext.Consumer>
          );
        }
      }

      return PropsProvider as typeof Comp;
    };
  }

  return {
    InjectProps,
    ProvideProps,
    rootContainer,
  };
}
