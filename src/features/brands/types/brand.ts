export interface Brand {
  id: string | number;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  isActive: boolean;
  icon?: string;
}
