// src/games/DeadOfWinter/components/DiceRoller.tsx
import React, { useEffect, useRef } from 'react';
import DiceBox from '@3d-dice/dice-box';

interface Props {
  onRollComplete?: (results: any) => void;
}

export default function DiceRoller({ onRollComplete }: Props) {
  const initialized = useRef(false);
  const diceBoxRef = useRef<any>(null);

  useEffect(() => {
    const container = document.getElementById("dice-box-container");
    if (initialized.current || !container) return;
    initialized.current = true;

    diceBoxRef.current = new DiceBox({
      container: "#dice-box-container", 
      assetPath: "/dice-3d/", // Путь к папке, которую мы создали (или "/assets/")
      theme: "default",
      themeColor: "#991b1b",
      scale: 8,              
      spinForce: 6,          
      throwForce: 7,         
      gravity: 3,            
      startingHeight: 12     
    });

    diceBoxRef.current.init().then(() => {
      console.log("🎲 3D Движок готов к броскам!");
      
      diceBoxRef.current.onRollComplete = (results: any) => {
        if (onRollComplete) onRollComplete(results);
      };
    }).catch((e: any) => console.error("Ошибка 3D движка:", e));

    (window as any).roll3D = (notation: string) => {
      if (diceBoxRef.current) {
        diceBoxRef.current.clear(); // <--- ГАРАНТИРОВАННАЯ ОЧИСТКА СТАРЫХ КУБИКОВ ПЕРЕД БРОСКОМ
        diceBoxRef.current.roll(notation);
      }
    };

  }, [onRollComplete]);

  return null;
}