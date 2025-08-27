

'use server';

import type { Message, Hotel } from './types';
import { suggestHotel } from '@/ai/flows/suggest-hotel';
import { answerHotelQuestion } from '@/ai/flows/answer-hotel-question';
import { suggestUpsell } from '@/ai/flows/suggest-upsell';
import { suggestAttractions } from '@/ai/flows/suggest-attractions';
import { hotel_info_data } from './data';

const intents_data: Record<string, { patterns: string[] }> = {
    greeting: { patterns: ["hi", "hello", "hey", "greetings"] },
    find_hotels: { patterns: ["show me hotels in", "find me hotels in", "hotels in", "looking for a hotel in", "want a room in", "cheap hotel", "luxury hotel", "high-rated hotel"] },
    view_details: { patterns: ["view details for", "details of", "tell me more about", "more details"] },
    suggest_hotel: { patterns: ["suggest a hotel", "what do you recommend", "cheap and best", "recommend a hotel", "best hotels", "suggestion", "give me a suggestion"] },
    book_hotel: { patterns: ["book a room", "book the hotel", "i want to book", "booking", "proceed to book"] },
    booking_procedure: { patterns: ["how to book", "booking procedure", "what is the booking process", "how do i book a hotel", "procedure"] },
    ask_question: { patterns: ["what is", "what are", "do you have", "can you tell me", "is there a", "how much"] },
    submit_feedback: { patterns: ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"] },
    cancel_booking: { patterns: ["cancel booking", "cancel my booking"] },
    book_taxi: { patterns: ["book a taxi", "taxi service", "airport transfer"] },
    book_sightseeing: { patterns: ["explore sightseeing", "sightseeing tours", "tourist spots"] },
    book_restaurant: { patterns: ["reserve a table", "restaurant booking", "book a restaurant"] },
    loyalty_program: { patterns: ["loyalty program", "rewards", "points", "membership benefits"] },
    nearby_attractions: { patterns: ["what's nearby", "nearby attractions", "tourist spots near", "restaurants near", "shopping near"] },
};

function findBestIntent(message: string): string {
    const cleanedMessage = message.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    for (const intent in intents_data) {
        if (intents_data[intent].patterns.some(pattern => cleanedMessage.includes(pattern))) {
            return intent;
        }
    }
    const cities = ['salem', 'chennai', 'ooty'];
     if (cities.some(city => cleanedMessage.includes(city)) || cleanedMessage.includes('hotel')) {
        return 'find_hotels';
    }
    return 'fallback';
}

export async function handleUserMessage(
  history: Message[],
  newMessage: Message
): Promise<Omit<Message, 'id' | 'role'>> {
    const intent = findBestIntent(newMessage.content);
    const query = newMessage.content.toLowerCase();

    // Handle form submission
    if (newMessage.isBookingForm && newMessage.bookingDetails) {
        const { hotel, guests, checkIn, checkOut, roomType, bedSize, smoking } = newMessage.bookingDetails;
        const hotelName = 'hotel' in hotel ? hotel.hotel.name : hotel.name;
        const bookingId = `MK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        return {
            content: `Thank you! Your booking for **${hotelName}** is confirmed.
            \n\n**Booking ID:** ${bookingId}
            \n**Guests:** ${guests}
            \n**Check-in:** ${new Date(checkIn).toLocaleDateString()}
            \n**Check-out:** ${new Date(checkOut).toLocaleDateString()}
            \n\n**Preferences:**
            \n- Room Type: ${roomType}
            \n- Bed Size: ${bedSize}
            \n- Smoking: ${smoking ? 'Yes' : 'No'}
            \n\nA confirmation email has been sent. You can cancel or download your booking using the buttons in the header.
            \n\nWhile you're here, would you like help with any travel add-ons? I can also help you rate your experience.`,
            bookingDetails: { ...newMessage.bookingDetails, bookingId },
            quickReplies: ['Book a Taxi', 'Explore Sightseeing', 'Reserve a Table', 'Rate my experience'],
        };
    }

    switch (intent) {
        case 'greeting':
            return { content: 'Hello there! How can I help you with your hotel search today?' };
        
        case 'cancel_booking': {
            const bookingIdMatch = newMessage.content.match(/MK-\w+/i);
            const bookingIdToCancel = bookingIdMatch ? bookingIdMatch[0].toUpperCase() : null;
        
            if (bookingIdToCancel) {
                const bookingMessage = history.find(m => m.bookingDetails?.bookingId === bookingIdToCancel);
                 if (bookingMessage) {
                     return {
                        content: `Your booking with ID **${bookingIdToCancel}** has been successfully cancelled.`
                    };
                 }
            }
            
            const lastBookingMessage = [...history, newMessage].reverse().find(m => m.bookingDetails?.bookingId);
            if (lastBookingMessage && lastBookingMessage.bookingDetails) {
                const { hotel, bookingId } = lastBookingMessage.bookingDetails;
                const hotelName = 'hotel' in hotel ? hotel.hotel.name : hotel.name;
                return {
                    content: `Your booking for **${hotelName}** (ID: ${bookingId}) has been cancelled.`
                }
            }
        
            return { 
                content: 'Sorry, I couldn\'t find a booking to cancel.',
            };
        }

        case 'find_hotels':
        case 'suggest_hotel': {
            try {
                const suggestions = await suggestHotel({
                    preferences: newMessage.content,
                    hotelData: JSON.stringify(hotel_info_data),
                });

                if (!suggestions || suggestions.length === 0) {
                    return { content: "I couldn't find any hotels matching your criteria. I can only search in Salem, Chennai, or Ooty. Please try a different search." };
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
                 try {
                    const upsell = await suggestUpsell({
                        hotel: hotel,
                        currentChoice: 'a standard room' // This could be dynamic in a more complex scenario
                    });

                    return {
                        content: `${upsell.suggestion}\n\nPlease fill out the form below to book your stay at **${hotel.name}**.`,
                        isBookingForm: true,
                        hotelData: [hotel] // Pass hotel data for context
                    }

                 } catch (e) {
                    console.error('Upsell flow failed', e);
                     // If upsell fails, just proceed to booking
                    return {
                        content: `Please fill out the form below to book your stay at **${hotel.name}**.`,
                        isBookingForm: true,
                        hotelData: [hotel]
                    };
                 }
            }

            return { content: "Please specify which hotel you'd like to book." };
        }

        case 'booking_procedure':
            let hotelName = query.replace('how to book','').replace('the','').trim();
            if (query.includes('proceed to book')) {
                hotelName = query.replace('yes, proceed to book','').trim();
            }
            const hotel = hotel_info_data.find(h => h.name.toLowerCase() === hotelName);

            if(hotel) {
                try {
                    const upsell = await suggestUpsell({
                        hotel: hotel,
                        currentChoice: 'a standard room'
                    });
                    return {
                        content: `${upsell.suggestion}\n\nPlease fill out the form below to book your stay at **${hotel.name}**.`,
                        isBookingForm: true,
                        hotelData: [hotel]
                    }
                 } catch (e) {
                    console.error('Upsell flow failed', e);
                    return {
                        content: `Please fill out the form below to book your stay at **${hotel.name}**.`,
                        isBookingForm: true,
                        hotelData: [hotel]
                    };
                 }
            }

            let procedureText = `Of course! Here is the booking procedure:
1.  **Find a hotel:** You can ask me to find hotels in a specific city (Salem, Chennai, or Ooty) or ask for a suggestion.
2.  **View Details:** Click the "View Details" button on any hotel card to see more information about it.
3.  **Book Now:** On the details page, click the "Book Now" button.
4.  **Fill the Form:** I will show you a booking form. Please fill in your details.
5.  **Confirm:** Once you submit the form, your booking will be confirmed!`;
            
            let quickReplies = ['Find hotels in Chennai', 'Suggest a hotel'];

            return {
                content: procedureText,
                quickReplies: quickReplies
            };
        
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
        
        case 'submit_feedback':
        case 'rate_experience':
             return {
                content: "How would you rate your experience?",
                quickReplies: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
            };

        case 'book_taxi':
            return {
                content: "Your taxi has been booked! The driver will meet you at the hotel lobby at your requested time. You will receive a confirmation SMS shortly. \n\nWould you like to explore sightseeing or book a restaurant?",
                quickReplies: ['Explore Sightseeing', 'Reserve a Table']
            };

        case 'book_sightseeing':
            return {
                content: "Great! We have a partnership with local tour guides. A representative will contact you shortly to arrange a personalized sightseeing tour. \n\nWould you like to book a taxi or reserve a table?",
                 quickReplies: ['Book a Taxi', 'Reserve a Table']
            };

        case 'book_restaurant':
            return {
                content: "Excellent choice! Your table has been reserved. You will receive a confirmation from the restaurant soon. \n\nCan I help with a taxi or sightseeing?",
                quickReplies: ['Book a Taxi', 'Explore Sightseeing']
            };

        case 'loyalty_program':
            return {
                content: `Our loyalty program, **MK Hotel Rewards**, offers exclusive benefits!
\n\n- **Earn Points:** Earn points on every booking.
\n- **Exclusive Discounts:** Get member-only rates.
\n- **Free Upgrades:** Enjoy complimentary room upgrades (subject to availability).
\n- **Late Check-out:** Get more flexibility with late check-out.
\n\nWhat would you like to do next?`,
                quickReplies: ['Find hotels in Salem', 'Suggest a hotel'],
            };
        
        case 'nearby_attractions': {
            const hotelNameMatch = query.match(/nearby (.*)/) || query.match(/near (.*)/);
            let hotelName = hotelNameMatch ? hotelNameMatch[1].replace('?','').trim() : '';

            let hotel: Hotel | undefined;

            if (hotelName) {
                hotel = hotel_info_data.find(h => h.name.toLowerCase() === hotelName);
            } else {
                 const lastMessage = history[history.length - 1];
                 if (lastMessage?.hotelData && lastMessage.hotelData.length === 1) {
                    const hotelData = lastMessage.hotelData[0];
                    hotel = 'hotel' in hotelData ? hotelData.hotel : hotelData;
                }
            }

            if (!hotel) {
                return { content: "I'm not sure which hotel you're asking about. Please view the details of a hotel first." };
            }

            try {
                const result = await suggestAttractions({
                    hotelName: hotel.name,
                    city: hotel.city,
                });
                
                const attractionsText = result.attractions.map(attr => 
                    `**${attr.name} (${attr.type.replace('_', ' ')})**\n${attr.description}`
                ).join('\n\n');

                return { 
                    content: `Here are some popular spots near **${hotel.name}**:\n\n${attractionsText}`
                };

            } catch (e) {
                console.error('Attraction suggestion failed', e);
                return { content: 'Sorry, I am having trouble finding nearby attractions right now.' };
            }
        }

        default:
             if (query.includes('rate my experience')) {
                return {
                    content: "Of course, how would you rate your experience?",
                    quickReplies: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'],
                };
            }
            if (['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'].includes(newMessage.content)) {
                return {
                    content: "Thanks for your feedback! I'm glad I could help. Is there anything else you need?"
                };
            }
            return { content: "I'm sorry, I can't help with that. I can help find, book, or suggest hotels in Salem, Chennai, and Ooty. How can I help?" };
    }
}
