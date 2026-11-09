/**
 * SHUT Load Test - Simulates viewers + DJs against Firebase Emulator
 *
 * Usage:
 *   npm run test:small   → 50 viewers, 2 DJs
 *   npm run test:medium  → 200 viewers, 5 DJs
 *   npm run test:large   → 500 viewers, 10 DJs
 *   npm run test:stress  → 1000 viewers, 20 DJs
 *
 * Prerequisites:
 *   1. Start Firebase Emulator: cd .. && firebase emulators:start
 *   2. npm install (in this directory)
 */

import admin from 'firebase-admin';

// ─── Configuration ──────────────────────────────────────────
const CONFIG = {
  numViewers: parseInt(process.env.VIEWERS ?? '500', 10),
  numDJs: parseInt(process.env.DJS ?? '10', 10),
  testDurationSec: parseInt(process.env.DURATION ?? '120', 10),
  viewerJoinIntervalMs: parseInt(process.env.JOIN_INTERVAL ?? '50', 10),
  likeProbability: 0.3,
  favoriteProbability: 0.1,
  followProbability: 0.15,
};

// ─── Firebase Admin init (Emulator) ─────────────────────────
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const app = admin.initializeApp({
  projectId: 'shut-app-c0067',
});

const firestore = admin.firestore();

// ─── Metrics Collector ──────────────────────────────────────
class Metrics {
  constructor() {
    this.operations = {};
    this.errors = [];
    this.startTime = null;
    this.snapshots = [];
    this.activeListeners = 0;
    this.peakListeners = 0;
    this.snapshotCallbacks = 0;
  }

  start() { this.startTime = Date.now(); }
  elapsed() { return Date.now() - this.startTime; }

  recordOp(name, durationMs, success = true) {
    if (!this.operations[name]) {
      this.operations[name] = {
        count: 0, errors: 0, totalMs: 0, minMs: Infinity, maxMs: 0, p95: [],
      };
    }
    const op = this.operations[name];
    op.count++;
    op.totalMs += durationMs;
    op.minMs = Math.min(op.minMs, durationMs);
    op.maxMs = Math.max(op.maxMs, durationMs);
    op.p95.push(durationMs);
    if (!success) op.errors++;
  }

  recordError(context, error) {
    this.errors.push({ context, message: error.message, time: this.elapsed() });
  }

  recordListenerAdd() {
    this.activeListeners++;
    this.peakListeners = Math.max(this.peakListeners, this.activeListeners);
  }

  recordListenerRemove() {
    this.activeListeners--;
  }

  recordSnapshotCallback() {
    this.snapshotCallbacks++;
  }

  snapshot() {
    this.snapshots.push({
      time: this.elapsed(),
      activeListeners: this.activeListeners,
      snapshotCallbacks: this.snapshotCallbacks,
      ops: Object.fromEntries(
        Object.entries(this.operations).map(([k, v]) => [k, v.count])
      ),
    });
  }

