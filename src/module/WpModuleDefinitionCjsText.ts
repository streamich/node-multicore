import type {WpModuleDefinition} from "./types";

export class WpModuleDefinitionCjsText implements WpModuleDefinition {
  constructor(public readonly specifier: string, public readonly text: string) {}
}
