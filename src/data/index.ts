import { Kin, Profession, Skill, Spell, HeroicAbility, Equipment } from '../types/character';

export const kins: Kin[] = [
  {
    name: "Human",
    description: "Humans are the last-born. The other kin have songs and legends about times before the dawn of humanity. Today, humans are widespread, with many as peasants and others as warriors or adventurers.",
    ability: {
      name: "Adaptive",
      willpower_points: 3,
      description: "When rolling for a skill, you can choose another skill. The GM has the final word but should be lenient."
    }
  },
  {
    name: "Halfling",
    description: "Halflings are short humanoids, often living in hilly farmlands in earthen dwellings. Modest and amiable, they sometimes seek adventures despite their vulnerability.",
    ability: {
      name: "Hard to Catch",
      willpower_points: 3,
      description: "Activate this ability when dodging an attack to get a boon to the Evade roll."
    }
  },
  {
    name: "Dwarf",
    description: "Dwarves are ancient and proud, connected with the bedrock. They are skilled blacksmiths and fierce warriors, respected for their crafting skills.",
    ability: {
      name: "Unforgiving",
      willpower_points: 3,
      description: "Activate this ability when attacking someone who harmed you before to gain a boon to the roll."
    }
  },
  {
    name: "Elf",
    description: "Elves are ancient beings who revere the stars. They are introspective and guided by metaphysical concerns, including powerful warriors known for their skill in battle.",
    ability: {
      name: "Inner Peace",
      willpower_points: null,
      description: "During meditation, heal additional HP and WP, and recover from an additional condition. Unresponsive during meditation."
    }
  },
  {
    name: "Mallard",
    description: "Mallards are feathered humanoids known for their temper and trade acumen. They are common in marketplaces and sometimes live as brigands or mercenaries.",
    ability: [
      {
        name: "Ill-Tempered",
        willpower_points: 3,
        description: "Activate this ability for a boon to the roll, but you become Angry. Cannot be used for INT-based rolls."
      },
      {
        name: "Webbed Feet",
        willpower_points: null,
        description: "Get a boon to all Swimming rolls. Move at full speed in or under water."
      }
    ]
  },
  {
    name: "Wolfkin",
    description: "Wolfkin are wild, highly intelligent, and known for their deep connection to nature. They are fierce hunters and skilled pathfinders.",
    ability: {
      name: "Hunting Instincts",
      willpower_points: 3,
      description: "Designate a creature as prey. Follow its scent and gain a boon to attacks against it by spending WP."
    }
  }
];

export const professions: Profession[] = [
  {
    name: "Artisan",
    description: "Artisans bring order to chaos, creating structures and tools with skill and precision. They are respected for their practical expertise.",
    key_attribute: "STR",
    skills: ["Axes", "Brawling", "Crafting", "Hammers", "Knives", "Sleight of Hand", "Spot Hidden", "Swords"],
    heroic_ability: ["Master Blacksmith", "Master Carpenter", "Master Tanner"]
  },
  {
    name: "Bard",
    description: "Bards preserve memories of ancient deeds, singing and storytelling to immortalize heroes and their achievements.",
    key_attribute: "CHA",
    skills: ["Acrobatics", "Bluffing", "Evade", "Knives", "Languages", "Myths & Legends", "Performance", "Persuasion"],
    heroic_ability: ["Musician"]
  },
  {
    name: "Fighter",
    description: "Fighters live by the sword and specialize in weapon proficiency. While some are haunted by violence, others are driven by pride.",
    key_attribute: "STR",
    skills: ["Axes", "Bows", "Brawling", "Crossbows", "Evade", "Hammers", "Spears", "Swords"],
    heroic_ability: ["Veteran"]
  },
  {
    name: "Hunter",
    description: "Hunters live for the hunt and respect their prey. They find peace in the wild, gathering strength from nature.",
    key_attribute: "AGL",
    skills: ["Acrobatics", "Awareness", "Bows", "Bushcraft", "Hunting & Fishing", "Knives", "Slings", "Sneaking"],
    heroic_ability: ["Companion"]
  },
  {
    name: "Knight",
    description: "Knights swear fealty to a higher power and follow principles of chivalry. They fight to defend a cause or person.",
    key_attribute: "STR",
    skills: ["Beast Lore", "Hammers", "Myths & Legends", "Performance", "Persuasion", "Riding", "Spears", "Swords"],
    heroic_ability: ["Guardian"]
  },
  {
    name: "Mage",
    description: "Mages control ancient forces through various schools, including Animism, Elementalism, and Mentalism.",
    key_attribute: "WIL",
    skills: {
      Animist: ["Animism", "Beast Lore", "Bushcraft", "Evade", "Healing", "Hunting & Fishing", "Sneaking", "Staves"],
      Elementalist: ["Elementalism", "Awareness", "Evade", "Healing", "Languages", "Myths & Legends", "Spot Hidden", "Staves"],
      Mentalist: ["Mentalism", "Acrobatics", "Awareness", "Brawling", "Evade", "Healing", "Languages", "Myths & Legends"]
    },
    heroic_ability: ["As a mage, you don't get a starting heroic ability. Instead, you get your magic."]
  },
  {
    name: "Mariner",
    description: "Mariners are tied to the water, whether by sea, rivers, or lakes. They include pirates, captains, and explorers.",
    key_attribute: "AGL",
    skills: ["Acrobatics", "Awareness", "Hunting & Fishing", "Knives", "Languages", "Seamanship", "Swimming", "Swords"],
    heroic_ability: ["Sea Legs"]
  },
  {
    name: "Merchant",
    description: "Merchants are skilled in the art of buying low and selling high, always searching for the next profitable deal.",
    key_attribute: "CHA",
    skills: ["Awareness", "Bartering", "Bluffing", "Evade", "Knives", "Persuasion", "Sleight of Hand", "Spot Hidden"],
    heroic_ability: ["Treasure Hunter"]
  },
  {
    name: "Scholar",
    description: "Scholars seek knowledge about the natural and hidden world, studying myths, legends, and ancient languages.",
    key_attribute: "INT",
    skills: ["Awareness", "Beast Lore", "Bushcraft", "Evade", "Healing", "Languages", "Myths & Legends", "Spot Hidden"],
    heroic_ability: ["Intuition"]
  },
  {
    name: "Thief",
    description: "Thieves specialize in acquiring others' property. They operate by their own code and are often members of guilds.",
    key_attribute: "AGL",
    skills: ["Acrobatics", "Awareness", "Bluffing", "Evade", "Knives", "Sleight of Hand", "Sneaking", "Spot Hidden"],
    heroic_ability: ["Backstabbing"]
  }
];
