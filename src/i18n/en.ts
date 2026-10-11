import type { Dictionary } from './ru';

/**
 * English. Same shape as the Russian dictionary — the `Dictionary` type
 * won't let a missing string compile.
 *
 * Tone: short, friendly, sentence case on buttons. The Russian «ты» becomes
 * plain imperatives, not «please».
 */
export const en: Dictionary = {
  common: {
    back: 'Back',
    cancel: 'Cancel',
    delete: 'Delete',
    share: 'Share',
    close: 'Close',
    archive: 'Archive',
    settings: 'Settings',
    toArchive: 'Move to archive',
    done: 'Done',
    unavailable: 'Not available',
    failed: 'Something went wrong',
    goalReached: 'Goal reached',
    of: (target) => `of ${target}`,
    overBy: (extra) => `${extra} over target`,
  },

  home: {
    youAreHere: 'You are here',
    goal: 'Goal',
    heading: 'Small steps add up',
    phrase:
      'Set a goal — a number you work toward bit by bit: reps, pages, kilometers, minutes. ' +
      'Then just add what you’ve done.',
    newGoal: 'New goal',
    note: 'One goal at a time — that’s how you get there.',
  },

  newGoal: {
    title: 'New goal',
    nameLabel: 'Name',
    namePlaceholder: 'e.g. a thousand push-ups',
    targetLabel: 'Target',
    targetPlaceholder: '1000',
    descriptionLabel: 'Description',
    descriptionPlaceholder: '30–50 per set, morning and evening.',
    descriptionHint: (length, max) => `Optional. Shown under the name on the counter. ${length} of ${max}`,
    stepsLabel: 'Quick-add buttons',
    stepA11y: (n) => `Quick-add button ${n}`,
    stepsHint:
      'The numbers on the big buttons at the bottom of the counter. Set them to the amounts you actually do — ' +
      'any other amount can be entered manually.',
    start: 'Start',
    creating: 'Creating…',
  },

  counter: {
    finish: 'Finish',
    dayKicker: (day, since) => `Day ${day} · since ${since}`,
    leftBefore: '',
    leftAfter: ' to go',
    empty: 'Nothing yet. Tap a button below after your first set.',
    byDay: 'By day',
    swipeHint: 'swipe to edit',
    customAmount: 'Custom amount',
    stepA11y: (step) => `Add ${step}`,
    undo: 'Undo',
    edit: 'Edit',
  },

  amount: {
    editTitle: (day) => `Amount on ${day}`,
    addTitle: 'How many to add',
    zeroHint: 'Enter 0 to remove this day.',
    save: 'Save',
    add: 'Add',
  },

  finishGoal: {
    title: 'Finish this goal?',
    body: (progress, target) =>
      `You’re at ${progress} of ${target}. In the archive the goal keeps its history, ` +
      'and you can resume it later. Deleting erases it completely.',
    deleteTitle: 'Delete this goal?',
    deleteBody: (progress, target) => `All history will be lost — ${progress} of ${target}. This can’t be undone.`,
  },

  archive: {
    title: 'Archive',
    developer: 'Developer',
    empty: 'Nothing here yet.',
    emptySub: 'Finished goals will appear here.',
    early: 'early',
  },

  archivedGoal: {
    closedEarly: 'Goal closed early',
    finishedEarly: (target) => `closed early, target was ${target}`,
    resume: 'Resume',
    startOver: 'Start over',
    repeat: 'Do it again',
    activeExistsTitle: 'You already have an active goal',
    activeExistsBody: 'Finish the current one first — only one goal can be active.',
    deleteTitle: 'Delete this goal?',
    deleteBody: 'Its whole history will be deleted too. This can’t be undone.',
  },

  share: {
    closed: 'Goal closed',
    overBySuffix: (extra) => ` · ${extra} over target`,
    targetWasSuffix: (target) => ` · target was ${target}`,
    preparing: 'Preparing…',
    dialogTitle: 'Share your achievement',
    unavailable: 'Sharing images isn’t available on this device.',
    failed: 'Couldn’t create the image.',
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    data: 'Data',
    export: 'Save a backup',
    exporting: 'Saving…',
    restore: 'Restore from backup',
    hint:
      'Your data lives only on this phone. Save a backup to the cloud or send it to yourself — ' +
      'otherwise your history will be lost when you change phones. Restoring replaces everything you have now.',
    exportUnavailable: 'Saving files isn’t available on this device.',
    exportFailed: 'Couldn’t save the backup.',
    exportDialogTitle: 'Save a backup',
    restoreTitle: 'Restore from backup?',
    restoreBody: (goals, entries) =>
      `This backup has ${goals} ${goals === 1 ? 'goal' : 'goals'} and ${entries} ${entries === 1 ? 'entry' : 'entries'}. ` +
      'All current data will be replaced. This can’t be undone.',
    restoreConfirm: 'Restore',
    restored: 'Your data has been restored from the backup.',
    restoreFailed: 'Couldn’t restore the data.',
    wrongFile: 'Wrong file',
  },

  backupErrors: {
    notBackup: 'This isn’t a Pathway backup file.',
    newerVersion: 'This backup is from a newer version of the app. Update Pathway and try again.',
    corrupted: 'The backup file is corrupted.',
    twoActive: 'The backup has more than one active goal — the file is corrupted.',
    unreadable: 'Couldn’t read the backup.',
  },

  developer: {
    title: 'Developer',
    author: 'Sergey Grigoriev',
    hint: 'Found a bug or missing a feature? Write to me — I reply to everyone.',
    testers: 'Beta testers',
    writeTo: (email) => `Email ${email}`,
    mailFailedTitle: 'Couldn’t open mail',
    mailFailedBody: (email) => `Email address copied: ${email}\n\nPaste it into any mail app or messenger.`,
  },

  testers: {
    title: 'Beta testers',
    empty: 'The list is empty for now. The first names will appear when closed testing ends.',
    lead: 'These people tested the app before release.',
    inviteTitle: 'Want to be on this list?',
    inviteText: 'Write to me and I’ll tell you what to test. Your name will appear here in the next update.',
  },

  splash: {
    skip: 'Skip intro',
  },

  dbError: {
    title: 'Couldn’t open the database',
  },
};
