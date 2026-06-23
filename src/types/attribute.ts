export type AttributeType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'LIST';
export type AttributeCategory = 'General' | 'Apariencia' | 'Especificaciones' | string;

export interface Attribute {
  id: string;
  name: string;
  code: string;
  type: AttributeType;
  category: AttributeCategory;
  isRequired: boolean;
  isFilterable: boolean;
  isVisible: boolean;
  isVariant: boolean;
  options?: string[]; // Para tipo LIST
}
