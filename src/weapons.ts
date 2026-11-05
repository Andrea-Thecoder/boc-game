import type { Flavour } from './art/sprites';

export interface WeaponDef {
  flavour: Flavour;
  name: string;
  /** ms between throws */
  cooldown: number;
  damage: number;
  /** Infinity for the trusty tamarindo */
  ammo: number;
  speed: number;
  /** effective gravity of the brick, px/s² */
  gravity: number;
  /** angular offsets (radians) of each brick in a volley */
  spread: number[];
  bounces: number;
  jitter: number;
  /** what Paolone shouts when he picks it up */
  shout: string;
}

export const WEAPONS: Record<Flavour, WeaponDef> = {
  tamarindo: {
    flavour: 'tamarindo',
    name: 'SUKKINO AL TAMARINDO',
    cooldown: 250,
    damage: 1,
    ammo: Infinity,
    speed: 250,
    gravity: 260,
    spread: [0],
    bounces: 0,
    jitter: 0,
    shout: '',
  },
  pera: {
    flavour: 'pera',
    name: 'SUKKINO ALLA PERA',
    cooldown: 380,
    damage: 1,
    ammo: 30,
    speed: 240,
    gravity: 220,
    spread: [-0.24, 0, 0.24],
    bounces: 0,
    jitter: 0,
    shout: 'Pera! Che bontà, ne tiro tre alla volta!',
  },
  ace: {
    flavour: 'ace',
    name: 'SUKKINO ACE',
    cooldown: 95,
    damage: 1,
    ammo: 80,
    speed: 330,
    gravity: 120,
    spread: [0],
    bounces: 0,
    jitter: 0.09,
    shout: 'ACE! Vitamine a cannonate!',
  },
  pesca: {
    flavour: 'pesca',
    name: 'SUKKINO ALLA PESCA',
    cooldown: 300,
    damage: 2,
    ammo: 25,
    speed: 230,
    gravity: 480,
    spread: [0],
    bounces: 3,
    jitter: 0,
    shout: 'Pesca! Rimbalza come la mia panza!',
  },
};
