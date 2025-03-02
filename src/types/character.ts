export interface Character {
  id?: string;
  user_id: string;
  name: string;
  kin: string;
  profession: string;
  magicSchool?: 'Animist' | 'Elementalist' | 'Mentalist';
  age: 'Young' | 'Adult' | 'Old';
  attributes: {
    STR: number;
    CON: number;
    AGL: number;
    INT: number;
    WIL: number;
    CHA: number;
  };
  trainedSkills: string[];
  otherSkills: string[];
  equipment: {
    inventory: any[];
    equipped: {
      armor?: string;
      helmet?: string;
      weapons: Array<{
        name: string;
        grip: '1H' | '2H';
        range: string | number;
        damage: string;
        durability: number;
        features: string[];
      }>;
    };
    money: {
      gold: number;
      silver: number;
      copper: number;
    };
  };
  appearance?: string;
  conditions: {
    exhausted: boolean;
    sickly: boolean;
    dazed: boolean;
    angry: boolean;
    scared: boolean;
    disheartened: boolean;
  };
  spells?: {
    general: string[];
    school?: {
      name: string;
      spells: string[];
    };
  };
  experience: {
    markedSkills: string[];
  };
  startingEquipment?: {
    option: number;
    items: string[];
  };
  currentHP: number;
  currentWP: number;
}
