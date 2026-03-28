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
    // strictModeReact18 просит нас не запускать эффект дважды, но для WebGL это критично.
    // Если id="dice-box-container" еще нет на экране (поднос скрыт), мы не запускаем движок.
    const container = document.getElementById("dice-box-container");
    if (initialized.current || !container) return;
    initialized.current = true;

    // Инициализация 3D-движка
    diceBoxRef.current = new DiceBox({
      container: "#dice-box-container", 
      assetPath: "/assets/", 
      theme: "default",
      themeColor: "#991b1b", // Кроваво-красный цвет пластика
      scale: 8,              // Сделаем кубики чуть покрупнее для подноса
      spinForce: 6,          // Сила кручения
      throwForce: 7,         // Сила броска
      gravity: 3,            // Гравитация чуть выше
      startingHeight: 12     // Высота, с которой падают кубики (чуть ниже, чтобы сразу были в подносе)
    });

    diceBoxRef.current.init().then(() => {
      console.log("🎲 3D Поднос для кубиков готов!");
      
      // Ловим момент, когда кубики остановились
      diceBoxRef.current.onRollComplete = (results: any) => {
        if (onRollComplete) onRollComplete(results);
      };
    });

    // === ДЕЛАЕМ ФУНКЦИИ ГЛОБАЛЬНЫМИ ===
    // 1. Обычный бросок (со случайным результатом)
    (window as any).roll3D = (notation: string) => {
      if (diceBoxRef.current && isTrayVisible()) {
        diceBoxRef.current.roll(notation);
      }
    };

    // 2. === ГЛАВНОЕ: Синхронизированный бросок (с ГАРАНТИРОВАННЫМ результатом) ===
    (window as any).roll3DSync = (notation: string, results: number[]) => {
      if (!diceBoxRef.current || !isTrayVisible()) return;
      
      console.log(`🎲 Синхро-бросок ${notation}: показываем ${results.join(', ')}`);
      
      // Превращаем массив результатов в нужный формат: [{ groupId: 0, rolls: [{value: 2}, {value: 4}...] }]
      const formattedRolls = results.map(value => ({ value }));
      
      diceBoxRef.current.roll(notation, {
        forcedResults: [{
          groupId: 0,
          rolls: formattedRolls
        }]
      });
    };

    const isTrayVisible = () => {
        const tray = document.getElementById('dice-box-container');
        return tray && tray.offsetParent !== null; // Простая проверка, виден ли элемент
    }

  }, [onRollComplete]);

  // Мы больше ничего не возвращаем, так как id="dice-box-container" теперь находится в DiceTray.tsx
  return null;
}