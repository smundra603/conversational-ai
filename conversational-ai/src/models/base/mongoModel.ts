/* eslint-disable @typescript-eslint/no-explicit-any */
import { deleteModel, getModelForClass, getModelWithString } from '@typegoose/typegoose';
import { AnyParamConstructor, ReturnModelType } from '@typegoose/typegoose/lib/types.js';
import mongoose, { Connection } from 'mongoose';
import { GetEntityMongoModelProps } from '../../interfaces/entity.interface.js';
import logger from '../../utils/logger.js';

export class TenantMongoConnectionGetterService {
  static async getConnection(tenantId: string, connection?: Connection): Promise<Connection> {
    const useDbOptions = {
      useCache: true, //ensures connections to the same databases are cached
      noListener: true, //remove event listeners from the main connection
    };

    const dbName = tenantId.toString();
    if (connection) {
      return connection.useDb(dbName, useDbOptions);
    }
    const tenantMongoConnection = mongoose.connection.useDb(dbName, useDbOptions);
    return tenantMongoConnection;
  }
}

/**
 * Service to get tenant-specific MongoDB models.
 */
export class TenantInfoMongoModelGetterService<T extends AnyParamConstructor<any>> {
  private entityMongoModelProps: GetEntityMongoModelProps<T>;
  private useCachedModel: boolean;

  constructor(props: GetEntityMongoModelProps<T>) {
    this.entityMongoModelProps = props;
    this.useCachedModel = this.entityMongoModelProps.cacheModel;
  }

  async getConnection(connection?: Connection): Promise<Connection> {
    const useDbOptions = {
      useCache: true, //ensures connections to the same databases are cached
      noListener: true, //remove event listeners from the main connection
    };

    const dbName = this.entityMongoModelProps.tenantId.toString();
    if (connection) {
      return connection.useDb(dbName, useDbOptions);
    }
    const tenantMongoConnection = mongoose.connection.useDb(dbName, useDbOptions);
    return tenantMongoConnection;
  }

  private createModelCachingKey(useGlobalClient: boolean): string {
    const { tenantId, modelClass } = this.entityMongoModelProps;
    let mongoModelCacheKey = `${modelClass.name}`; //This is done to cache the global connection model
    if (!useGlobalClient) {
      mongoModelCacheKey = `${tenantId}_${modelClass.name}`;
    }
    logger.debug({ message: `Creating mongo model caching key ${mongoModelCacheKey}` });

    return mongoModelCacheKey;
  }

  async getEntityMongoModel(): Promise<ReturnModelType<T>> {
    const { modelClass, schemaOptions, tenantId, useGlobalClient } = this.entityMongoModelProps;
    const mongoModelCacheKey = this.createModelCachingKey(useGlobalClient);
    if (!this.useCachedModel) {
      logger.verbose({ message: `Use cached model option is not enabled so not trying to get the model from cache` });
      // Reason: Need to delete the model from the cache maintained by typegoose.
      // Scenario: WorkSpace A has create resource model, now workspace B wants to create resource model.
      // so if we don't delete model, then workspace B will be provided with resource model of workspace A.
      if (getModelWithString(mongoModelCacheKey)) {
        deleteModel(mongoModelCacheKey);
      }
    }

    const cachedMongoModel = getModelWithString<T>(mongoModelCacheKey);

    if (cachedMongoModel) {
      logger.debug({
        message: `Returning Mongo model found from typegoose cache for mongoModelCacheKey: ${mongoModelCacheKey}`,
      });
      return cachedMongoModel;
    }

    logger.verbose({
      message: `Creating a new Mongo model for mongoModelCacheKey: ${mongoModelCacheKey}`,
    });

    const tenantMongoModelCreationProfiler = logger.startTimer();

    let tenantMongoConnection = mongoose.connection; //This is done to access the global connection

    if (!useGlobalClient) {
      tenantMongoConnection = await TenantMongoConnectionGetterService.getConnection(tenantId);
    }

    const mongoModel = getModelForClass<T>(modelClass, {
      schemaOptions: {
        collection: schemaOptions.collection,
        timestamps: true,
      },
      existingConnection: tenantMongoConnection,
      options: { customName: mongoModelCacheKey },
    });

    tenantMongoModelCreationProfiler.done({ message: `New mongo model created for ${mongoModelCacheKey}` });
    return mongoModel;
  }
}
