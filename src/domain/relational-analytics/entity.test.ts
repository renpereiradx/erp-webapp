import { describe, expect, it } from 'vitest';
import {
  entityDisplay,
  entityDisplayName,
  entityDocument,
  productReference,
  unwrapEntityPayload,
  variantDisplayName,
} from './entity';

/**
 * Identidad de cabecera de los drill-downs: el nombre se resuelve contra el
 * endpoint Core de cada entidad y SIEMPRE cae al id de la URL si los campos
 * no están (nunca inventa un nombre ni un documento).
 */
describe('unwrapEntityPayload', () => {
  it('unwraps a single {data} layer and ignores non-objects', () => {
    expect(unwrapEntityPayload({ data: { name: 'ACME' } })).toEqual({ name: 'ACME' });
    expect(unwrapEntityPayload({ name: 'ACME' })).toEqual({ name: 'ACME' });
    expect(unwrapEntityPayload(null)).toBeNull();
    expect(unwrapEntityPayload('ACME')).toBeNull();
    expect(unwrapEntityPayload([{ name: 'ACME' }])).toBeNull();
  });
});

describe('entityDisplayName', () => {
  it('prefers the product/party name aliases', () => {
    expect(entityDisplayName({ name: 'CAMISETA ADIDAS' }, 'P-1')).toBe('CAMISETA ADIDAS');
    expect(entityDisplayName({ product_name: 'PAPA KG' }, 'P-1')).toBe('PAPA KG');
    expect(entityDisplayName({ business_name: 'Distribuidora Sur' }, 'S-1')).toBe(
      'Distribuidora Sur',
    );
  });

  it('composes first + last name for people', () => {
    expect(entityDisplayName({ first_name: 'Maria', last_name: 'Gomez' }, 'C-1')).toBe(
      'Maria Gomez',
    );
    expect(entityDisplayName({ first_name: 'Maria', last_name: '' }, 'C-1')).toBe('Maria');
  });

  it('falls back to the route id when the payload has no name', () => {
    expect(entityDisplayName(null, 'C-1')).toBe('C-1');
    expect(entityDisplayName({}, 'C-1')).toBe('C-1');
    expect(entityDisplayName({ name: '   ' }, 'C-1')).toBe('C-1');
  });
});

describe('entityDocument / productReference', () => {
  it('reads the party document with tax_id precedence', () => {
    expect(entityDocument({ tax_id: '80012345-6', document_id: '1234567' })).toBe('80012345-6');
    expect(entityDocument({ document_id: '1234567' })).toBe('1234567');
    expect(entityDocument({})).toBeUndefined();
  });

  it('reads the product reference with barcode precedence', () => {
    expect(productReference({ barcode: '123', sku: 'SKU-1' })).toBe('123');
    expect(productReference({ sku: 'SKU-1' })).toBe('SKU-1');
    expect(productReference({})).toBeUndefined();
  });
});

describe('variantDisplayName', () => {
  it('reads variant_name and falls back to the id', () => {
    expect(variantDisplayName({ variant_name: 'Rojo M' }, 'VAR-1')).toBe('Rojo M');
    expect(variantDisplayName(null, 'VAR-1')).toBe('VAR-1');
  });
});

describe('entityDisplay', () => {
  it('uses the document for parties and the product code for products', () => {
    expect(entityDisplay('client', { first_name: 'Maria', document_id: '1234567' }, 'C-1')).toEqual({
      label: 'Maria',
      sub: '1234567',
    });
    expect(entityDisplay('product', { name: 'CAMISETA', barcode: '7791' }, 'P-1')).toEqual({
      label: 'CAMISETA',
      sub: '7791',
    });
  });

  it('omits the sub field when the entity has no document/reference', () => {
    expect(entityDisplay('supplier', { name: 'Proveedor' }, 'S-1')).toEqual({
      label: 'Proveedor',
    });
  });
});
