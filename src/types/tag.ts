export type TagType = 'PROMOTION' | 'GENERAL' | 'STATUS';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  type: TagType;
  category: string;
}
