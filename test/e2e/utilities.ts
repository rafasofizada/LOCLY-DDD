import { TestingModule } from '@nestjs/testing';
import { SuperAgentTest, agent } from 'supertest';
import { IRequestAuth } from '../../src/auth/application/RequestAuth/IRequestAuth';
import { EntityType } from '../../src/auth/entity/Token';
import {
  getDestinationCountriesAvailable,
  originCountriesAvailable,
} from '../../src/calculator/data/PriceGuide';
import { Address, Email } from '../../src/common/domain';
import { ICreateCustomer } from '../../src/customer/application/CreateCustomer/ICreateCustomer';
import { IDeleteCustomer } from '../../src/customer/application/DeleteCustomer/IDeleteCustomer';
import { IEditCustomer } from '../../src/customer/application/EditCustomer/IEditCustomer';
import { IGetCustomer } from '../../src/customer/application/GetCustomer/IGetCustomer';
import { Customer } from '../../src/customer/entity/Customer';
import { Country } from '../../src/order/entity/Country';

export async function createTestCustomer(
  moduleRef: TestingModule,
  orderOriginCountry: Country = originCountriesAvailable[0],
): Promise<{
  customer: Customer;
  createCustomer: ICreateCustomer;
  editCustomer: IEditCustomer;
  getCustomer: IGetCustomer;
  deleteCustomer: IDeleteCustomer;
}> {
  const createCustomer: ICreateCustomer = await moduleRef.resolve(
    ICreateCustomer,
  );
  const editCustomer: IEditCustomer = await moduleRef.resolve(IEditCustomer);
  const getCustomer: IGetCustomer = await moduleRef.resolve(IGetCustomer);
  const deleteCustomer: IDeleteCustomer = await moduleRef.resolve(
    IDeleteCustomer,
  );

  const customerCountry: Country = getDestinationCountriesAvailable(
    orderOriginCountry,
  )[0];

  const address: Address = {
    addressLine1: '42 Random St.',
    locality: 'Random City',
    country: customerCountry,
  };

  const email = 'random@email.com';

  const { id: customerId } = await createCustomer.execute({
    port: { email },
  });

  await editCustomer.execute({
    port: {
      customerId,
      addresses: [address],
    },
  });

  const customer: Customer = await getCustomer.execute({
    port: { customerId, email },
  });

  return {
    customer,
    createCustomer,
    editCustomer,
    getCustomer,
    deleteCustomer,
  };
}

export async function authorize(
  app: any,
  moduleRef: TestingModule,
): Promise<{
  agent: SuperAgentTest;
}>;
export async function authorize(
  app: any,
  moduleRef: TestingModule,
  email: Email,
  userType: UserType,
): Promise<{
  agent: SuperAgentTest;
  logout: () => Promise<Response>;
}>;
export async function authorize(
  app: any,
  moduleRef: TestingModule,
  email?: Email,
  userType?: UserType,
): Promise<{
  agent: SuperAgentTest;
  logout?: () => Promise<Response>;
}> {
  const requestAgent = agent(app.getHttpServer());

  const requestAuth: IRequestAuth = await moduleRef.resolve(IRequestAuth);

  if (email && userType) {
    const authTokenString = await requestAuth.execute({
      port: { email, type: userType },
    });

    await requestAgent.get(`/auth/${authTokenString}`);
  }

  return {
    agent: requestAgent,
    logout: () => requestAgent.post('/auth/logout').send(),
  };
}
