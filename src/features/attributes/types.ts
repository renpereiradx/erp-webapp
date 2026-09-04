export type AttributeType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'LIST' | 'MULTI_SELECT'
export type AttributeCategory = 'General' | string

export interface Attribute {
  id: string | number
  name: string
  code: string
  type: AttributeType
  category: AttributeCategory
  isRequired: boolean
  isFilterable: boolean
  isVisible: boolean
  isVariant: boolean
  options?: string[]
}

export type TagType = 'GENERAL' | 'PROMOTION' | 'STATUS' | 'SEASON'
export type TagCategory = 'General' | string

export interface Tag {
  id: string | number
  name: string
  slug: string
  color: string
  icon: string
  type: TagType
  category: TagCategory
}

export const NEW_ID = 'new'
