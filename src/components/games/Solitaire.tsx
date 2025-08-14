import React from 'react';
import SolitaireGame from './solitaire/SolitaireGame';

// Main Solitaire component - now just a wrapper for the modular version
const Solitaire: React.FC = () => {
  return <SolitaireGame />;
};

export default Solitaire;