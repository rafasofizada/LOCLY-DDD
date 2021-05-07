import { OrderRepository } from '../port/OrderRepository';
import { CustomerRepository } from '../port/CustomerRepository';

import {
  DraftOrderRequest,
  DraftOrderUseCase,
} from '../../domain/use-case/DraftOrderUseCase';

import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectClient } from 'nest-mongodb';
import { ClientSession, MongoClient } from 'mongodb';
import { withTransaction } from '../../../common/application';
import {
  getShipmentCostQuote,
  ShipmentCostQuote,
  ShipmentCostQuoteFn,
} from './ShipmentCostCalculator/getShipmentCostQuote';
import { DraftedItem, Item } from '../../domain/entity/Item';
import { UUID } from '../../../common/domain';
import { Country } from '../../domain/data/Country';
import {
  Address,
  DraftedOrder,
  Cost,
  OrderStatus,
} from '../../domain/entity/Order';
import { throwCustomException } from '../../../common/error-handling';

@Injectable()
export class DraftOrderService implements DraftOrderUseCase {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly orderRepository: OrderRepository,
    @InjectClient() private readonly mongoClient: MongoClient,
  ) {}

  async execute(
    draftOrderRequest: DraftOrderRequest,
    session?: ClientSession,
  ): Promise<DraftedOrder> {
    const draftOrder: DraftedOrder = await withTransaction(
      (sessionWithTransaction: ClientSession) =>
        this.draftOrder(draftOrderRequest, sessionWithTransaction),
      this.mongoClient,
      session,
    );

    return draftOrder;
  }

  private async draftOrder(
    draftOrderRequest: DraftOrderRequest,
    session: ClientSession,
  ): Promise<DraftedOrder> {
    const draftOrder: DraftedOrder = this.constructDraftOrder(
      draftOrderRequest,
    );

    // TODO(IMPORANT): Document MongoDb concurrent transaction limitations.
    // https://jira.mongodb.org/browse/SERVER-36428?focusedCommentId=2136170&page=com.atlassian.jira.plugin.system.issuetabpanels%3Acomment-tabpanel#comment-2136170
    // (GLOBAL) DON'T parallelize this. Promise.all()'ing these, together with transactions, will lead to random
    // TransientTransactionError errors.
    await this.orderRepository.addOrder(draftOrder, session);
    await this.customerRepository.addOrderToCustomer(
      draftOrder.customerId,
      draftOrder.id,
      session,
    );

    return draftOrder;
  }

  private constructDraftOrder({
    customerId,
    originCountry,
    items: itemsWithoutId,
    destination,
  }: DraftOrderRequest): DraftedOrder {
    // TODO: class-validator decorator https://github.com/typestack/class-validator/issues/486
    if (originCountry === destination.country) {
      throwCustomException(
        "Origin country can't be equal to destination country",
        { originCountry, destinationCountry: destination.country },
        HttpStatus.SERVICE_UNAVAILABLE,
      )();
    }

    const items: DraftedItem[] = itemsWithoutId.map(itemWithoutId => ({
      ...itemWithoutId,
      id: UUID(),
    }));

    const shipmentCost = this.approximateShipmentCost(
      originCountry,
      destination,
      items,
      getShipmentCostQuote,
    );

    return {
      id: UUID(),
      status: OrderStatus.Drafted,
      customerId,
      items,
      originCountry,
      destination,
      shipmentCost,
    };
  }

  private approximateShipmentCost(
    originCountry: Country,
    { country: destinationCountry }: Address,
    items: DraftedItem[],
    getShipmentCostQuote: ShipmentCostQuoteFn,
  ): Cost {
    const { currency, services }: ShipmentCostQuote = getShipmentCostQuote(
      originCountry,
      destinationCountry,
      items.map(({ weight }) => ({ weight })),
    );

    // TODO: Service choice logic
    const { price: amount } = services[0];

    return { amount, currency };
  }
}
