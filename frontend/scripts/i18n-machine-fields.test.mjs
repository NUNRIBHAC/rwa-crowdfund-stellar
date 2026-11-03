import { test } from 'vitest';
import assert from 'node:assert/strict';
import { isMachineField } from './i18n-machine-fields.mjs';
test('machine field classifier protects routing, enums and identifiers, not visible country labels or locale composition', () => {
  for (const path of [
    'instruments.classes[0].id',
    'instruments.classes[0].group',
    'faq.categories[0].entries[0].state',
    'profiles.list[0].campaignId',
    'profiles.list[0].country',
    'profiles.list[0].instrumentClass',
    'profiles.list[0].instrumentOverlays[0]',
    'instruments.classes[0].seniorityStates[0]',
  ])
    assert.equal(isMachineField(path), true, path);
  for (const path of [
    'community.company.fields.country',
    'community.applicationFields.country',
    'instruments.chipCompose',
    'instruments.seniorityLabels.senior',
    'instruments.classes[0].label',
  ])
    assert.equal(isMachineField(path), false, path);
});
