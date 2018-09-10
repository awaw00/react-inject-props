import 'reflect-metadata';
import React from 'react';
import { mount, shallow } from 'enzyme';
import { injectable, Container } from 'inversify';
import { expect } from 'chai';
import { createPropsDecorators } from './createPropsDecorators';
import { bindProviders } from './utils';
import sinon from 'sinon';

describe('Test', () => {
  it('Simple inject props', () => {
    const rootContainer = new Container();

    @injectable()
    class Service {

    }

    rootContainer.bind(Service).toSelf().inSingletonScope();

    const {InjectProps} = createPropsDecorators(rootContainer);

    @InjectProps({
      service: Service
    })
    class TestInject extends React.Component {
      render () {
        return null;
      }
    }

    const wrapper = mount(<TestInject/>);
    expect(wrapper.children().props().service).to.be.eq(rootContainer.get(Service));
  });

  it('Inject props to stateless function component', () => {
    const rootContainer = new Container();

    @injectable()
    class Service {

    }

    rootContainer.bind(Service).toSelf().inSingletonScope();

    const {InjectProps} = createPropsDecorators(rootContainer);

    const SFC = InjectProps({service: Service})((props: any) => null);

    const wrapper = mount(<SFC/>);
    expect(wrapper.children().props().service).to.be.eq(rootContainer.get(Service));
  });

  it('Hierarchical inject props', () => {
    const {ProvideProps, InjectProps} = createPropsDecorators();

    @injectable()
    class Service {

    }
    const globalConfig = {};

    @ProvideProps([
      {provide: Service, useClass: Service},
      {provide: 'CONFIG', useValue: globalConfig}
    ])
    class RootProviderLayer extends React.Component {
      render () {
        return this.props.children;
      }
    }

    @InjectProps({
      service: Service,
      config: 'CONFIG'
    })
    class Layer0 extends React.Component {
      render () {
        return this.props.children;
      }
    }

    @InjectProps({
      service: Service,
      config: 'CONFIG'
    })
    class Layer1 extends React.Component {
      render () {
        return this.props.children || null;
      }
    }

    @ProvideProps([
      Service,
      {provide: 'CONFIG', useValue: globalConfig}
    ])
    @InjectProps({
      service: Service,
      config: 'CONFIG'
    })
    class NewProviderLayer extends React.Component {
      render () {
        return this.props.children || null;
      }
    }

    @InjectProps({
      service: Service,
      config: 'CONFIG'
    })
    class Layer2 extends React.Component {
      render () {
        return this.props.children || null;
      }
    }

    const rootProviderWrapper = mount((
      <RootProviderLayer>
        <Layer0>
          <Layer1>
            <NewProviderLayer>
              <Layer2/>
            </NewProviderLayer>
          </Layer1>
        </Layer0>
      </RootProviderLayer>
    ));
    const props0 = rootProviderWrapper.find(Layer0).children().props();
    const props1 = rootProviderWrapper.find(Layer1).children().props();

    expect(props0.service).not.undefined;
    expect(props0.service).is.instanceOf(Service);
    expect(props0.service).is.eq(props1.service);
    expect(props0.config).is.eq(props1.config);

    const newProviderWrapper = rootProviderWrapper.find(NewProviderLayer);
    const propsNew = newProviderWrapper.children().children().props();
    expect(propsNew.service).not.eq(props0.service);
    expect(propsNew.config).is.eq(props0.config);

    const props2 = newProviderWrapper.find(Layer2).children().props();
    expect(props2.service).is.eq(propsNew.service);
    expect(props2.service).not.eq(props0.service);
    expect(props2.config).is.eq(props0.config);
  });

  it('Factory provider', () => {
    const {ProvideProps, InjectProps} = createPropsDecorators();

    @injectable()
    class Service {
      public getFoo () {
        return 'foo';
      }
    }

    function createFoo (service: Service) {
      return service.getFoo();
    }

    @ProvideProps([
      Service,
      {provide: 'foo', useFactory: createFoo, deps: [Service]}
    ])
    @InjectProps({
      foo: 'foo'
    })
    class TestComp extends React.Component {
      render () {
        return null;
      }
    }

    const wrapper = mount(<TestComp/>);
    expect(wrapper.children().children().props().foo).is.eq('foo');
  });

  it('Use existing', () => {
    @injectable()
    class ServiceA {
      name = 'service a';
    }

    @injectable()
    class NewServiceA {
      name = 'new service a';
    }

    @injectable()
    class ServiceB {
      name = 'service b';
    }

    @injectable()
    class NewServiceB {
      name = 'new service b';
    }

    const {ProvideProps, InjectProps} = createPropsDecorators();

    @ProvideProps([
      {provide: ServiceA, useClass: NewServiceA},
      {provide: ServiceB, useClass: NewServiceB},
      {provide: 'VALUE_A', useValue: 'new a'},
      {provide: 'VALUE_B', useValue: 'new b'},
      {provide: 'VALUE_A_FROM_FACTORY', useFactory: () => 'new a from factory'},
      {provide: 'VALUE_B_FROM_FACTORY', useFactory: () => 'new b from factory'},
    ])
    class RootProviderLayer extends React.Component {
      render () {
        return this.props.children || null
      }
    }

    @ProvideProps([
      {provide: ServiceA, useClass: ServiceA, useExisting: true},
      {provide: 'VALUE_A', useValue: 'default a', useExisting: true},
      {provide: 'VALUE_A_FROM_FACTORY', useFactory: () => 'default a from factory', useExisting: true},
      {provide: ServiceB, useClass: ServiceB},
      {provide: 'VALUE_B', useValue: 'default b'},
      {provide: 'VALUE_B_FROM_FACTORY', useFactory: () => 'default b from factory'}
    ])
    @InjectProps({
      serviceA: ServiceA,
      valueA: 'VALUE_A',
      valueAFromFactory: 'VALUE_A_FROM_FACTORY',
      serviceB: ServiceB,
      valueB: 'VALUE_B',
      valueBFromFactory: 'VALUE_B_FROM_FACTORY',
    })
    class SubProviderLayer extends React.Component {
      render () {
        return this.props.children || null;
      }
    }

    const wrapper = mount((
      <RootProviderLayer>
        <SubProviderLayer/>
      </RootProviderLayer>
    ));

    const subProviderProps = wrapper.find(SubProviderLayer).children().children().props();
    expect(subProviderProps.serviceA.name).is.eq('new service a');
    expect(subProviderProps.valueA).is.eq('new a');
    expect(subProviderProps.valueAFromFactory).is.eq('new a from factory');
    expect(subProviderProps.serviceB.name).is.eq('service b');
    expect(subProviderProps.valueB).is.eq('default b');
    expect(subProviderProps.valueBFromFactory).is.eq('default b from factory');
  });

  it('Should NOT provide new container if no providers need bind', () => {
    const container = new Container();

    @injectable()
    class Service {
    }

    container.bind(Service).toSelf();

    expect(bindProviders(container, [{provide: Service, useClass: Service, useExisting: true}])).is.eq(null);
    expect(bindProviders(container, [{provide: Service, useClass: Service}])).is.not.eq(null);
    expect(bindProviders(container, [])).is.eq(null);
  });

  it('Should children have same container options with parent container', () => {
    const options = {skipBaseClassChecks: true, autoBindInjectable: false};
    const rootContainer = new Container(options);
    const {ProvideProps, InjectProps} = createPropsDecorators(rootContainer);

    @injectable()
    class Service {

    }

    @ProvideProps([
      Service
    ])
    class App extends React.Component {
      render () {
        return null;
      }
    }

    const wrapper = mount(<App/>);

    const props = wrapper.children().props();
    expect(props.containerNode.container.parent).is.eq(rootContainer);
    expect(props.containerNode.container.options).is.deep.eq(rootContainer.options);
  });

  it('Should NOT inject prop which is already passed', () => {
    const rootContainer = new Container();
    const {InjectProps, ProvideProps} = createPropsDecorators(rootContainer);

    @injectable()
    class Service {

    }

    interface CompProps {
      service: Service;
    }

    @InjectProps({
      service: Service
    })
    class Comp extends React.Component<CompProps> {
      render () {
        return null;
      }
    }

    rootContainer.bind(Service).toSelf();

    const serviceFromParent = new Service();
    const serviceFromContainer = rootContainer.get(Service);
    const wrapper = mount(<Comp service={serviceFromParent}/>)

    expect(wrapper.children().props().service).is.not.eq(serviceFromContainer);
    expect(wrapper.children().props().service).is.eq(serviceFromParent);
  });

  it('Should NOT recreate container while component rerender', () => {
    const {ProvideProps, containerManager} = createPropsDecorators();

    const rootNode = containerManager.rootNode;

    @injectable()
    class Service {}

    @ProvideProps([
      Service
    ])
    class Comp extends React.Component {
      public render () {
        return null;
      }
    }

    const wrapper = mount(<Comp/>);

    expect(rootNode.childNodes.length).is.eq(1);
    wrapper.update();
    expect(rootNode.childNodes.length).is.eq(1);
  });

  it('Should NOT resolve props again while component rerender', () => {
    const rootContainer = new Container();
    const {InjectProps, containerManager} = createPropsDecorators(rootContainer);

    const rootNode = containerManager.rootNode;

    @injectable()
    class Service {}

    @InjectProps({
      service: Service
    })
    class Comp extends React.Component {
      public render () {
        return null;
      }
    }
    rootContainer.bind(Service).toSelf().inSingletonScope();

    const spy = sinon.spy(rootNode, 'resolveProps');

    const wrapper = mount(<Comp/>);

    wrapper.update();
    expect(spy.callCount).is.eq(1);

    spy.restore();
  });

  it('Should auto destroy container node after component unmounted', () => {
    const {InjectProps, ProvideProps, containerManager} = createPropsDecorators();
    const rootNode = containerManager.rootNode;

    @injectable()
    class Service {}

    @ProvideProps([
      Service
    ])
    class Comp extends React.Component {
      render () {
        return <div></div>;
      }
    }

    const wrapper = mount(<Comp/>);
    expect(rootNode.childNodes.length).is.eq(1);
    wrapper.unmount();
    expect(rootNode.childNodes.length).is.eq(0);
  });
});
