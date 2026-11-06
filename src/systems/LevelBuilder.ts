import type Phaser from 'phaser';
import { BOSS_ARENA_X, GROUND_Y, H, LEVEL_WIDTH, W } from '../config';
import { CONTENT, type LevelDef } from '../content';
import { clean } from '../ui/text';
import type { Solids } from './GameContext';

export interface BuiltLevel {
  solids: Solids;
  /** background layers scrolled by the CameraSystem */
  parallax: { hills: Phaser.GameObjects.TileSprite; houses: Phaser.GameObjects.TileSprite };
}

/** Builds backdrop, ground, scenery props and their one-way platforms from the level data. */
export function buildLevel(scene: Phaser.Scene, level: LevelDef): BuiltLevel {
  scene.add.image(0, 0, 'bg-sky').setOrigin(0).setScrollFactor(0).setDepth(-100);
  const hills = scene.add.tileSprite(0, 0, W, H, 'bg-hills').setOrigin(0).setScrollFactor(0).setDepth(-90);
  const houses = scene.add.tileSprite(0, 0, W, H, 'bg-houses').setOrigin(0).setScrollFactor(0).setDepth(-80);
  scene.add
    .image(BOSS_ARENA_X + 175, GROUND_Y + 2, 'chiesa')
    .setOrigin(0.5, 1)
    .setDepth(-70);
  scene.add
    .tileSprite(0, GROUND_Y, LEVEL_WIDTH, H - GROUND_Y, 'ground')
    .setOrigin(0)
    .setDepth(10);

  const ground = scene.physics.add.staticGroup();
  ground.add(scene.add.zone(LEVEL_WIDTH / 2, GROUND_Y + 10, LEVEL_WIDTH, 20));
  const platforms = scene.physics.add.staticGroup();

  for (const p of level.props) {
    const kind = CONTENT.props[p.kind];
    const y = p.y ?? GROUND_Y + kind.groundOffset;
    scene.add.image(p.x, y, p.kind).setOrigin(0.5, 1).setDepth(kind.depth);
    if (kind.platform) addPlatform(scene, platforms, p.x + kind.platform.dx, y + kind.platform.dy, kind.platform.w);
    if (p.label !== undefined) {
      scene.add
        .bitmapText(p.x, y + (kind.labelDy ?? 0), 'px', clean(p.label), 6)
        .setOrigin(0.5)
        .setTint(0x120b16)
        .setDepth(26);
    }
  }

  return { solids: { ground, platforms }, parallax: { hills, houses } };
}

/** One-way platform: solid only from above, you can jump through it from below. */
function addPlatform(
  scene: Phaser.Scene,
  platforms: Phaser.Physics.Arcade.StaticGroup,
  cx: number,
  top: number,
  w: number,
) {
  const z = scene.add.zone(cx, top + 2, w, 4);
  platforms.add(z);
  const body = z.body as Phaser.Physics.Arcade.StaticBody;
  body.checkCollision.down = false;
  body.checkCollision.left = false;
  body.checkCollision.right = false;
}
