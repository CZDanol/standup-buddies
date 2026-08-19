// Standup Buddies configuration template.
// Copy this file to config.js (gitignored) and put your real team there;
// the build inlines config.js into dist/index.html.
// Without a config.js, this example is used instead.
//
// Member ids must stay stable forever.
// See types.ts for fields descriptions
window.standupConfig = {
  title: 'Standup Buddies',
  // shuffle: false, // keep the roster order instead of shuffling
  team: [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob', pinned: true },
    { id: 'carol', name: 'Carol' },
    { id: 'dan', name: 'Dan' },
  ],
};
