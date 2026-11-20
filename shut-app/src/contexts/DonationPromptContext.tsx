import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
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
  const { shouldPrompt, markDonated } = useDonationPrompt();
  const suppressedRef = useRef(false);

  const requestDonation = useCallback(() => {
    if (suppressedRef.current) return;
    shouldPrompt().then((show) => {
      if (show) setVisible(true);
    });
  }, [shouldPrompt]);

  const handleClose = useCallback(() => setVisible(false), []);
  const handleDonated = useCallback(() => {
    markDonated();
    setVisible(false);
  }, [markDonated]);
  const handleSuppressSession = useCallback(() => {
    suppressedRef.current = true;
    setVisible(false);
  }, []);

  return (
    <DonationPromptContext.Provider value={{ requestDonation }}>
      {children}
      <DonationModal
        visible={visible}
        onClose={handleClose}
        onDonated={handleDonated}
        onSuppressSession={handleSuppressSession}
        context="global"
      />
    </DonationPromptContext.Provider>
  );
}

export function useDonationRequest() {
  return useContext(DonationPromptContext);
}
