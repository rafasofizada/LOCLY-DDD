import { IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { Address, AddressProps } from './Address';
import { EntityProps } from '../../../common/domain/Entity';
import { EntityId } from '../../../common/domain/EntityId';
import { EntityIdToStringId } from '../../../common/types';
import { Serializable } from '../../../common/domain/Serializable';
import { Identifiable } from '../../../common/domain/Identifiable';

export class CustomerProps extends EntityProps {
  @ValidateNested()
  @Type(() => Address)
  selectedAddress: Address;

  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => EntityId)
  @Transform(
    ({ value: ids }: { value: EntityId[] }) => ids.map(id => id.value),
    {
      toPlainOnly: true,
    },
  )
  orderIds: EntityId[];
}

export type CustomerPropsPlain = Omit<
  EntityIdToStringId<Required<CustomerProps>>,
  'selectedAddress' | 'orderIds'
> & {
  selectedAddress: AddressProps;
  orderIds: string[];
};

export class Customer extends Identifiable(
  Serializable<CustomerPropsPlain, typeof CustomerProps>(CustomerProps),
) {
  constructor(
    {
      id = new EntityId(),
      selectedAddress,
      orderIds,
    }: CustomerProps = new CustomerProps(),
  ) {
    super();

    this.id = id;
    this.selectedAddress = selectedAddress;
    this.orderIds = orderIds;
  }
}
