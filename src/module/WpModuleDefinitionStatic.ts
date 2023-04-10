import type {WpModuleDefinition} from "./types";

export class WpModuleDefinitionStatic implements WpModuleDefinition {
  constructor(public readonly specifier: string) {}
}
