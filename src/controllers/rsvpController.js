const firebaseService = require('../services/firebaseService');

const getRSVPData = async (req, res) => {
    try {
        const { userId, eventId, guestId } = req.params;
        const db = firebaseService.getDb();

        if (!db) {
            return res.status(500).json({ status: 'error', message: 'Database not initialized' });
        }

        // 1. Fetch Event Details from nested path
        // Path: /events/:userId/currentUserEvents/:eventId
        const eventDoc = await db.collection('events')
            .doc(userId)
            .collection('currentUserEvents')
            .doc(eventId)
            .get();

        if (!eventDoc.exists) {
            return res.status(404).json({ status: 'error', message: 'Event not found' });
        }
        const eventData = eventDoc.data();

        // 2. Fetch Guest Details from subcollection
        // Path: /events/:userId/currentUserEvents/:eventId/Guests/:guestId
        const guestDoc = await db.collection('events')
            .doc(userId)
            .collection('currentUserEvents')
            .doc(eventId)
            .collection('Guests')
            .doc(guestId)
            .get();

        const guestData = guestDoc.exists ? guestDoc.data() : {};

        return res.status(200).json({
            status: 'success',
            data: {
                event: {
                    id: eventId,
                    title: eventData.eventName || eventData.title || 'Event',
                    image: eventData.eventImage || eventData.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1000',
                    date: eventData.eventStartDate || eventData.date || 'TBD',
                    location: eventData.eventLocation || eventData.location || 'TBD'
                },
                guest: {
                    id: guestId,
                    name: guestData.name || '',
                    email: guestData.email || '',
                    phone: guestData.phone || '',
                    attending: guestData.attending || null,
                    plusOne: guestData.plusOne || false,
                    extraGuestName: guestData.extraGuestName || '',
                    dietaryRestrictions: guestData.dietaryRestrictions || [],
                    message: guestData.message || ''
                }
            }
        });

    } catch (error) {
        console.error('Error fetching RSVP data:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const updateRSVP = async (req, res) => {
    try {
        const { userId, eventId, guestId } = req.params;
        const updateData = req.body;
        const db = firebaseService.getDb();

        if (!db) {
            return res.status(500).json({ status: 'error', message: 'Database not initialized' });
        }

        // Determine status based on attending choice
        // User wants: "approves if going and decline if pending"
        // We mapper 'going' -> 'approved' and others/not-going -> 'declined'
        let status = 'pending';
        if (updateData.attending === 'going') {
            status = 'approved';
        } else if (updateData.attending === 'not-going') {
            status = 'declined';
        } else {
            // If they haven't made a choice but submitted, and it was pending, 
            // the user said "decline if pending". 
            status = 'declined';
        }

        // Exact Path from Screenshot: /events/{userId}/currentUserEvents/{eventId}/Guests/{guestId}
        await db.collection('events')
            .doc(userId)
            .collection('currentUserEvents')
            .doc(eventId)
            .collection('Guests')
            .doc(guestId)
            .set({
                attending: updateData.attending || null,
                status: status,
                plusOne: updateData.plusOne || false,
                extraGuestName: updateData.extraGuestName || '',
                dietaryRestrictions: updateData.dietaryRestrictions || [],
                message: updateData.message || '',
                email: updateData.email || '',
                phone: updateData.phone || '',
                dietaryNotes: updateData.dietaryNotes || '', // Maintain compatibility with screenshot
                partnerName: updateData.partnerName || '',   // Maintain compatibility with screenshot
                updatedAt: new Date()
            }, { merge: true });

        return res.status(200).json({
            status: 'success',
            message: 'RSVP updated successfully'
        });

    } catch (error) {
        console.error('Error updating RSVP:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    getRSVPData,
    updateRSVP
};
