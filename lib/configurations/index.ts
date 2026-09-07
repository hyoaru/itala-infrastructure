import { ProductionConfiguration } from "./production";
import { StagingConfiguration } from "./staging";

export * from "./type";

export const configurations = {
  staging: StagingConfiguration,
  production: ProductionConfiguration,
};
