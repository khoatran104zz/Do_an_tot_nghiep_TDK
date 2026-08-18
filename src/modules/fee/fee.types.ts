import { FeeUnit } from '@prisma/client';

export interface CreateFeeCategoryDto {
  code: string;
  name: string;
  unit: FeeUnit;
  unitPrice: number;
  description?: string;
  isSystem?: boolean;
}

export interface UpdateFeeCategoryDto extends Partial<CreateFeeCategoryDto> {}
