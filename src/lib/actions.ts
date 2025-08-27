'use server';

import type { Message, Hotel } from './types';
import { suggestHotel } from '@/ai/flows/suggest-hotel';
import { answerHotelQuestion } from '@/ai/flows/answer-hotel-question';
import { hotel_info_data } from './data';

const intents_data: Record<string, { patterns: string[] }> = {
    greeting: { patterns: ["hi", "hello", "hey", "greetings"] },
    find_hotels: { patterns: ["show me hotels in", "find me hotels in", "hotels in", "looking for a hotel in", "want a room in", "salem", "chennai", "ooty"] },
    view_details: { patterns: ["view details for", "details of", "tell me more about", "more details"] },
    suggest_hotel: { patterns: ["suggest a hotel", "what do you recommend", "cheap and best", "recommend a hotel", "best hotels", "luxury hotel", "cheap hotel", "high-rated hotel", "suggestion"] },
    book_hotel: { patterns: ["book a room", "book the hotel", "i want to book", "booking"] },
    ask_question: { patterns: ["what is", "what are", "do you have", "can you tell me", "is there a", "how much"] }
};

function findBestIntent(message: string): string {
    const cleanedMessage = message.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    for (const intent in intents_data) {
        if (intents_data[intent].patterns.some(pattern => cleanedMessage.includes(pattern))) {
            return intent;
        }
    }
    const cities = ['salem', 'chennai', 'ooty'];
     if (cities.some(city => cleanedMessage.includes(city))) {
        return 'find_hotels';
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

    // Handle form submission
    if (newMessage.isBookingForm) {
        return {
            content: `Thank you! Your booking has been confirmed. A confirmation email has been sent to you.`,
        };
    }

    switch (intent) {
        case 'greeting':
            return { content: 'Hello there! How can I help you with your hotel search today?' };

        case 'find_hotels': {
            const params = parseUserQuery(query);
            let hotels = hotel_info_data;
            let content = "I couldn't find any hotels matching your criteria.";

            if (params.city) {
                hotels = hotels.filter(h => h.city.toLowerCase() === params.city.toLowerCase());
                content = `Here are some hotels in ${params.city}:`
            }
            if (params.price === 'low') hotels.sort((a, b) => a.price - b.price);
            if (params.price === 'high') hotels.sort((a, b) => b.price - a.price);
            if (params.rating === 'high') hotels.sort((a, b) => b.rating - a.rating);

            if (hotels.length > 0) {
                return {
                    content: content,
                    hotelData: hotels.slice(0, 3) // Show top 3
                };
            }
            return { content: content };
        }

        case 'view_details': {
            const hotel = hotel_info_data.find(h => query.includes(h.name.toLowerCase()));
            if (hotel) {
                return {
                    content: `Here are the details for ${hotel.name}:`,
                    hotelData: [hotel],
                };
            }
            return { content: "I couldn't find that hotel. Please select one from a list." };
        }

        case 'book_hotel': {
             const hotel = hotel_info_data.find(h => query.includes(h.name.toLowerCase()));
             if (hotel) {
                return {
                    content: `Please fill out the form below to book your stay at **${hotel.name}**.`,
                    isBookingForm: true,
                    hotelData: [hotel]
                };
            }
            return { content: "Please specify which hotel you'd like to book." };
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

                if (suggestionData.length === 0) {
                    return { content: "I couldn't find any hotels matching your preferences in my data. Perhaps try a different preference?" };
                }
                
                return {
                    content: 'Here are a few suggestions I think you might like:',
                    hotelData: suggestionData,
                };
            } catch (e) {
                console.error('AI suggestion failed', e);
                return { content: 'Sorry, I am having trouble getting suggestions right now. Please try again later.' };
            }
        }
        
        case 'ask_question': {
            const lastMessage = history[history.length - 1];
            if (lastMessage?.hotelData && lastMessage.hotelData.length === 1) {
                const hotelData = lastMessage.hotelData[0];
                const hotel = 'hotel' in hotelData ? hotelData.hotel : hotelData;

                try {
                    const answer = await answerHotelQuestion({
                        question: newMessage.content,
                        hotelData: JSON.stringify(hotel)
                    });
                    return { content: answer };
                } catch(e) {
                     console.error('AI question answering failed', e);
                     return { content: 'Sorry, I am having trouble answering that question right now.' };
                }
            }
            return { content: "I'm not sure which hotel you're asking about. Please view the details of a hotel first." };
        }


        default:
            return { content: "I'm sorry, I can't help with that. I can help find, book, or suggest hotels in Salem, Chennai, and Ooty. How can I help?" };
    }
}
