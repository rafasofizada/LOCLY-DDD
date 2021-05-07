import { OrderRepository } from '../port/OrderRepository';

import {
  EditOrderRequest,
  EditOrderUseCase,
} from '../../domain/use-case/EditOrderUseCase';

import { Injectable } from '@nestjs/common';
import { InjectClient } from 'nest-mongodb';
import { ClientSession, MongoClient } from 'mongodb';
import { DraftOrderUseCase } from '../../domain/use-case/DraftOrderUseCase';
import { CustomerRepository } from '../port/CustomerRepository';
import { withTransaction } from '../../../common/application';
import { OrderStatus, DraftedOrder } from '../../domain/entity/Order';

@Injectable()
export class EditOrderService implements EditOrderUseCase {
  constructor(
    private readonly draftOrderUseCase: DraftOrderUseCase,
    private readonly orderRepository: OrderRepository,
    private readonly customerRepository: CustomerRepository,
    @InjectClient() private readonly mongoClient: MongoClient,
  ) {}

  async execute(
    editOrderRequest: EditOrderRequest,
    session?: ClientSession,
  ): Promise<DraftedOrder> {
    const draftOrder: DraftedOrder = await withTransaction(
      (sessionWithTransaction: ClientSession) =>
        this.editOrder(editOrderRequest, sessionWithTransaction),
      this.mongoClient,
      session,
    );

    return draftOrder;
  }

  private async editOrder(
    { orderId, customerId, ...restEditOrderRequest }: EditOrderRequest,
    session: ClientSession,
  ): Promise<DraftedOrder> {
    await this.orderRepository.deleteOrder(
      {
        orderId,
        status: OrderStatus.Drafted,
        customerId,
      },
      session,
    );
    await this.customerRepository.removeOrderFromCustomer(
      customerId,
      orderId,
      session,
    );

    const draftOrder: DraftedOrder = await this.draftOrderUseCase.execute(
      { customerId, ...restEditOrderRequest },
      session,
    );

    return draftOrder;
  }
}
