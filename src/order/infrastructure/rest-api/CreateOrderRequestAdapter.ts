import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsISO31661Alpha3,
  ValidateNested,
} from 'class-validator';

import { EntityId } from '../../../common/domain/EntityId';
import { Validatable } from '../../../common/domain/Validatable';
import { Item, ItemProps } from '../../domain/entity/Item';
import { CreateOrderRequest } from '../../domain/use-case/create-order/CreateOrderRequest';

class BaseCreateOrderRequestAdapter implements CreateOrderRequest {
  /*
   * Nest.js first performs transformation, then validation, so, the process is like:
   * HTTP request -> customerId: "string" ->
   * class-transformer Transform() -> EntityId ->
   * class-validator Validate()
   * https://github.com/nestjs/nest/blob/fa494041c8705dc0600ddf623fb5e1e676932221/packages/common/pipes/validation.pipe.ts#L96
   */
  @ValidateNested()
  @Type(() => EntityId)
  @Transform(
    ({ value: customerIdRaw }: { value: string }) =>
      new EntityId(customerIdRaw),
    { toClassOnly: true },
  )
  readonly customerId: EntityId;

  @IsISO31661Alpha3()
  readonly originCountry: string;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @IsArray()
  @Type(() => Item)
  @Transform(
    ({ value: items }: { value: ItemProps[] }) =>
      items.map(item => new Item(item)),
    { toClassOnly: true },
  )
  readonly items: Item[];
}

export class CreateOrderRequestAdapter extends Validatable(
  BaseCreateOrderRequestAdapter,
) {}
