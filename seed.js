const firebaseService = require('./src/services/firebaseService');

async function seed() {
    const db = firebaseService.getDb();
    if (!db) {
        console.error('Firebase not initialized');
        process.exit(1);
    }

    const eventId = 'wedding-2026';
    const guestId = 'guest-789';

    // Seed Event
    await db.collection('events').doc(eventId).set({
        title: 'Haroon & Sarah\'s Wedding',
        image: 'https://images.unsplash.com/photo-1519225495045-3b82962300b9?auto=format&fit=crop&q=80&w=1000',
        date: 'August 24',
        time: '7:00 PM',
        location: 'Royal Palm Hall, Lahore'
    });

    // Seed Guest
    await db.collection('guests').doc(guestId).set({
        eventId: eventId, // Link guest to event
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+92 300 1234567',
        attending: null,
        dietaryRestrictions: ['Nut Free'],
        plusOne: false,
        extraGuestName: '',
        message: ''
    });

    console.log('Seeding complete!');
    console.log(`Test URL: http://localhost:5173/rsvp/${eventId}/${guestId}`);
    process.exit(0);
}

seed();
