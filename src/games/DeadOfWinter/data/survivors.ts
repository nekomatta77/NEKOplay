// src/games/DeadOfWinter/data/survivors.ts

export interface SurvivorData {
  id: string;
  name: string;
  profession: string;
  influence: number;
  attack: number;
  search: number;
  abilityTitle: string;
  abilityDesc: string;
  image: string; 
}

// === НАСТРОЙКИ ХРАНИЛИЩА GITHUB ===
const GITHUB_USERNAME = 'nekomatta77'; 
const GITHUB_REPO = 'NEKOplayAssets'; 
const GITHUB_BRANCH = 'main';
const IMAGE_EXTENSION = '.png'; 

// Функция, которая автоматически собирает ссылки
const getImageUrl = (id: string, placeholderText: string) => {
  const useGithub = true; 

  if (!useGithub) {
    return `https://placehold.co/400x600/1e293b/94a3b8?text=${encodeURIComponent(placeholderText)}`;
  }

  return `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${GITHUB_BRANCH}/${id}${IMAGE_EXTENSION}`;
};

// База персонажей (оставлены только 12 готовых)
export const SURVIVORS: Record<string, SurvivorData> = {
  'ArturThurston': { // Внимание: ID изменен под точное название твоего файла ArturThurston.png
    id: 'ArturThurston',
    name: 'Артур Терстон',
    profession: 'Директор школы',
    influence: 73,
    attack: 3,
    search: 3,
    abilityTitle: 'Авторитет',
    abilityDesc: 'Один раз за раунд вы можете добавить 1 кубик действия в свой пул кубиков.',
    image: getImageUrl('ArturThurston', 'ARTHUR THURSTON')
  },
  'Sparky': {
    id: 'Sparky',
    name: 'Спарки',
    profession: 'Собака-каскадер',
    influence: 15,
    attack: 2,
    search: 4,
    abilityTitle: 'Хороший мальчик',
    abilityDesc: 'Спарки не может экипировать оружие. При броске кубика повреждений, если выпадает "Укус", считайте это "Раной". Спарки не передает укусы.',
    image: getImageUrl('Sparky', 'SPARKY')
  },
  'MikeCho': {
    id: 'MikeCho',
    name: 'Майк Чо',
    profession: 'Студент-ниндзя',
    influence: 46,
    attack: 2,
    search: 4,
    abilityTitle: 'Скрытность',
    abilityDesc: 'Майк не бросает кубик повреждений при атаке зомби.',
    image: getImageUrl('MikeCho', 'MIKE CHO')
  },
  'OliviaBrown': {
    id: 'OliviaBrown',
    name: 'Оливия Браун',
    profession: 'Врач',
    influence: 68,
    attack: 4,
    search: 3,
    abilityTitle: 'Первая помощь',
    abilityDesc: 'Один раз за раунд Оливия может убрать 1 любую рану с выжившего в своей локации.',
    image: getImageUrl('OliviaBrown', 'OLIVIA BROWN')
  },
  'RodMiller': {
    id: 'RodMiller',
    name: 'Род Миллер',
    profession: 'Дальнобойщик',
    influence: 60,
    attack: 3,
    search: 3,
    abilityTitle: 'Опытный водитель',
    abilityDesc: 'При перемещении Рода в другую локацию не нужно бросать кубик повреждений.',
    image: getImageUrl('RodMiller', 'ROD MILLER')
  },
  'CarlaThompson': {
    id: 'CarlaThompson',
    name: 'Карла Томпсон',
    profession: 'Диспетчер полиции',
    influence: 64,
    attack: 4,
    search: 2,
    abilityTitle: 'Связи в участке',
    abilityDesc: 'Один раз за раунд при поиске в Полицейском участке Карла может посмотреть и оставить себе на 1 карту больше.',
    image: getImageUrl('CarlaThompson', 'CARLA THOMPSON')
  },
  'SophieRobinson': {
    id: 'SophieRobinson',
    name: 'Софи Робинсон',
    profession: 'Пилот',
    influence: 65,
    attack: 4,
    search: 1,
    abilityTitle: 'Разведка с воздуха',
    abilityDesc: 'Один раз за раунд Софи может посмотреть верхнюю карту колоды любой локации.',
    image: getImageUrl('SophieRobinson', 'SOPHIE ROBINSON')
  },
  'MariaLopez': {
    id: 'MariaLopez',
    name: 'Мария Лопес',
    profession: 'Учительница',
    influence: 62,
    attack: 4,
    search: 2,
    abilityTitle: 'Знание школы',
    abilityDesc: 'Один раз за раунд, потратив кубик (1+), Мария может убить 1 зомби в Школе без кубика повреждений.',
    image: getImageUrl('MariaLopez', 'MARIA LOPEZ')
  },
  'ThomasHeart': {
    id: 'ThomasHeart',
    name: 'Томас Харт',
    profession: 'Солдат',
    influence: 75,
    attack: 1,
    search: 3,
    abilityTitle: 'Снайпер',
    abilityDesc: 'Один раз за раунд, потратив кубик (5+), Томас может убить 2 зомби в Колонии без кубика повреждений.',
    image: getImageUrl('ThomasHeart', 'THOMAS HEART')
  },
  'AndrewEvans': {
    id: 'AndrewEvans',
    name: 'Эндрю Эванс',
    profession: 'Фермер',
    influence: 66,
    attack: 3,
    search: 3,
    abilityTitle: 'Запасливый',
    abilityDesc: 'При поиске в Продуктовом магазине Эндрю может посмотреть и оставить себе на 1 карту больше.',
    image: getImageUrl('AndrewEvans', 'ANDREW EVANS')
  },
  'ForestPlum': {
    id: 'ForestPlum',
    name: 'Форест Плам',
    profession: 'Санта из ТЦ',
    influence: 32,
    attack: 3,
    search: 3,
    abilityTitle: 'Дух Рождества',
    abilityDesc: 'Один раз за игру вы можете убить Фореста, чтобы поднять мораль на 1. Мораль не падает за его смерть.',
    image: getImageUrl('ForestPlum', 'FOREST PLUM')
  },
  'JamesMeyers': {
    id: 'JamesMeyers',
    name: 'Джеймс Майерс',
    profession: 'Психиатр',
    influence: 71,
    attack: 4,
    search: 3,
    abilityTitle: 'Психоанализ',
    abilityDesc: 'Один раз за игру Джеймс может тайно посмотреть секретную цель одного из игроков.',
    image: getImageUrl('JamesMeyers', 'JAMES MEYERS')
  }

  // === ПЕРСОНАЖИ В РАЗРАБОТКЕ (КАРТИНКИ НЕ ГОТОВЫ) ===
  // Чтобы вернуть персонажа в игру, просто удали двойные слеши (//) и многострочные комментарии (/* */)

  /*
  'LorettaClay': {
    id: 'LorettaClay',
    name: 'Лоретта Клей',
    profession: 'Повариха',
    influence: 51,
    attack: 4,
    search: 3,
    abilityTitle: 'Сытный обед',
    abilityDesc: 'Один раз за раунд, если Лоретта в Колонии, вы можете добавить 1 жетон еды на склад Колонии.',
    image: getImageUrl('LorettaClay', 'LORETTA CLAY')
  },
  'BevRussell': {
    id: 'BevRussell',
    name: 'Бев Рассел',
    profession: 'Мать',
    influence: 44,
    attack: 2,
    search: 3,
    abilityTitle: 'Защитница',
    abilityDesc: 'Один раз за раунд Бев может убить 1 зомби в своей локации без броска кубика повреждений.',
    image: getImageUrl('BevRussell', 'BEV RUSSELL')
  },
  'AnnaleighChan': {
    id: 'AnnaleighChan',
    name: 'Аннали Чан',
    profession: 'Юрист',
    influence: 54,
    attack: 2,
    search: 2,
    abilityTitle: 'Наблюдательность',
    abilityDesc: 'Один раз за раунд в Колонии вы можете посмотреть 1 случайную карту из руки другого игрока.',
    image: getImageUrl('AnnaleighChan', 'ANNALEIGH CHAN')
  },
  'JohnPrice': {
    id: 'JohnPrice',
    name: 'Джон Прайс',
    profession: 'Студент',
    influence: 41,
    attack: 3,
    search: 3,
    abilityTitle: 'Подражатель',
    abilityDesc: 'Джон обладает способностями всех остальных выживших, находящихся в одной с ним локации.',
    image: getImageUrl('JohnPrice', 'JOHN PRICE')
  },
  'BrandonCameron': {
    id: 'BrandonCameron',
    name: 'Брэндон Кэмерон',
    profession: 'Уборщик',
    influence: 22,
    attack: 3,
    search: 3,
    abilityTitle: 'Генеральная уборка',
    abilityDesc: 'Один раз за раунд в Колонии Брэндон может сбросить 3 карты из мусора, потратив кубик действия (любой).',
    image: getImageUrl('BrandonCameron', 'BRANDON CAMERON')
  },
  'DavidGarcia': {
    id: 'DavidGarcia',
    name: 'Дэвид Гарсия',
    profession: 'Бухгалтер',
    influence: 48,
    attack: 3,
    search: 2,
    abilityTitle: 'Педантичность',
    abilityDesc: 'Один раз за раунд при поиске в любой локации Дэвид может посмотреть и оставить себе на 1 карту больше.',
    image: getImageUrl('DavidGarcia', 'DAVID GARCIA')
  },
  'HarmanBrooks': {
    id: 'HarmanBrooks',
    name: 'Харман Брукс',
    profession: 'Рейнджер',
    influence: 55,
    attack: 2,
    search: 3,
    abilityTitle: 'Закаленный',
    abilityDesc: 'Если Харман должен получить обморожение, он получает обычную рану вместо этого.',
    image: getImageUrl('HarmanBrooks', 'HARMAN BROOKS')
  },
  'AshleyRoss': {
    id: 'AshleyRoss',
    name: 'Эшли Росс',
    profession: 'Строитель',
    influence: 61,
    attack: 3,
    search: 3,
    abilityTitle: 'Укрепления',
    abilityDesc: 'Один раз за раунд Эшли может поставить 1 баррикаду в своей локации без траты кубика действия.',
    image: getImageUrl('AshleyRoss', 'ASHLEY ROSS')
  },
  'BrianBaker': {
    id: 'BrianBaker',
    name: 'Брайан Л.Б. Бейкер',
    profession: 'Мэр',
    influence: 82,
    attack: 3,
    search: 4,
    abilityTitle: 'Харизма',
    abilityDesc: 'При голосовании за изгнание голос Брайана считается за два.',
    image: getImageUrl('BrianBaker', 'BRIAN BAKER')
  },
  'BuddyDavis': {
    id: 'BuddyDavis',
    name: 'Бадди Дэвис',
    profession: 'Фитнес-тренер',
    influence: 58,
    attack: 2,
    search: 3,
    abilityTitle: 'Атлет',
    abilityDesc: 'Бадди может перемещаться один дополнительный раз за раунд без броска кубика повреждений.',
    image: getImageUrl('BuddyDavis', 'BUDDY DAVIS')
  },
  'DanielSmith': {
    id: 'DanielSmith',
    name: 'Дэниел Смит',
    profession: 'Шериф',
    influence: 78,
    attack: 2,
    search: 3,
    abilityTitle: 'Меткий стрелок',
    abilityDesc: 'При атаке Дэниел убивает 1 дополнительного зомби в той же локации.',
    image: getImageUrl('DanielSmith', 'DANIEL SMITH')
  },
  'EdwardWhite': {
    id: 'EdwardWhite',
    name: 'Эдвард Уайт',
    profession: 'Химик',
    influence: 50,
    attack: 4,
    search: 2,
    abilityTitle: 'Синтез',
    abilityDesc: 'Один раз за раунд Эдвард может сбросить 2 любые карты, чтобы вылечить 1 рану у выжившего в своей локации.',
    image: getImageUrl('EdwardWhite', 'EDWARD WHITE')
  },
  'GabrielDiaz': {
    id: 'GabrielDiaz',
    name: 'Габриэль Диас',
    profession: 'Пожарный',
    influence: 63,
    attack: 2,
    search: 3,
    abilityTitle: 'Бесстрашный',
    abilityDesc: 'При броске кубика повреждений Габриэль перебрасывает пустую грань (вы можете выбрать новый результат).',
    image: getImageUrl('GabrielDiaz', 'GABRIEL DIAZ')
  },
  'GwenMellon': {
    id: 'GwenMellon',
    name: 'Гвен Меллон',
    profession: 'Официантка',
    influence: 38,
    attack: 4,
    search: 2,
    abilityTitle: 'Смекалка',
    abilityDesc: 'При поиске Гвен всегда находит как минимум 1 карту еды (даже если колода локации не содержит еды).',
    image: getImageUrl('GwenMellon', 'GWEN MELLON')
  },
  'HopeHarper': {
    id: 'HopeHarper',
    name: 'Хоуп Харпер',
    profession: 'Королева красоты',
    influence: 59,
    attack: 4,
    search: 3,
    abilityTitle: 'Приманка',
    abilityDesc: 'Один раз за раунд Хоуп может переместить до 2 зомби из Колонии в свою текущую локацию (не Колонию).',
    image: getImageUrl('HopeHarper', 'HOPE HARPER')
  },
  'JanetTaylor': {
    id: 'JanetTaylor',
    name: 'Джанет Тейлор',
    profession: 'Медсестра',
    influence: 53,
    attack: 4,
    search: 3,
    abilityTitle: 'Уход',
    abilityDesc: 'Если Джанет в Больнице, она может вылечить 1 рану любому выжившему в Колонии.',
    image: getImageUrl('JanetTaylor', 'JANET TAYLOR')
  },
  'JennyClark': {
    id: 'JennyClark',
    name: 'Дженни Кларк',
    profession: 'Студентка',
    influence: 42,
    attack: 3,
    search: 2,
    abilityTitle: 'Любопытная',
    abilityDesc: 'Один раз за раунд при поиске Дженни может посмотреть на 2 карты больше, чем обычно.',
    image: getImageUrl('JennyClark', 'JENNY CLARK')
  },
  'KodiakColby': {
    id: 'KodiakColby',
    name: 'Кодиак Колби',
    profession: 'Выживальщик',
    influence: 69,
    attack: 2,
    search: 2,
    abilityTitle: 'Одиночка',
    abilityDesc: 'Кодиак не потребляет еду в фазу Колонии.',
    image: getImageUrl('KodiakColby', 'KODIAK COLBY')
  }
  */
};

export const getSurvivorData = (id: string): SurvivorData | undefined => {
  return SURVIVORS[id];
};

export const getAllSurvivors = (): SurvivorData[] => {
  return Object.values(SURVIVORS);
};