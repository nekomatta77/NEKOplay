// src/games/DeadOfWinter/components/DiceRoller.tsx
import React, { useEffect, useRef } from 'react';
import DiceBox from '@3d-dice/dice-box';

interface Props {
  onRollComplete?: (results: any) => void;
}

export default function DiceRoller({ onRollComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const diceBoxRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Инициализация 3D-движка
    diceBoxRef.current = new DiceBox(containerRef.current, {
      assetPath: "https://unpkg.com/@3d-dice/dice-box@1.1.3/dist/assets/", // Берем текстуры из облака
      theme: "default",
      themeColor: "#991b1b", // Кроваво-красный цвет пластика (Red-800)
      scale: 7,              // Размер кубиков
      spinForce: 6,          // Сила кручения
      throwForce: 7,         // Сила броска
      gravity: 2,            // Гравитация
      startingHeight: 15     // Высота, с которой падают кубики
    });

    diceBoxRef.current.init().then(() => {
      console.log("🎲 3D Движок кубиков успешно загружен!");
      
      // Ловим момент, когда кубики остановились
      diceBoxRef.current.onRollComplete = (results: any) => {
        if (onRollComplete) onRollComplete(results);
      };
    });

    // Делаем функцию доступной глобально, чтобы легко вызывать из любой кнопки
    (window as any).roll3D = (notation: string) => {
      if (diceBoxRef.current) {
        diceBoxRef.current.roll(notation);
      }
    };

  }, []);

  return (
    // pointer-events-none нужен, чтобы прозрачный холст не блокировал клики по картам
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[150] pointer-events-none"
    ></div>
  );
}