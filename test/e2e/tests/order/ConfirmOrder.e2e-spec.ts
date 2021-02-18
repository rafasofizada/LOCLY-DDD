import * as supertest from 'supertest';
import * as MUUID from 'uuid-mongodb';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../../../src/AppModule';
import { Customer } from '../../../../src/order/domain/entity/Customer';
import { Order, OrderStatus } from '../../../../src/order/domain/entity/Order';
import { Host } from '../../../../src/order/domain/entity/Host';
import { Address } from '../../../../src/order/domain/entity/Address';

import {
  destinationCountriesAvailable,
  originCountriesAvailable,
} from '../../../../src/order/application/services/MatchHostService';
import { HostFixture } from '../../fixture/HostFixture';
import { CustomerRepository } from '../../../../src/order/application/port/CustomerRepository';
import { OrderRepository } from '../../../../src/order/application/port/OrderRepository';
import { muuidToEntityId } from '../../../../src/common/utils';
import { EntityId } from '../../../../src/common/domain/EntityId';

describe('Confirm Order – POST /order/confirm', () => {
  let app: INestApplication;

  /*let customerFixture: CustomerFixture;
  let orderFixture: OrderFixture;
  let hostFixture: HostFixture;*/

  let customerRepository: CustomerRepository;
  let orderRepository: OrderRepository;
  let hostFixture: HostFixture;

  let testCustomer: Customer;
  let testOrder: Order;
  let testHosts: Host[];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    customerRepository = (await moduleRef.resolve(
      CustomerRepository,
    )) as CustomerRepository;

    orderRepository = (await moduleRef.resolve(
      OrderRepository,
    )) as OrderRepository;

    hostFixture = (await moduleRef.resolve(HostFixture)) as HostFixture;
  });

  beforeEach(async () => {
    const originCountry: string = originCountriesAvailable[0];
    const destinationCountry: string = destinationCountriesAvailable[0];

    testCustomer = new Customer({
      selectedAddress: new Address({
        country: destinationCountry,
      }),
      orderIds: [],
    });

    const testHostConfigs = [
      /*
      Test host #1:
      ✔ available
      ✔ same country as the testOrder
      ✔ lowest number of orders (1)
      */
      {
        country: originCountry,
        available: true,
        orderCount: 1,
      },
      /*
      Test host #2:
      ✗ NOT available
      ✔ same country as the testOrder
      ✔ lowest number of orders (1)
      */
      {
        country: originCountry,
        available: false,
        orderCount: 1,
      },
      /*
      Test host #3:
      ✗ NOT the same country as the testOrder
      ✔ available
      ✔ lowest number of orders (1)
      */
      {
        country: originCountriesAvailable[1],
        available: true,
        orderCount: 1,
      },
      /*
      Test host #4:
      ✗ NOT the lowest number of orders (2)
      ✔ same country as the testOrder
      ✔ available
      */
      {
        country: originCountry,
        available: true,
        orderCount: 2,
      },
      /*
      Test host #5:
      ✗ NOT the lowest number of orders (2)
      ✗ NOT the same country as the testOrder
      ✗ NOT available
      */
      {
        country: originCountriesAvailable[2],
        available: false,
        orderCount: 3,
      },
    ];

    testHosts = testHostConfigs.map(
      ({ country, available, orderCount }) =>
        new Host({
          address: new Address({ country }),
          available,
          orderIds: [...Array(orderCount)].map(_ =>
            muuidToEntityId(MUUID.v4()),
          ),
        }),
    );

    // TODO(NOW): CreateOrder through a use case, not manually.
    testOrder = new Order({
      customerId: testCustomer.id,
      items: [],
      originCountry,
      destination: testCustomer.selectedAddress,
    });

    await Promise.all([
      customerRepository.addCustomer(testCustomer),
      hostFixture.addManyHosts(testHosts),
      orderRepository.addOrder(testOrder),
    ]);
  });

  afterEach(() =>
    Promise.all([
      customerRepository.deleteCustomer(testCustomer.id),
      hostFixture.deleteManyHosts(testHosts.map(({ id }) => id)),
      orderRepository.deleteOrder(testOrder.id),
    ]),
  );

  it('Matches Order with a Host, updates Order\'s "hostId" property, and Host\'s "orderIds" property', async () => {
    const response: supertest.Response = await supertest(app.getHttpServer())
      .post('/order/confirm')
      .send({
        orderId: testOrder.id.value,
      });

    expect(response.status).toBe(201);

    /*console.log(testCustomer);
    console.log(testHosts);
    console.log(testOrder);
    console.log(response.body);*/

    const {
      status,
      hostId,
    }: { status: OrderStatus; hostId: string } = response.body;

    expect(status).toBe(OrderStatus.Confirmed);
    expect(hostId).toBe(testHosts[0].id.value);

    const updatedTestHost: Host = await hostFixture.findHost(
      new EntityId(hostId),
    );

    expect(updatedTestHost.orderIds.map(({ value }) => value)).toContain(
      testOrder.id.value,
    );
  });
});
