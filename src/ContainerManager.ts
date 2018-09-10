import { Provider } from './interfaces';
import { Container, injectable } from 'inversify';
import { ContainerNode } from './ContainerNode';

@injectable()
export class ContainerManager {
  public rootNode: ContainerNode;

  constructor (rootContainer: Container, rootProviders: Provider[] = []) {
    this.rootNode = new ContainerNode(rootContainer, rootProviders);
    rootContainer.bind(ContainerManager).toConstantValue(this);
  }
}