  report() {
    const totalDuration = this.elapsed();
    console.log('\n' + '='.repeat(70));
    console.log('  SHUT LOAD TEST - RAPPORT DE PERFORMANCE');
    console.log('='.repeat(70));
    console.log(`\n  Configuration:`);
    console.log(`    Viewers:           ${CONFIG.numViewers}`);
    console.log(`    DJs:               ${CONFIG.numDJs}`);
    console.log(`    Duree:             ${CONFIG.testDurationSec}s`);
    console.log(`    Duree reelle:      ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`\n  Listeners:`);
    console.log(`    Peak actifs:       ${this.peakListeners}`);
    console.log(`    Callbacks recus:   ${this.snapshotCallbacks}`);

    console.log(`\n  Operations:`);
    console.log('  ' + '-'.repeat(66));
    console.log(`  ${'Operation'.padEnd(30)} ${'Count'.padStart(7)} ${'Avg(ms)'.padStart(8)} ${'P95(ms)'.padStart(8)} ${'Max(ms)'.padStart(8)} ${'Err'.padStart(5)}`);
    console.log('  ' + '-'.repeat(66));

    for (const [name, op] of Object.entries(this.operations)) {
      const avg = (op.totalMs / op.count).toFixed(0);
      const sorted = op.p95.sort((a, b) => a - b);
      const p95Idx = Math.floor(sorted.length * 0.95);
      const p95 = sorted[p95Idx]?.toFixed(0) ?? '-';
      console.log(`  ${name.padEnd(30)} ${String(op.count).padStart(7)} ${avg.padStart(8)} ${p95.padStart(8)} ${op.maxMs.toFixed(0).padStart(8)} ${String(op.errors).padStart(5)}`);
    }

    if (this.errors.length > 0) {
      console.log(`\n  Erreurs (${this.errors.length} total):`);
      const grouped = {};
      for (const e of this.errors) {
        const key = `${e.context}: ${e.message}`;
        grouped[key] = (grouped[key] || 0) + 1;
      }
      for (const [msg, count] of Object.entries(grouped).slice(0, 10)) {
        console.log(`    [x${count}] ${msg}`);
      }
    }

    // Cost estimation
    console.log('\n  ' + '='.repeat(66));
    console.log('  ESTIMATION DES COUTS (production reelle, 2h session)');
    console.log('  ' + '='.repeat(66));

    const firestoreReads = this.operations['viewer:snapshot_callback']?.count ?? 0;
    const firestoreWrites = (this.operations['dj:update_status']?.count ?? 0)
      + (this.operations['viewer:increment_count']?.count ?? 0)
      + (this.operations['viewer:like']?.count ?? 0)
      + (this.operations['viewer:favorite']?.count ?? 0)
      + (this.operations['viewer:follow']?.count ?? 0);

    // Extrapolate to 2h
    const testMin = totalDuration / 60000;
    const scaleFactor = 120 / testMin;

    const estReads = Math.round(firestoreReads * scaleFactor);
    const estWrites = Math.round(firestoreWrites * scaleFactor);

    // Pricing (as of 2024)
    const firestoreReadCost = Math.max(0, (estReads - 50000)) * 0.06 / 100000;
    const firestoreWriteCost = Math.max(0, (estWrites - 20000)) * 0.18 / 100000;

    const muxIngestMin = CONFIG.numDJs * 120;
    const muxDeliveryMin = CONFIG.numViewers * 120;
    const muxIngestCost = muxIngestMin * 0.055;
    const muxDeliveryCost = muxDeliveryMin * 0.001;

    console.log(`\n  Firebase (extrapole a 2h avec ${CONFIG.numViewers} viewers, ${CONFIG.numDJs} DJs):`);
    console.log(`    Firestore reads:   ~${formatNum(estReads)} → $${firestoreReadCost.toFixed(2)}`);
    console.log(`    Firestore writes:  ~${formatNum(estWrites)} → $${firestoreWriteCost.toFixed(2)}`);
    console.log(`    Cloud Functions:   inclus (tier gratuit)`);
    console.log(`    Firebase total:    $${(firestoreReadCost + firestoreWriteCost).toFixed(2)}`);

    console.log(`\n  Mux (streaming reel, 2h):`);
    console.log(`    Ingest:            ${muxIngestMin} min → $${muxIngestCost.toFixed(2)}`);
    console.log(`    Delivery:          ${muxDeliveryMin} min → $${muxDeliveryCost.toFixed(2)}`);
    console.log(`    Mux total:         $${(muxIngestCost + muxDeliveryCost).toFixed(2)}`);

    const grandTotal = firestoreReadCost + firestoreWriteCost + muxIngestCost + muxDeliveryCost;
    console.log(`\n  COUT TOTAL ESTIME:   $${grandTotal.toFixed(2)} USD / session de 2h`);
    console.log('  ' + '='.repeat(66) + '\n');
  }
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

// ─── Test Data Generators ───────────────────────────────────
function generateUser(index, role) {
  return {
    displayName: `${role === 'broadcaster' ? 'DJ' : 'Viewer'}_${index}`,
    artistName: role === 'broadcaster' ? `DJ_Test_${index}` : null,
    email: `${role}_${index}@loadtest.shut`,
    role,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
}

function generateEvent(djIndex, djUserId) {
  return {
    title: `Live Test Set #${djIndex}`,
    djName: `DJ_Test_${djIndex}`,
    userId: djUserId,
    festivalId: null,
    status: 'scheduled',
    playbackUrl: `https://stream.mux.com/test-playback-${djIndex}.m3u8`,
    muxLiveStreamId: `mux-test-stream-${djIndex}`,
    muxStreamKey: `test-key-${djIndex}`,
    muxRtmpUrl: 'rtmp://global-live.mux.com:5222/app',
    viewerCount: 0,
    scheduledStartTime: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// ─── Simulation Workers ─────────────────────────────────────

async function simulateDJ(djIndex, metrics) {
  const t0 = Date.now();
  const userRef = await firestore.collection('users').add(
    generateUser(djIndex, 'broadcaster')
  );
  metrics.recordOp('dj:create_user', Date.now() - t0);

  const t1 = Date.now();
  const eventRef = await firestore.collection('events').add(
    generateEvent(djIndex, userRef.id)
  );
  metrics.recordOp('dj:create_event', Date.now() - t1);

  // Go live after a short delay
  await sleep(1000 + Math.random() * 2000);

  const t2 = Date.now();
  await eventRef.update({
    status: 'live',
    actualStartTime: new Date().toISOString(),
  });
  metrics.recordOp('dj:update_status', Date.now() - t2);

  return { djUserId: userRef.id, eventId: eventRef.id, eventRef };
}

async function simulateViewer(viewerIndex, events, djUserIds, metrics, abortSignal) {
  const t0 = Date.now();
  const userRef = await firestore.collection('users').add(
    generateUser(viewerIndex, 'viewer')
  );
  metrics.recordOp('viewer:create_user', Date.now() - t0);

  // Pick a random event to watch
  const event = events[Math.floor(Math.random() * events.length)];
  const unsubscribers = [];

  // 1. Subscribe to event changes (like real viewer)
  const eventUnsub = firestore.doc(`events/${event.eventId}`).onSnapshot((snap) => {
    metrics.recordSnapshotCallback();
    metrics.recordOp('viewer:snapshot_callback', 0);
  });
  unsubscribers.push(eventUnsub);
  metrics.recordListenerAdd();

  // 2. Increment viewer count
  const t1 = Date.now();
  try {
    await firestore.doc(`events/${event.eventId}`).update({
      viewerCount: admin.firestore.FieldValue.increment(1),
    });
    metrics.recordOp('viewer:increment_count', Date.now() - t1);
  } catch (err) {
    metrics.recordOp('viewer:increment_count', Date.now() - t1, false);
    metrics.recordError('viewer:increment_count', err);
  }

  // Track what this viewer already did (avoid duplicates like real app)
  let hasLiked = false;
  let hasFavorited = false;
  let hasFollowed = false;

  // 3. Periodic actions (likes, favorites, follows)
  const actionInterval = setInterval(async () => {
    if (abortSignal.aborted) return;

    // Like (once per viewer per event, like the real app)
    if (!hasLiked && Math.random() < CONFIG.likeProbability * 0.05) {
      hasLiked = true;
      const t = Date.now();
      try {
        await firestore.collection('userLikes').add({
          userId: userRef.id,
          eventId: event.eventId,
          createdAt: new Date().toISOString(),
        });
        metrics.recordOp('viewer:like', Date.now() - t);
      } catch (err) {
        metrics.recordOp('viewer:like', Date.now() - t, false);
        metrics.recordError('viewer:like', err);
      }
    }

    // Favorite (once per viewer per event)
    if (!hasFavorited && Math.random() < CONFIG.favoriteProbability * 0.05) {
      hasFavorited = true;
      const t = Date.now();
      try {
        await firestore.collection('userFavorites').add({
          userId: userRef.id,
          eventId: event.eventId,
          createdAt: new Date().toISOString(),
        });
        metrics.recordOp('viewer:favorite', Date.now() - t);
      } catch (err) {
        metrics.recordOp('viewer:favorite', Date.now() - t, false);
        metrics.recordError('viewer:favorite', err);
      }
    }

    // Follow the DJ (once per viewer per DJ)
    if (!hasFollowed && Math.random() < CONFIG.followProbability * 0.05) {
      hasFollowed = true;
      const t = Date.now();
      try {
        await firestore.collection('userFollows').add({
          followerId: userRef.id,
          followeeId: event.djUserId,
          followedAt: admin.firestore.FieldValue.serverTimestamp(),
          notificationsEnabled: true,
        });
        metrics.recordOp('viewer:follow', Date.now() - t);
      } catch (err) {
        metrics.recordOp('viewer:follow', Date.now() - t, false);
        metrics.recordError('viewer:follow', err);
      }
    }
  }, 1000);

  return {
    cleanup: () => {
      clearInterval(actionInterval);
      for (const unsub of unsubscribers) {
        if (typeof unsub === 'function') unsub();
      }
      metrics.recordListenerRemove();
    },
  };
}

// ─── Main Test Runner ───────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  const metrics = new Metrics();
  const abortController = new AbortController();

  console.log('\n  SHUT Load Test');
  console.log('  ' + '-'.repeat(40));
  console.log(`  Viewers: ${CONFIG.numViewers} | DJs: ${CONFIG.numDJs} | Duree: ${CONFIG.testDurationSec}s`);
  console.log('  ' + '-'.repeat(40));

  // Verify emulator is running
  console.log('\n  [1/4] Verification de l\'emulateur Firestore...');
  try {
    await firestore.collection('_health').doc('check').set({ ok: true });
    await firestore.collection('_health').doc('check').delete();
    console.log('        Firestore OK');
  } catch (err) {
    console.error('\n  ERREUR: L\'emulateur Firebase n\'est pas demarre!');
    console.error('  Lance: cd .. && firebase emulators:start --only firestore,auth');
    process.exit(1);
  }

  metrics.start();

  // Phase 1: Create DJs and events
  console.log(`\n  [2/4] Creation de ${CONFIG.numDJs} DJs et events...`);
  const events = [];
  for (let i = 0; i < CONFIG.numDJs; i++) {
    const result = await simulateDJ(i, metrics);
    events.push(result);
    process.stdout.write(`\r        DJ ${i + 1}/${CONFIG.numDJs} cree`);
  }
  console.log(' ✓');

  // Collect DJ user IDs for follow simulation
  const djUserIds = events.map(e => e.djUserId);

  // Phase 2: Viewers join progressively
  console.log(`\n  [3/4] Connexion de ${CONFIG.numViewers} viewers (progressif)...`);
  const viewers = [];
  const batchSize = 10;
  for (let i = 0; i < CONFIG.numViewers; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, CONFIG.numViewers); j++) {
      batch.push(simulateViewer(j, events, djUserIds, metrics, abortController.signal));
    }
    const results = await Promise.all(batch);
    viewers.push(...results);
    process.stdout.write(`\r        ${Math.min(i + batchSize, CONFIG.numViewers)}/${CONFIG.numViewers} viewers connectes`);
    await sleep(CONFIG.viewerJoinIntervalMs);
  }
  console.log(' ✓');

