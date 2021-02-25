import { IsISO31661Alpha3 } from 'class-validator';

import { Country } from '../data/Country';

import { StructurallyComparable } from '../../../common/domain/StructurallyComparable';
import { Validatable } from '../../../common/domain/Validatable';

export class AddressProps {
  @IsISO31661Alpha3()
  country: Country;
}

export class Address extends StructurallyComparable(Validatable(AddressProps)) {
  // default value is needed for class-validator plainToClass. Refer to: Order.ts
  constructor({ country }: AddressProps = new AddressProps()) {
    super();

    this.country = country;
  }
}
