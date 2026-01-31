import { Types, UpdateQuery } from 'mongoose';
import { Context } from '../../interfaces/context.interface.js';
import { GetTenantInput } from '../../interfaces/tenant.interface.js';
import { EntityBaseCrud } from '../base/entity.repository.js';
import { TenantType } from './tenant.schema.js';

export class TenantRepository extends EntityBaseCrud<typeof TenantType> {
  public constructor() {
    super({
      modelClass: TenantType,
      schemaOptions: {
        collection: 'tenants',
        timestamps: true,
      },
      cacheModel: true,
      useGlobalClient: true,
    });
  }

  async createTenant(tenantInput: Partial<TenantType>, context: Context): Promise<TenantType | undefined> {
    const TenantModel = await this.getModel(context, this.modelOptions);

    const tenantDoc = new TenantModel({
      ...tenantInput,
      createdById: context.userId,
      updatedById: context.userId,
    });

    const tenant = await this.create({
      doc: tenantDoc,
      context,
    });

    if (tenant) {
      return tenant;
    }
    return;
  }

  async getTenantById(tenantId: string, context: Context): Promise<TenantType | null> {
    const tenant = await this.findById({
      id: tenantId,
      context,
    });
    return tenant;
  }

  async getTenant(input: GetTenantInput, context: Context): Promise<TenantType | null> {
    const query: Partial<TenantType> = {};

    if (input.tenantId) {
      query._id = new Types.ObjectId(input.tenantId);
    }

    if (input.domain) {
      query.domain = input.domain;
    }

    const tenant = await this.findOne({
      query,
      context,
    });

    return tenant;
  }

  async updateTenant(tenantId: string, updateData: Partial<TenantType>, context: Context): Promise<TenantType | null> {
    const updateQuery: UpdateQuery<TenantType> = {
      $set: {
        ...updateData,
      },
    };

    const updatedTenant = await this.findOneAndUpdate({
      query: { _id: new Types.ObjectId(tenantId) },
      updateQuery: updateQuery,
      options: { new: true },
      context,
    });

    return updatedTenant;
  }
}

export const tenantRepository = new TenantRepository();
