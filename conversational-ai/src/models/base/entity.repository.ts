/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnyParamConstructor, DocumentType, ReturnModelType } from '@typegoose/typegoose/lib/types.js';
import {
  DeleteResult,
  MongooseUpdateQueryOptions,
  Query,
  QueryOptions,
  SchemaOptions,
  UpdateWriteOpResult,
} from 'mongoose';
import { Context } from '../../interfaces/context.interface.js';
import {
  Aggregation,
  BaseCrudInput,
  Count,
  Create,
  Find,
  FindAll,
  FindById,
  FindOne,
  FindOneAndUpdate,
  ModelDocument,
  ModelInstance,
  ModelOptions,
  Pagination,
  Remove,
  RemoveResponse,
  Update,
} from '../../interfaces/entity.interface.js';
import logger from '../../utils/logger.js';
import { TenantInfoMongoModelGetterService } from './mongoModel.js';

function getMongoCommentPayload({ requestId }: { requestId?: string }): string {
  return JSON.stringify({ requestId });
}

/**
 * Base CRUD operations for entities.
 * @param T - The model class type
 * @returns EntityBaseCrud class
 */
export class EntityBaseCrud<T extends AnyParamConstructor<InstanceType<T>>> {
  private modelClass: T;
  private schemaOptions: SchemaOptions;
  private cacheModel: boolean;
  private useGlobalClient: boolean = false;

  constructor({ modelClass, cacheModel, schemaOptions, useGlobalClient = false }: BaseCrudInput<T>) {
    this.modelClass = modelClass;
    this.schemaOptions = schemaOptions;
    this.cacheModel = cacheModel ?? false;
    this.useGlobalClient = useGlobalClient;
  }

  async getModel(context: Context, modelOptions: ModelOptions): Promise<ReturnModelType<T>> {
    const { tenantId } = context;
    const { schemaOptions, cacheModel = true } = modelOptions;

    const tenantInfoMongoModelGetterService = new TenantInfoMongoModelGetterService({
      modelClass: this.modelClass,
      tenantId,
      schemaOptions: {
        collection: schemaOptions.collection || this.modelClass.name.toLowerCase() + 's',
      },
      cacheModel,
      useGlobalClient: this.useGlobalClient,
    });
    const model = await tenantInfoMongoModelGetterService.getEntityMongoModel();
    return model;
  }

  get modelOptions(): ModelOptions {
    if (!this.schemaOptions) {
      throw new Error('Schema options are not defined in BaseCrudService');
    }
    return {
      schemaOptions: this.schemaOptions,
      cacheModel: this.cacheModel,
    };
  }

