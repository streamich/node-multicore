import type {WpModuleDefinition} from "./types";

export class WpModuleDefinitionFunc implements WpModuleDefinition {
  constructor(public readonly specifier: string, public readonly text: string) {}
}
