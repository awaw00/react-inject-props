import React from 'react';
import { Container } from 'inversify';
import { Provider } from './interfaces';
import { filterPropsNeedInject, resolveProps, bindProviders } from './utils';
import { ContainerManager } from './ContainerManager';
import { ContainerNode } from './ContainerNode';

export function createPropsDecorators(rootContainer?: Container) {
  if (!rootContainer) {
    rootContainer = new Container();
  }

  const containerManager = new ContainerManager(rootContainer, []);

  const ContainerContext = React.createContext(containerManager.rootNode);

  function InjectProps<P = any>(propsNeedInject: {}) {
    let propsCache: any;
    return function(Comp: any) {
      class PropsInjector extends React.PureComponent<P> {
        public render() {
          const _propsNeedInject = filterPropsNeedInject(this.props, propsNeedInject);

          return (
            <ContainerContext.Consumer>
              {(c: ContainerNode) => {
                const injectProps = propsCache || c.resolveProps(_propsNeedInject);
                propsCache = injectProps;
                return <Comp container={c} {...injectProps} {...this.props} />;
              }}
            </ContainerContext.Consumer>
          );
        }
      }

      return PropsInjector as typeof Comp;
    };
  }

  function ProvideProps<P = any>(providers: Provider[]) {
    let childNodeCache: ContainerNode | false;
    return function(Comp: any) {
      class PropsProvider extends React.PureComponent<P> {
        public render() {
          return (
            <ContainerContext.Consumer>
              {(node: ContainerNode) => {
                let childNode: any;
                if (childNodeCache) {
                  childNode = childNodeCache;
                } else if (childNodeCache === false) {
                  childNode = null;
                } else {
                  childNode = node.createChild(providers);
                  childNodeCache = childNode;
                }

                if (childNode) {
                  return (
                    <ContainerContext.Provider value={childNode}>
                      <Comp containerNode={childNode} {...this.props} />
                    </ContainerContext.Provider>
                  );
                } else {
                  return <Comp containerNode={node} {...this.props} />;
                }
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
    containerManager,
    ContainerContext,
  };
}
