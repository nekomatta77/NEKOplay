// src/games/DeadOfWinter/data/survivors.ts

export interface SurvivorData {
  id: string;
  name: string;
  profession: string;
  influence: number;
  attack: number;
  search: number;
  image: string;
  abilityTitle: string;
  abilityDesc: string;
}

// Базовый путь к твоему репозиторию на GitHub
const BASE_IMG_URL = "https://raw.githubusercontent.com/nekomatta77/NEKOplayAssets/main/DeadOfWinter";

export const SURVIVORS: Record<string, SurvivorData> = {
  andrew_evans: {
    id: 'andrew_evans', name: 'Эндрю Эванс', profession: 'Фермер', influence: 64, attack: 3, search: 3,
    image: `${BASE_IMG_URL}/AndrewEvans.png`, abilityTitle: 'Урожай', abilityDesc: 'Один раз за раунд может добавить 1 еду в хранилище колонии.'
  },
  artur_thurston: {
    id: 'artur_thurston', name: 'Артур Терстон', profession: 'Директор школы', influence: 73, attack: 4, search: 3,
    image: `${BASE_IMG_URL}/ArturThurston.png`, abilityTitle: 'Лидерство', abilityDesc: 'Один раз за раунд может передать свой кубик действия другому игроку.'
  },
  carla_thompson: {
    id: 'carla_thompson', name: 'Карла Томпсон', profession: 'Полицейский диспетчер', influence: 54, attack: 2, search: 4,
    image: `${BASE_IMG_URL}/CarlaThompson.png`, abilityTitle: 'Связь', abilityDesc: 'При поиске в полицейском участке может посмотреть на 1 карту больше.'
  },
  forest_plum: {
    id: 'forest_plum', name: 'Форест Плам', profession: 'Аниматор', influence: 22, attack: 4, search: 4,
    image: `${BASE_IMG_URL}/ForestPlum.png`, abilityTitle: 'Санта мертв', abilityDesc: 'Если Форест погибает, мораль колонии падает на 1 дополнительное очко.'
  },
  james_meyers: {
    id: 'james_meyers', name: 'Джеймс Майерс', profession: 'Психиатр', influence: 68, attack: 4, search: 3,
    image: `${BASE_IMG_URL}/JamesMeyers.png`, abilityTitle: 'Терапия', abilityDesc: 'Раз в раунд может сбросить карту, чтобы повысить мораль на 1 (если она ниже 3).'
  },
  maria_lopez: {
    id: 'maria_lopez', name: 'Мария Лопес', profession: 'Учительница', influence: 50, attack: 4, search: 3,
    image: `${BASE_IMG_URL}/MariaLopez.png`, abilityTitle: 'Опека', abilityDesc: 'Позволяет добавить 1 беспомощного выжившего без броска кубика повреждений.'
  },
  mike_cho: {
    id: 'mike_cho', name: 'Майк Чо', profession: 'Студент', influence: 60, attack: 3, search: 4,
    image: `${BASE_IMG_URL}/MikeCho.png`, abilityTitle: 'Катана', abilityDesc: 'При убийстве зомби бросает кубик повреждений только при результате 1-2.'
  },
  olivia_brown: {
    id: 'olivia_brown', name: 'Оливия Браун', profession: 'Врач', influence: 66, attack: 4, search: 3,
    image: `${BASE_IMG_URL}/OliviaBrown.png`, abilityTitle: 'Медицина', abilityDesc: 'Может вылечить 1 рану у любого выжившего в своей локации, потратив кубик 3+.'
  },
  rod_miller: {
    id: 'rod_miller', name: 'Род Миллер', profession: 'Дальнобойщик', influence: 58, attack: 3, search: 4,
    image: `${BASE_IMG_URL}/RodMiller.png`, abilityTitle: 'За рулем', abilityDesc: 'Может переместить до двух выживших вместе с собой без дополнительного броска кубика повреждений.'
  },
  sophie_robinson: {
    id: 'sophie_robinson', name: 'Софи Робинсон', profession: 'Пилот', influence: 48, attack: 4, search: 2,
    image: `${BASE_IMG_URL}/SophieRobinson.png`, abilityTitle: 'Разведка', abilityDesc: 'Раз в раунд может подсмотреть верхнюю карту кризиса до ее открытия.'
  },
  sparky: {
    id: 'sparky', name: 'Спарки', profession: 'Пес-каскадер', influence: 71, attack: 2, search: 3,
    image: `${BASE_IMG_URL}/Sparky.png`, abilityTitle: 'Хороший мальчик', abilityDesc: 'Спарки не может использовать огнестрельное оружие, но игнорирует результаты "Укус" на кубике повреждений.'
  },
  thomas_heart: {
    id: 'thomas_heart', name: 'Томас Харт', profession: 'Солдат', influence: 62, attack: 2, search: 4,
    image: `${BASE_IMG_URL}/ThomasHeart.png`, abilityTitle: 'Тактика', abilityDesc: 'Может перебросить один свой кубик действия один раз за ход.'
  }
};