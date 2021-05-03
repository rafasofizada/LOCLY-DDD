import { UUID } from '../../../common/domain';
import { Country } from '../data/Country';
import { ItemProps } from '../entity/Item';
import { DraftOrder } from '../entity/DraftOrder';
import { UseCase } from '../../../common/domain';
import { Address } from '../entity/Address';
import { WithoutId } from '../../../common/domain';

export interface DraftOrderRequest {
  customerId: UUID;
  originCountry: Country;
  destination: Address;
  items: WithoutId<ItemProps>[];
}

export abstract class DraftOrderUseCase extends UseCase<
  DraftOrderRequest,
  DraftOrder
> {}
