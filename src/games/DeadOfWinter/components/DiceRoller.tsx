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
    if (initialized.current) return;
    initialized.current = true;

    diceBoxRef.current = new DiceBox({
      container: "#dice-box-container",
      // === ИСПРАВЛЕНИЕ 1: Теперь берем ассеты из нашей локальной папки public/assets/ ===
      assetPath: "/assets/", 
      theme: "default",
      themeColor: "#991b1b", // Кроваво-красный цвет
      scale: 7,              // Размер кубиков
      spinForce: 6,          
      throwForce: 7,         
      gravity: 2,            
      startingHeight: 15     
    });

    diceBoxRef.current.init().then(() => {
      console.log("🎲 3D Движок кубиков успешно загружен локально!");
      
      diceBoxRef.current.onRollComplete = (results: any) => {
        if (onRollComplete) onRollComplete(results);
      };
    }).catch((e: any) => console.error("Ошибка загрузки 3D движка:", e));

    (window as any).roll3D = (notation: string) => {
      if (diceBoxRef.current) {
        diceBoxRef.current.roll(notation);
      }
    };

  }, [onRollComplete]);

  return (
    <div 
      id="dice-box-container" 
      className="fixed inset-0 z-[150] pointer-events-none"
    ></div>
  );
}