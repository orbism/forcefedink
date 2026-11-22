import * as migration_20260926_195338_initial from './20260926_195338_initial';
import * as migration_20261121_083350_shop from './20261121_083350_shop';
import * as migration_20261121_171822_media_blur from './20261121_171822_media_blur';
import * as migration_20261121_200809_site_pages from './20261121_200809_site_pages';
import * as migration_20261122_000833_about_byline from './20261122_000833_about_byline';

export const migrations = [
  {
    up: migration_20260926_195338_initial.up,
    down: migration_20260926_195338_initial.down,
    name: '20260926_195338_initial',
  },
  {
    up: migration_20261121_083350_shop.up,
    down: migration_20261121_083350_shop.down,
    name: '20261121_083350_shop',
  },
  {
    up: migration_20261121_171822_media_blur.up,
    down: migration_20261121_171822_media_blur.down,
    name: '20261121_171822_media_blur',
  },
  {
    up: migration_20261121_200809_site_pages.up,
    down: migration_20261121_200809_site_pages.down,
    name: '20261121_200809_site_pages',
  },
  {
    up: migration_20261122_000833_about_byline.up,
    down: migration_20261122_000833_about_byline.down,
    name: '20261122_000833_about_byline'
  },
];
