import React, { createContext, useContext, useState } from 'react';

interface DiceContextType {
  showDiceRoller: boolean;
  toggleDiceRoller: () => void;
}

const DiceContext = createContext<DiceContextType | undefined>(undefined);

export function DiceProvider({ children }: { children: React.ReactNode }) {
  const [showDiceRoller, setShowDiceRoller] = useState(false);

  const toggleDiceRoller = () => {
    setShowDiceRoller(prev => !prev);
  };

  return (
    <DiceContext.Provider value={{ showDiceRoller, toggleDiceRoller }}>
      {children}
    </DiceContext.Provider>
  );
}

export function useDice() {
  const context = useContext(DiceContext);
  if (context === undefined) {
    throw new Error('useDice must be used within a DiceProvider');
  }
  return context;
}
