/**
 * Release screenshot manifest.
 *
 * The filenames are `<set>-<key>.png`. The README screenshots section must
 * follow this order exactly; tests/tooling/screenshots.test.ts enforces it.
 */
export const SET = 'v1.1.0';

const empty = 'empty';
const fixture = 'fixture';

export const SCREENS = [
  {
    key: '01-a-home-empty',
    phase: empty,
    run: async h => {
      await h.reload();
      await h.waitHomeEmpty();
    },
  },
  {
    key: '01-b-home',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.waitHomeData();
    },
  },
  {
    key: '02-hamburger',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openDrawer();
    },
  },
  {
    key: '03-create-list',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.addList();
      await h.page.getByLabel('Name', { exact: true }).fill('Trip budget');
      await h.page.getByText('Numeric', { exact: true }).last().click();
      await h.page.waitForTimeout(400);
      await h.page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
      await h.scrollToTop();
    },
  },
  {
    key: '04-a-list-detail',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openList('Groceries');
      await h.page.getByLabel('Sourdough bread', { exact: true }).first().waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '04-b-numeric-list',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openList('Budget');
      await h.page.getByLabel(/^Value progress:/).first().waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '05-edit-list',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openList('Groceries');
      await h.page.getByLabel('Edit list', { exact: true }).click();
      await h.page.getByLabel('Name', { exact: true }).waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '06-a-add-item-expanded',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openList('Groceries');
      await h.page.getByLabel('Add an item...', { exact: true }).fill('Olive oil');
      await h.page.getByLabel('Toggle details', { exact: true }).click();
      await h.page.getByLabel('Note', { exact: true }).fill('Extra virgin, 500 ml');
      await h.page.waitForTimeout(300);
      await h.page.evaluate(() => {
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      });
      await h.scrollToTop();
    },
  },
  {
    key: '06-b-item-edit',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openList('Books to read');
      await h.page.getByLabel('Edit item', { exact: true }).first().click();
      await h.page.getByLabel('Name', { exact: true }).waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '07-a-lists',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.drawer('Lists');
      await h.page.getByLabel(/^Groceries/).first().waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '07-b-collections',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.drawer('Collections');
      await h.page.getByLabel(/^Home/).first().waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '07-c-collection-detail',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.drawer('Collections');
      await h.page.getByLabel(/^Home/).first().click();
      await h.page.getByLabel(/^Groceries/).first().waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '08-a-lock-list',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openList('Someday');
      await h.openLockModal('listly');
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '08-b-locked-list',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openList('Someday');
      if ((await h.page.getByLabel('Unlock', { exact: true }).count()) === 0) {
        await h.openLockModal('listly');
        await h.page.getByLabel('Lock', { exact: true }).click();
      }
      await h.page.getByText('Locked list', { exact: true }).first().waitFor({ timeout: 30000 });
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '09-select-mode',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.openList('Groceries');
      await h.page.getByLabel('Enter select mode', { exact: true }).filter({ visible: true }).first().click();
      await h.page.getByLabel('Sourdough bread', { exact: true }).first().click();
      await h.page.getByLabel('Eggs', { exact: true }).first().click();
      await h.page.getByText('2 selected', { exact: true }).first().waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '10-a-settings',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.drawer('Settings');
      await h.page.getByLabel('Appearance', { exact: true }).waitFor();
      await h.page.waitForTimeout(300);
    },
  },
  {
    key: '10-b-appearance',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.settings('Appearance');
    },
  },
  {
    key: '10-c-regional',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.settings('Regional');
    },
  },
  {
    key: '10-d-language',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.settings('Regional');
      await h.page.getByLabel('Language', { exact: true }).click();
      await h.page.getByText('Select language', { exact: true }).first().waitFor();
      await h.page.waitForTimeout(400);
    },
  },
  {
    key: '10-e-personalization',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.settings('Personalization');
    },
  },
  {
    key: '10-f-data',
    phase: fixture,
    run: async h => {
      await h.reload();
      await h.settings('Data');
    },
  },
];
