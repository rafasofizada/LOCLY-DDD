import { ClientSession } from 'mongodb';
import { EntityId } from '../../../common/domain/EntityId';
import { Country } from '../../domain/data/Country';
import { ConfirmedOrder } from '../../domain/entity/ConfirmedOrder';
import { Host } from '../../domain/entity/Host';

export abstract class HostRepository {
  abstract addHost(host: Host, transaction?: ClientSession): Promise<void>;

  abstract addManyHosts(
    hosts: Host[],
    transaction?: ClientSession,
  ): Promise<void>;

  // This should always be used together with OrderRepository.addHostToOrder
  abstract addOrderToHost(
    host: Host,
    order: ConfirmedOrder,
    transaction?: ClientSession,
  ): Promise<void>;

  abstract findHost(
    hostId: EntityId,
    transaction?: ClientSession,
  ): Promise<Host>;

  abstract deleteHost(
    hostId: EntityId,
    transaction?: ClientSession,
  ): Promise<void>;

  abstract deleteManyHosts(
    hostIds: EntityId[],
    transaction?: ClientSession,
  ): Promise<void>;

  abstract findHostAvailableInCountryWithMinimumNumberOfOrders(
    country: Country,
    transaction?: ClientSession,
  ): Promise<Host>;
}
