import { EntityFilter } from '../../../common/persistence';
import { UUID } from '../../../common/domain';
import { Photo } from '../../infrastructure/persistence/order/OrderMongoMapper';

export type Gram = number;

export type PhysicalItem = Readonly<{
  id: UUID;
  weight: Gram;
}>;

export type Item = PhysicalItem &
  Readonly<{
    title: string;
    storeName: string;
    // TODO: Separate optional fields into separate interface
    photos: Photo[];
    receivedDate: Date;
  }>;

export type DraftedItem = Pick<Item, 'id' | 'title' | 'storeName' | 'weight'>;
export type ReceivedItem = DraftedItem & Pick<Item, 'receivedDate'>;
export type FinalizedItem = ReceivedItem & Pick<Item, 'photos'>;

export type ItemFilter = EntityFilter<Item, { itemId: UUID }>;
