import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsInt,
  IsISO31661Alpha3,
  IsNotEmptyObject,
  IsPositive,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { Country } from '../../entity/Country';
import { Gram } from '../../entity/Item';
import { UseCase } from '../../../common/application';
import { WithoutId } from '../../../common/domain';
import { DraftedItem } from '../../entity/Item';
import { DraftedOrder } from '../../entity/Order';

interface DraftItemRequest extends WithoutId<DraftedItem> {}

export interface DraftOrderPayload
  extends Pick<DraftedOrder, 'customerId' | 'originCountry' | 'destination'> {
  readonly items: DraftItemRequest[];
}

class DraftItemRequestSchema implements DraftItemRequest {
  @IsString()
  @Length(5, 280)
  title: string;

  @IsString()
  @Length(2, 50)
  storeName: string;

  @IsInt()
  @IsPositive()
  weight: Gram;
}

class AddressRequestSchema {
  @IsISO31661Alpha3()
  country: Country;
}

export class DraftOrderRequest
  implements Omit<DraftOrderPayload, 'customerId'> {
  @IsISO31661Alpha3()
  readonly originCountry: Country;

  @ValidateNested()
  @IsNotEmptyObject()
  @IsDefined()
  @Type(() => AddAddressRequest)
  readonly destination: AddAddressRequest;

  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @IsArray()
  @Type(() => DraftItemRequestSchema)
  readonly items: DraftItemRequestSchema[];
}

export abstract class IDraftOrder extends UseCase<
  DraftOrderPayload,
  DraftedOrder
> {}