  async findById({ id, projection = {}, context }: FindById): Promise<ModelInstance<any> | null> {
    const modelOptions = this.modelOptions;
    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });

    const model = await this.getModel(context, modelOptions);

    const updatedOptions = {};
    if (context.session) {
      Object.assign(updatedOptions, { session: context.session });
    }
    const result = await model
      .findById(id, projection, updatedOptions)
      .lean<ModelInstance<any> | null>()
      .comment(comment)
      .exec();

    return result;
  }

  async aggregate<U = any>({ aggregations, context }: Aggregation): Promise<U[]> {
    const model = await this.getModel(context, this.modelOptions);
    /** Adding comment to the aggregate query to track the requestId */
    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });
    aggregations.forEach((aggregation) => {
      if (aggregation.$match) {
        aggregation.$match.$comment = comment;
      }
    });
    const queryBuilder = model.aggregate(aggregations);
    const result = await queryBuilder.exec();
    return result;
  }

  /**
   * Use it with caution. And with future plane to replace it with better approach
   */
  async findAll({
    query,
    projection = {},
    options = {},
    sortQuery,
    context,
  }: FindAll<InstanceType<T>>): Promise<InstanceType<T>[]> {
    if (Object.keys(query).length === 0) {
      return [];
    }

    const model = await this.getModel(context, this.modelOptions);

    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });

    const updatedOptions = options;
    if (context.session && updatedOptions) {
      Object.assign(updatedOptions, { session: context.session });
    }
    const result = await model
      .find(query, projection, { ...updatedOptions })
      .sort(sortQuery || {})
      .lean<InstanceType<T>[]>()
      .comment(comment)
      .exec();

    return result;
  }

  async find({
    query,
    projection = {},
    sortQuery = {},
    options = {},
    limit = 20,
    offset = 0,
    context,
  }: Find<InstanceType<T>>): Promise<InstanceType<T>[]> {
    try {
      const allowEmptyQuery = options.allowEmptyQuery ?? false;

      if (!allowEmptyQuery && Object.keys(query).length === 0) {
        return [];
      }

      const modelOptions = this.modelOptions;
      const model = await this.getModel(context, modelOptions);

      const requestId = context.requestId;
      const comment = getMongoCommentPayload({ requestId });

      const updatedOptions = options;
      if (context.session) {
        Object.assign(updatedOptions, { session: context.session });
      }
      const queryBuilder = model
        .find(query, projection, updatedOptions)
        .sort(sortQuery)
        .limit(limit)
        .skip(offset)
        .comment(comment)
        .lean<InstanceType<T>[]>();

      const result = await queryBuilder.exec();

      return result;
    } catch (error) {
      logger.error({ message: `Error inside find()`, error });
      throw error;
    }
  }

  async removeOne({ query, context }: Remove<InstanceType<T>>): Promise<DeleteResult> {
    if (Object.keys(query).length === 0) {
      logger.warn({ message: `baseCrud.removeOne query is an empty object` });
      return { deletedCount: 0, acknowledged: true };
    }

    const modelOptions = this.modelOptions;
    const model = await this.getModel(context, modelOptions);

    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });

    const updatedOptions = {};
    if (context.session) {
      Object.assign(updatedOptions, { session: context.session });
    }
    return model.deleteOne(query, updatedOptions).comment(comment);
  }

  async remove({ query, context }: Remove<InstanceType<T>>): Promise<RemoveResponse<InstanceType<T>>> {
    if (Object.keys(query).length === 0) {
      logger.warn({ message: `baseCrud.remove query is an empty object` });
      return { deletedCount: 0, acknowledged: true };
    }
    const modelOptions = this.modelOptions;
    const model = await this.getModel(context, modelOptions);
    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });
    const updatedOptions = {};
    if (context.session) {
      Object.assign(updatedOptions, { session: context.session });
    }
    return model.deleteMany(query, updatedOptions).comment(comment);
  }

  async count({ query, context }: Count<InstanceType<T>>): Promise<number> {
    const modelOptions = this.modelOptions;
    const model = await this.getModel(context, modelOptions);

    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });

    const updatedOptions = {};
    if (context.session) {
      Object.assign(updatedOptions, { session: context.session });
    }
    const queryBuilder = model.countDocuments(query, updatedOptions).comment(comment);

    const result = await queryBuilder.exec();
    return result;
  }

  async update({
    query,
    updateQuery,
    options = {},
    context,
  }: Update<DocumentType<InstanceType<T>>>): Promise<Query<UpdateWriteOpResult, T>> {
    if (Object.keys(query).length === 0) {
      return {
        acknowledged: false,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: null,
      };
    }

    const model = await this.getModel(context, this.modelOptions);
    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });
    const cleanedOptions: MongooseUpdateQueryOptions<T> = {
      ...options,
    };

    if (context.session) {
      Object.assign(cleanedOptions, { session: context.session });
    }
    return model.updateMany(query, updateQuery, cleanedOptions).comment(comment);
  }

  async create<TCreate = InstanceType<T>>({ doc, context }: Create<TCreate>): Promise<ModelDocument<any>> {
    const modelOptions = this.modelOptions;
    const model = await this.getModel(context, modelOptions);
    // Mongoose only accepts options in create() when passing an array of docs.
    if (context.session) {
      const [createdDocument] = await model.create([doc as any], { session: context.session });
      return createdDocument as ModelDocument<any>;
    }
    const createdDocument = await model.create(doc as any);
    return createdDocument as ModelDocument<any>;
  }

  async findOne({
    query,
    context,
    projection = {},
    options = {},
  }: FindOne<InstanceType<T>>): Promise<ModelInstance<any> | null> {
    const allowEmptyQuery = options.allowEmptyQuery ?? false;
    if (!allowEmptyQuery && Object.keys(query).length === 0) {
      return null;
    }

    const model = await this.getModel(context, this.modelOptions);
    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });

    const updatedOptions = { ...options };
    if (context.session) {
      Object.assign(updatedOptions, { session: context.session });
    }
    const result = await model
      .findOne(query, projection, updatedOptions)
      .lean<ModelInstance<any> | null>()
      .comment(comment)
      .exec();

    return result;
  }

  async findOneAndUpdate({
    query,
    updateQuery,
    options = {},
    context,
  }: FindOneAndUpdate<InstanceType<T>>): Promise<InstanceType<T> | null> {
    const model = await this.getModel(context, this.modelOptions);
    const requestId = context.requestId;
    const comment = getMongoCommentPayload({ requestId });
    const updatedOptions = { ...options };
    if (context.session) {
      Object.assign(updatedOptions, { session: context.session });
    }
    const updatedDocument = await model
      .findOneAndUpdate(query, updateQuery, options)
      .lean<InstanceType<T> | null>()
      .comment(comment);

    return updatedDocument;
  }

  async initCollection(context: Context): Promise<void> {
    const model = await this.getModel(context, this.modelOptions);
    const collections = await model.db.listCollections();
    if (
      collections.filter(
        (col) => (this.schemaOptions.collection || this.modelClass.name.toLowerCase() + 's') === col.name,
      ).length === 0
    ) {
      await model.db.createCollection(model.collection.name);
    }
  }

  public buildPaginationOption(pagination: Pagination | undefined): QueryOptions<T> {
    const options: QueryOptions<T> = {};
    if (pagination?.limit !== undefined) {
      options.limit = pagination.limit;
    }

    if (pagination?.offset !== undefined) {
      options.skip = pagination.offset;
    }

    return options;
  }
}
