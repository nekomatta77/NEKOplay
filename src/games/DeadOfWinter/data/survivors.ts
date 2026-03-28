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
  image: string; // Путь к картинке (или временная заглушка)
}

// Базовая ссылка для заглушек. Когда сгенерируешь свои арты 2:3,
// замени эти ссылки на локальные пути типа '/assets/games/DeadOfWinter/characters/...'
const placeholder = (text: string) => `https://placehold.co/400x600/1e293b/94a3b8?text=${encodeURIComponent(text)}`;

// Полная база из 30 персонажей оригинальной игры (с временными заглушками картинок)
export const SURVIVORS: Record<string, SurvivorData> = {
  'arthur_thurston': {
    id: 'arthur_thurston',
    name: 'Артур Терстон',
    profession: 'Директор школы',
    influence: 73,
    attack: 3,
    search: 3,
    abilityTitle: 'Авторитет',
    abilityDesc: 'Один раз за раунд вы можете добавить 1 кубик действия в свой пул кубиков.',
    image: placeholder('ARTHUR THURSTON')
  },
  'sparky': {
    id: 'sparky',
    name: 'Спарки',
    profession: 'Собака-каскадер',
    influence: 15,
    attack: 2,
    search: 4,
    abilityTitle: 'Хороший мальчик',
    abilityDesc: 'Спарки не может экипировать оружие. При броске кубика повреждений, если выпадает "Укус", считайте это "Раной". Спарки не передает укусы.',
    image: placeholder('SPARKY')
  },
  'loretta_clay': {
    id: 'loretta_clay',
    name: 'Лоретта Клей',
    profession: 'Повариха',
    influence: 51,
    attack: 4,
    search: 3,
    abilityTitle: 'Сытный обед',
    abilityDesc: 'Один раз за раунд, если Лоретта в Колонии, вы можете добавить 1 жетон еды на склад Колонии.',
    image: placeholder('LORETTA CLAY')
  },
  'mike_cho': {
    id: 'mike_cho',
    name: 'Майк Чо',
    profession: 'Студент-ниндзя',
    influence: 46,
    attack: 2,
    search: 4,
    abilityTitle: 'Скрытность',
    abilityDesc: 'Майк не бросает кубик повреждений при атаке зомби.',
    image: placeholder('MIKE CHO')
  },
  'olivia_brown': {
    id: 'olivia_brown',
    name: 'Оливия Браун',
    profession: 'Врач',
    influence: 68,
    attack: 4,
    search: 3,
    abilityTitle: 'Первая помощь',
    abilityDesc: 'Один раз за раунд Оливия может убрать 1 любую рану с выжившего в своей локации.',
    image: placeholder('OLIVIA BROWN')
  },
  'rod_miller': {
    id: 'rod_miller',
    name: 'Род Миллер',
    profession: 'Дальнобойщик',
    influence: 60,
    attack: 3,
    search: 3,
    abilityTitle: 'Опытный водитель',
    abilityDesc: 'При перемещении Рода в другую локацию не нужно бросать кубик повреждений.',
    image: placeholder('ROD MILLER')
  },
  'carla_thompson': {
    id: 'carla_thompson',
    name: 'Карла Томпсон',
    profession: 'Диспетчер полиции',
    influence: 64,
    attack: 4,
    search: 2,
    abilityTitle: 'Связи в участке',
    abilityDesc: 'Один раз за раунд при поиске в Полицейском участке Карла может посмотреть и оставить себе на 1 карту больше.',
    image: placeholder('CARLA THOMPSON')
  },
  'sophie_robinson': {
    id: 'sophie_robinson',
    name: 'Софи Робинсон',
    profession: 'Пилот',
    influence: 65,
    attack: 4,
    search: 1,
    abilityTitle: 'Разведка с воздуха',
    abilityDesc: 'Один раз за раунд Софи может посмотреть верхнюю карту колоды любой локации.',
    image: placeholder('SOPHIE ROBINSON')
  },
  'maria_lopez': {
    id: 'maria_lopez',
    name: 'Мария Лопес',
    profession: 'Учительница',
    influence: 62,
    attack: 4,
    search: 2,
    abilityTitle: 'Знание школы',
    abilityDesc: 'Один раз за раунд, потратив кубик (1+), Мария может убить 1 зомби в Школе без кубика повреждений.',
    image: placeholder('MARIA LOPEZ')
  },
  'thomas_heart': {
    id: 'thomas_heart',
    name: 'Томас Харт',
    profession: 'Солдат',
    influence: 75,
    attack: 1,
    search: 3,
    abilityTitle: 'Снайпер',
    abilityDesc: 'Один раз за раунд, потратив кубик (5+), Томас может убить 2 зомби в Колонии без кубика повреждений.',
    image: placeholder('THOMAS HEART')
  },
  'andrew_evans': {
    id: 'andrew_evans',
    name: 'Эндрю Эванс',
    profession: 'Фермер',
    influence: 66,
    attack: 3,
    search: 3,
    abilityTitle: 'Запасливый',
    abilityDesc: 'При поиске в Продуктовом магазине Эндрю может посмотреть и оставить себе на 1 карту больше.',
    image: placeholder('ANDREW EVANS')
  },
  'forest_plum': {
    id: 'forest_plum',
    name: 'Форест Плам',
    profession: 'Санта из ТЦ',
    influence: 32,
    attack: 3,
    search: 3,
    abilityTitle: 'Дух Рождества',
    abilityDesc: 'Один раз за игру вы можете убить Фореста, чтобы поднять мораль на 1. Мораль не падает за его смерть.',
    image: placeholder('FOREST PLUM')
  },
  'annaleigh_chan': {
    id: 'annaleigh_chan',
    name: 'Аннали Чан',
    profession: 'Юрист',
    influence: 54,
    attack: 2,
    search: 2,
    abilityTitle: 'Наблюдательность',
    abilityDesc: 'Один раз за раунд в Колонии вы можете посмотреть 1 случайную карту из руки другого игрока.',
    image: placeholder('ANNALEIGH CHAN')
  },
  'john_price': {
    id: 'john_price',
    name: 'Джон Прайс',
    profession: 'Студент',
    influence: 41,
    attack: 3,
    search: 3,
    abilityTitle: 'Подражатель',
    abilityDesc: 'Джон обладает способностями всех остальных выживших, находящихся в одной с ним локации.',
    image: placeholder('JOHN PRICE')
  },
  'brandon_cameron': {
    id: 'brandon_cameron',
    name: 'Брэндон Кэмерон',
    profession: 'Уборщик',
    influence: 22,
    attack: 3,
    search: 3,
    abilityTitle: 'Генеральная уборка',
    abilityDesc: 'Один раз за раунд в Колонии Брэндон может сбросить 3 карты из мусора, потратив кубик действия (любой).',
    image: placeholder('BRANDON CAMERON')
  },
  'david_garcia': {
    id: 'david_garcia',
    name: 'Дэвид Гарсия',
    profession: 'Бухгалтер',
    influence: 48,
    attack: 3,
    search: 2,
    abilityTitle: 'Педантичность',
    abilityDesc: 'Один раз за раунд при поиске в любой локации Дэвид может посмотреть и оставить себе на 1 карту больше.',
    image: placeholder('DAVID GARCIA')
  },
  'harman_brooks': {
    id: 'harman_brooks',
    name: 'Харман Брукс',
    profession: 'Рейнджер',
    influence: 55,
    attack: 2,
    search: 3,
    abilityTitle: 'Закаленный',
    abilityDesc: 'Если Харман должен получить обморожение, он получает обычную рану вместо этого.',
    image: placeholder('HARMAN BROOKS')
  },
  'bev_russell': {
    id: 'bev_russell',
    name: 'Бев Рассел',
    profession: 'Мать',
    influence: 44,
    attack: 2,
    search: 3,
    abilityTitle: 'Защитница',
    abilityDesc: 'Один раз за раунд Бев может убить 1 зомби в своей локации без броска кубика повреждений.',
    image: placeholder('BEV RUSSELL')
  },
  'ashley_ross': {
    id: 'ashley_ross',
    name: 'Эшли Росс',
    profession: 'Строитель',
    influence: 61,
    attack: 3,
    search: 3,
    abilityTitle: 'Укрепления',
    abilityDesc: 'Один раз за раунд Эшли может поставить 1 баррикаду в своей локации без траты кубика действия.',
    image: placeholder('ASHLEY ROSS')
  },
  'brian_baker': {
    id: 'brian_baker',
    name: 'Брайан Л.Б. Бейкер',
    profession: 'Мэр',
    influence: 82,
    attack: 3,
    search: 4,
    abilityTitle: 'Харизма',
    abilityDesc: 'При голосовании за изгнание голос Брайана считается за два.',
    image: placeholder('BRIAN BAKER')
  },
  'buddy_davis': {
    id: 'buddy_davis',
    name: 'Бадди Дэвис',
    profession: 'Фитнес-тренер',
    influence: 58,
    attack: 2,
    search: 3,
    abilityTitle: 'Атлет',
    abilityDesc: 'Бадди может перемещаться один дополнительный раз за раунд без броска кубика повреждений.',
    image: placeholder('BUDDY DAVIS')
  },
  'daniel_smith': {
    id: 'daniel_smith',
    name: 'Дэниел Смит',
    profession: 'Шериф',
    influence: 78,
    attack: 2,
    search: 3,
    abilityTitle: 'Меткий стрелок',
    abilityDesc: 'При атаке Дэниел убивает 1 дополнительного зомби в той же локации.',
    image: placeholder('DANIEL SMITH')
  },
  'edward_white': {
    id: 'edward_white',
    name: 'Эдвард Уайт',
    profession: 'Химик',
    influence: 50,
    attack: 4,
    search: 2,
    abilityTitle: 'Синтез',
    abilityDesc: 'Один раз за раунд Эдвард может сбросить 2 любые карты, чтобы вылечить 1 рану у выжившего в своей локации.',
    image: placeholder('EDWARD WHITE')
  },
  'gabriel_diaz': {
    id: 'gabriel_diaz',
    name: 'Габриэль Диас',
    profession: 'Пожарный',
    influence: 63,
    attack: 2,
    search: 3,
    abilityTitle: 'Бесстрашный',
    abilityDesc: 'При броске кубика повреждений Габриэль перебрасывает пустую грань (вы можете выбрать новый результат).',
    image: placeholder('GABRIEL DIAZ')
  },
  'gwen_mellon': {
    id: 'gwen_mellon',
    name: 'Гвен Меллон',
    profession: 'Официантка',
    influence: 38,
    attack: 4,
    search: 2,
    abilityTitle: 'Смекалка',
    abilityDesc: 'При поиске Гвен всегда находит как минимум 1 карту еды (даже если колода локации не содержит еды).',
    image: placeholder('GWEN MELLON')
  },
  'hope_harper': {
    id: 'hope_harper',
    name: 'Хоуп Харпер',
    profession: 'Королева красоты',
    influence: 59,
    attack: 4,
    search: 3,
    abilityTitle: 'Приманка',
    abilityDesc: 'Один раз за раунд Хоуп может переместить до 2 зомби из Колонии в свою текущую локацию (не Колонию).',
    image: placeholder('HOPE HARPER')
  },
  'james_meyers': {
    id: 'james_meyers',
    name: 'Джеймс Майерс',
    profession: 'Психиатр',
    influence: 71,
    attack: 4,
    search: 3,
    abilityTitle: 'Психоанализ',
    abilityDesc: 'Один раз за игру Джеймс может тайно посмотреть секретную цель одного из игроков.',
    image: placeholder('JAMES MEYERS')
  },
  'janet_taylor': {
    id: 'janet_taylor',
    name: 'Джанет Тейлор',
    profession: 'Медсестра',
    influence: 53,
    attack: 4,
    search: 3,
    abilityTitle: 'Уход',
    abilityDesc: 'Если Джанет в Больнице, она может вылечить 1 рану любому выжившему в Колонии.',
    image: placeholder('JANET TAYLOR')
  },
  'jenny_clark': {
    id: 'jenny_clark',
    name: 'Дженни Кларк',
    profession: 'Студентка',
    influence: 42,
    attack: 3,
    search: 2,
    abilityTitle: 'Любопытная',
    abilityDesc: 'Один раз за раунд при поиске Дженни может посмотреть на 2 карты больше, чем обычно.',
    image: placeholder('JENNY CLARK')
  },
  'kodiak_colby': {
    id: 'kodiak_colby',
    name: 'Кодиак Колби',
    profession: 'Выживальщик',
    influence: 69,
    attack: 2,
    search: 2,
    abilityTitle: 'Одиночка',
    abilityDesc: 'Кодиак не потребляет еду в фазу Колонии.',
    image: placeholder('KODIAK COLBY')
  }
};

export const getSurvivorData = (id: string): SurvivorData | undefined => {
  return SURVIVORS[id];
};

export const getAllSurvivors = (): SurvivorData[] => {
  return Object.values(SURVIVORS);
};