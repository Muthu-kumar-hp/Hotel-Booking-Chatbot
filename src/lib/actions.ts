'use server';

import type { Message, Hotel } from './types';
import { suggestHotel } from '@/ai/flows/suggest-hotel';
import { hotel_info_data } from './data';

const intents_data: Record<string, { patterns: string[] }> = {
    greeting: { patterns: ["hi", "hello", "hey", "greetings"] },
    find_hotels: { patterns: ["show me hotels in", "find me hotels in", "hotels in", "looking for a hotel in", "want a room in"] },
    booking: { patterns: ["book a room", "make a reservation", "i want to book", "book this hotel"] },
    view_details: { patterns: ["view details for", "details of", "tell me more about", "more details"] },
    suggest_hotel: { patterns: ["suggest a hotel", "what do you recommend", "cheap and best", "recommend a hotel", "best hotels", "luxury hotel", "cheap hotel", "high-rated hotel"] },
};

function findBestIntent(message: string): string {
    const cleanedMessage = message.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    for (const intent in intents_data) {
        if (intents_data[intent].patterns.some(pattern => cleanedMessage.includes(pattern))) {
            return intent;
        }
    }
    return 'fallback';
}

function parseUserQuery(query: string) {
    const lowerCaseQuery = query.toLowerCase();
    const cities = ['salem', 'chennai', 'ooty'];
    let city: string | null = null;
    cities.forEach(c => {
        if(lowerCaseQuery.includes(c)) city = c.charAt(0).toUpperCase() + c.slice(1);
    });

    let price: 'low' | 'high' | null = null;
    if (lowerCaseQuery.includes('cheap') || lowerCaseQuery.includes('budget')) price = 'low';
    if (lowerCaseQuery.includes('luxury') || lowerCaseQuery.includes('expensive')) price = 'high';

    let rating: 'high' | null = null;
    if (lowerCaseQuery.includes('best') || lowerCaseQuery.includes('high rated')) rating = 'high';

    return { city, price, rating };
}


export async function handleUserMessage(
  history: Message[],
  newMessage: Message
): Promise<Omit<Message, 'id' | 'role'>> {
    const intent = findBestIntent(newMessage.content);
    const query = newMessage.content.toLowerCase();

    switch (intent) {
        case 'greeting':
            return { content: 'Hello there! How can I help you with your hotel search today?' };

        case 'find_hotels': {
            const params = parseUserQuery(query);
            let hotels = hotel_info_data;

            if (params.city) {
                hotels = hotels.filter(h => h.city.toLowerCase() === params.city.toLowerCase());
            }
            if (params.price === 'low') hotels.sort((a, b) => a.price - b.price);
            if (params.price === 'high') hotels.sort((a, b) => b.price - a.price);
            if (params.rating === 'high') hotels.sort((a, b) => b.rating - a.rating);

            if (hotels.length > 0) {
                return {
                    content: `Here are some hotels matching your request in ${params.city || 'your chosen area'}:`,
                    hotelData: hotels.slice(0, 3) // Show top 3
                };
            }
            return { content: "Sorry, I couldn't find any hotels matching your criteria." };
        }

        case 'view_details': {
            const hotel = hotel_info_data.find(h => query.includes(h.name.toLowerCase()));
            if (hotel) {
                return {
                    content: `Here are the details for ${hotel.name}:`,
                    hotelData: [hotel],
                    isBookingForm: false, 
                };
            }
            return { content: "I couldn't find that hotel. Please select one from a list." };
        }
        
        case 'booking': {
             const hotel = hotel_info_data.find(h => query.includes(h.name.toLowerCase()));
            if (hotel) {
                return {
                    content: `Great! Let's get you booked for ${hotel.name}. Please fill out the form below.`,
                    hotelData: [hotel],
                    isBookingForm: true,
                };
            }
            return { content: "Which hotel would you like to book? Please tell me the name." };
        }

        case 'suggest_hotel': {
            try {
                const suggestions = await suggestHotel({
                    preferences: newMessage.content,
                    hotelData: JSON.stringify(hotel_info_data),
                });

                if (!suggestions || suggestions.length === 0) {
                    return { content: "I couldn't generate any suggestions at the moment. Try asking in a different way." };
                }

                const suggestionData = suggestions.map(s => {
                    const hotel = hotel_info_data.find(h => h.id === s.hotel_id);
                    return hotel ? { hotel, reason: s.reason } : null;
                }).filter((s): s is { hotel: Hotel, reason: string } => s !== null);

                return {
                    content: 'Here are a few suggestions I think you might like:',
                    hotelData: suggestionData,
                };
            } catch (e) {
                console.error('AI suggestion failed', e);
                return { content: 'Sorry, I am having trouble getting suggestions right now. Please try again later.' };
            }
        }

        default:
            return { content: "I'm sorry, I don't understand that. I can help with finding hotels, checking amenities, or making a reservation. Would you like a **suggestion**?" };
    }
}

export async function confirmBooking(bookingData: Omit<any, 'id' | 'timestamp' | 'bookingId'>) {
    const { getFirestore, collection, addDoc } = await import('firebase/firestore');
    const { app } = await import('./firebase');
    try {
        const db = getFirestore(app);
        const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'default-app-id';
        const bookingsCollectionRef = collection(db, `artifacts/${appId}/public/data/bookings`);

        const bookingId = `BK-${Math.floor(Math.random() * 10000)}`;

        await addDoc(bookingsCollectionRef, {
            ...bookingData,
            bookingId: bookingId,
            timestamp: new Date(),
        });
        
        return { success: true, bookingId: bookingId };
    } catch (error: any) {
        console.error("Error saving booking to Firestore:", error);
        return { success: false, error: error.message };
    }
}
