import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import DataState from './DataState';

describe('DataState component', () => {
  test('renders loading skeleton', () => {
    render(<DataState variant="loading" testId="products-loading" />);
    const container = screen.getByTestId('products-loading');
    expect(container).toBeInTheDocument();
    // ProductSkeletonGrid renders a list role
    const list = within(container).getByRole('list');
    expect(list).toBeInTheDocument();
  });

  test('renders list variant skeleton', () => {
    render(<DataState variant="loading" skeletonVariant="list" testId="list-loading" skeletonProps={{ count: 3 }} />);
    const container = screen.getByTestId('list-loading');
    expect(container).toBeInTheDocument();
    const list = within(container).getByRole('list');
    expect(list).toBeInTheDocument();
    expect(within(list).getAllByTestId(/generic-skeleton-/).length).toBe(3);
  });

  test('renders empty state and calls action', () => {
    const onAction = vi.fn();
    render(
      <DataState
        variant="empty"
        title="No items"
        description="No hay nada"
        actionLabel="Create"
        onAction={onAction}
        testId="empty-test"
      />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
    const action = screen.getByTestId('empty-action');
    expect(action).toBeInTheDocument();
    fireEvent.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test('renders error state and retry calls onRetry', () => {
    const onRetry = vi.fn();
    render(
      <DataState
        variant="error"
        title="Error"
        message="Network down"
        code="NETWORK"
        hint="Verifica tu conexión"
        onRetry={onRetry}
        testId="error-test"
      />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Network down')).toBeInTheDocument();
    const retry = screen.getByTestId('error-retry');
    expect(retry).toBeInTheDocument();
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
