import React from 'react';
import { render, screen } from '@testing-library/react';
import GenericSkeletonList from './GenericSkeletonList';

describe('GenericSkeletonList', () => {
  test('renders default count items', () => {
    render(<GenericSkeletonList />);
    const list = screen.getByRole('list', { name: /loading/i });
    expect(list).toBeInTheDocument();
    expect(list.querySelectorAll('[data-testid^="generic-skeleton-"]').length).toBe(8);
  });

  test('renders custom count items', () => {
    render(<GenericSkeletonList count={3} />);
    // Por rol a11y (listitem); el testid del contenedor 'generic-skeleton-list'
    // también matchea un regex /^generic-skeleton-/ sin anclar.
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(3);
    expect(screen.getAllByTestId(/^generic-skeleton-\d+$/)).toHaveLength(3);
  });
});
