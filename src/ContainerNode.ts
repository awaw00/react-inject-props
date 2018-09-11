import { Container } from 'inversify';
import { Provider } from './interfaces';
import { resolveProps, bindProviders } from './utils';

export class ContainerNode {
  public parentNode?: ContainerNode;
  public childNodes: ContainerNode[] = [];

  constructor (public container: Container, public providers: Provider[] = []) {
  }

  public resolveProps (propsNeedInject: any) {
    return resolveProps(this.container, propsNeedInject);
  }

  public bindParent (parentNode: ContainerNode) {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }

    this.parentNode = parentNode;
    parentNode.appendChild(this);
  }

  public createChild (providers: Provider[]) {
    const childContainer = bindProviders(this.container, providers);

    if (!childContainer) {
      return false;
    }

    const childNode = new ContainerNode(childContainer, providers);
    this.appendChild(childNode);
    childNode.parentNode = this;

    return childNode;
  }

  public appendChild (childNode: ContainerNode) {
    this.childNodes.push(childNode);
  }

  public removeChild (childNode: ContainerNode) {
    const childIndex = this.childNodes.indexOf(childNode);
    if (childIndex < 0) {
      return;
    }

    this.childNodes.splice(childIndex, 1);
  }

  public getRootNode (): ContainerNode {
    if (this.parentNode) {
      return this.parentNode.getRootNode();
    }
    return this;
  }

  public destroy () {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }

    this.childNodes.forEach(child => {
      child.destroy();
    });

    this.container.unbindAll();
  }
}
