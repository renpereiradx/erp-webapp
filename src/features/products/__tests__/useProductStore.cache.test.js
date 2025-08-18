import useProductStore from '@/store/useProductStore';
import { act } from 'react';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const handlers = [
  // search by name returns two items
  http.get(`${API_URL}/products/name/:name`, ({ params }) => {
    const { name } = params;
    return HttpResponse.json([
      { id: 'A1', name: `${name}-one`, is_active: true, category_id: 1 },
      { id: 'A2', name: `${name}-two`, is_active: true, category_id: 1 },
    ]);
  }),
  // details by id
  http.get(`${API_URL}/products/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({ id, name: `Product-${id}`, is_active: true, category_id: 1 });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function getState() {
  return useProductStore.getState();
}

describe('useProductStore searchProducts cache', () => {
  test('stores full results in cache and paginates in memory', async () => {
    const term = 'shoe';

    // set page size to 1 to verify pagination is applied on top of full cache
    act(() => {
      getState().setPageSize(1);
    });

    await act(async () => {
      const res1 = await getState().searchProducts(term, {});
      expect(res1.total).toBe(2);
      expect(getState().products).toHaveLength(1);
    });

    // change page size to 2, fetch should serve from cache and show both
    act(() => {
      getState().setPageSize(2);
    });

    await act(async () => {
      const res2 = await getState().searchProducts(term);
      expect(res2.total).toBe(2);
      expect(getState().products).toHaveLength(2);
    });
  });
});
