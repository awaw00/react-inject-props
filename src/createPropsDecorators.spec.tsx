import 'reflect-metadata';
import React from 'react';
import { mount, shallow } from 'enzyme';
import { injectable, Container } from 'inversify';
import { expect } from 'chai';
import { createPropsDecorators } from './createPropsDecorators';

describe('basic test', () => {
  it('simple inject props', () => {
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

  it('inject props to stateless function component', () => {
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

  it('auto generate root container', () => {
    const {rootContainer} = createPropsDecorators();
    expect(rootContainer).not.eq(undefined);
  });

  it('hierarchical inject props', () => {
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

  it('factory provider', () => {
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
});