  // Phase 3: Let the test run
  console.log(`\n  [4/4] Test en cours (${CONFIG.testDurationSec}s)...`);
  const snapshotInterval = setInterval(() => metrics.snapshot(), 5000);

  const testStart = Date.now();
  while (Date.now() - testStart < CONFIG.testDurationSec * 1000) {
    const remaining = Math.ceil((CONFIG.testDurationSec * 1000 - (Date.now() - testStart)) / 1000);
    process.stdout.write(`\r        ${remaining}s restantes | ${metrics.activeListeners} listeners | ${metrics.snapshotCallbacks} callbacks`);
    await sleep(1000);
  }
  console.log('\n        Test termine ✓');

  // Cleanup
  console.log('\n  Nettoyage...');
  abortController.abort();
  clearInterval(snapshotInterval);

  for (const v of viewers) {
    v.cleanup();
  }

  // End all events
  for (const e of events) {
    await e.eventRef.update({
      status: 'ended',
      actualEndTime: new Date().toISOString(),
    });
  }
  console.log('  Nettoyage termine ✓');

  // Final report
  metrics.report();

  // Cleanup emulator data
  try {
    await fetch('http://localhost:8080/emulator/v1/projects/shut-app-c0067/databases/(default)/documents', {
      method: 'DELETE',
    });
    console.log('  Donnees emulateur nettoyees ✓\n');
  } catch {
    console.log('  (nettoyage emulateur optionnel)\n');
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
