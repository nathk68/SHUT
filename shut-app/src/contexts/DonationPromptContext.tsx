import React, { createContext, useCallback, useContext, useState } from 'react';
import { DonationModal } from '../components/donation/DonationModal';
import { useDonationPrompt } from '../hooks/useDonationPrompt';

interface DonationPromptContextType {
  /** Call after navigating away — shows the donation modal if anti-spam allows */
  requestDonation: () => void;
}

const DonationPromptContext = createContext<DonationPromptContextType>({
  requestDonation: () => {},
});

export function DonationPromptProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const { shouldPrompt } = useDonationPrompt();

  const requestDonation = useCallback(() => {
    shouldPrompt().then((show) => {
      if (show) setVisible(true);
    });
  }, [shouldPrompt]);

  return (
    <DonationPromptContext.Provider value={{ requestDonation }}>
      {children}
      <DonationModal
        visible={visible}
        onClose={() => setVisible(false)}
        onDonated={() => setVisible(false)}
        context="global"
      />
    </DonationPromptContext.Provider>
  );
}

export function useDonationRequest() {
  return useContext(DonationPromptContext);
}
