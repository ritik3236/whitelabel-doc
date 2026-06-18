import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { brand } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: brand.name,
    },
  };
}
