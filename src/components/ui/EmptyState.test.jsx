import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from './EmptyState';
import { vi } from 'vitest';

describe('EmptyState', () => {
  test('renders title, description and action button and calls onAction', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No items"
        description="Nothing here"
        actionLabel="Create"
        onAction={onAction}
        data-testid="empty-test"
      />
    );

    expect(screen.getByText('No items')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    const btn = screen.getByTestId('empty-action');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
