const firebaseService = require('./src/services/firebaseService');

async function check() {
    const db = firebaseService.getDb();
    if (!db) {
        console.log("DB not initialized");
        process.exit(1);
    }

    const eventId = "KnwWNqMoBdVq1d6B4ZRLKu8Acgf2";
    const guestId = "3WTY3jX3hdGToJMFBB7h";

    console.log(`Checking Event: ${eventId}`);
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (eventDoc.exists) {
        console.log("Event Doc Data:", eventDoc.data());
    } else {
        console.log("Event Doc does NOT exist at /events/" + eventId);

        // Maybe it's /users/id/events/id?
        // Let's list some collections
        const collections = await db.listCollections();
        console.log("Root collections:", collections.map(c => c.id));
    }

    console.log(`Checking Guest: ${guestId} in /events/${eventId}/currentUserEvents/`);
    const guestDoc = await db.collection('events').doc(eventId).collection('currentUserEvents').doc(guestId).get();
    if (guestDoc.exists) {
        console.log("Guest Doc Data:", guestDoc.data());
    } else {
        console.log("Guest Doc does NOT exist");
    }
}

check().catch(console.error);
