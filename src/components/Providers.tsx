'use client';

import { FC, ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletContextProvider } from './WalletContextProvider';
import { ConfirmProvider } from '@/components/providers/ConfirmProvider';

export const Providers: FC<{ children: ReactNode }> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider>
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </WalletContextProvider>
    </QueryClientProvider>
  );
};
