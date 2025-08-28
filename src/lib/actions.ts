

'use server';

import type { Message, Hotel } from './types';
import { suggestHotel } from '@/ai/flows/suggest-hotel';
import { answerHotelQuestion } from '@/ai/flows/answer-hotel-question';
import { suggestUpsell } from '@/ai/flows/suggest-upsell';
import { suggestAttractions } from '@/ai/flows/suggest-attractions';
import { getWeatherForecast } from '@/ai/flows/get-weather-forecast';
import { hotel_info_data } from './data';

const intents_data: Record<string, { patterns: string[], exact?: boolean }> = {
    greeting: { patterns: ["hi", "hello", "hey", "greetings"] },
    find_hotels: { patterns: ["show me hotels in", "find me hotels in", "hotels in", "looking for a hotel in", "want a room in", "cheap hotel", "luxury hotel", "high-rated hotel"] },
    view_details: { patterns: ["tell me more about", "more details on"] },
    suggest_hotel: { patterns: ["suggest a hotel", "what do you recommend", "cheap and best", "recommend a hotel", "best hotels", "suggestion", "give me a suggestion"], exact: true },
    book_hotel: { patterns: ["book a room", "book the hotel", "i want to book", "booking", "proceed to book", "book"] },
    booking_procedure: { patterns: ["how to book", "booking procedure", "what is the booking process", "how do i book a hotel", "procedure"] },
    ask_question: { patterns: ["what is", "what are", "do you have", "can you tell me", "is there a", "how much"] },
    rate_experience: { patterns: ["rate my experience", "rate your experience", "submit feedback"] },
    submit_feedback: { patterns: ["⭐"] },
    cancel_booking: { patterns: ["cancel booking", "cancel my booking"] },
    book_taxi: { patterns: ["book a taxi", "taxi service", "airport transfer"] },
    book_sightseeing: { patterns: ["explore sightseeing", "sightseeing tours", "tourist spots"] },
    book_restaurant: { patterns: ["reserve a table", "restaurant booking", "book a restaurant"] },
    loyalty_program: { patterns: ["loyalty program", "rewards", "points", "membership benefits"], exact: true },
    nearby_attractions: { patterns: ["what's nearby", "nearby attractions", "tourist spots near", "restaurants near", "shopping near"] },
    get_weather: { patterns: ["what's the weather", "weather forecast", "how is the weather"] },
};

function findBestIntent(message: string): string {
    const cleanedMessage = message.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    
    // Check for exact matches first
    for (const intent in intents_data) {
        if (intents_data[intent].exact && intents_data[intent].patterns.some(p => cleanedMessage === p)) {
            return intent;
        }
    }

    // Check for partial matches
    for (const intent in intents_data) {
        if (!intents_data[intent].exact && intents_data[intent].patterns.some(p => cleanedMessage.includes(p))) {
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
            bookingDetails: { ...newMessage.bookingDetails, bookingId, bookingStatus: 'active' },
            quickReplies: ['Book a Taxi', 'Explore Sightseeing', 'Reserve a Table', 'Rate my experience'],
        };
    }

    switch (intent) {
        case 'greeting':
            return { content: 'Hello there! How can I help you with your hotel search today?' };
        
        case 'cancel_booking': {
            const bookingIdMatch = newMessage.content.match(/MK-\w+/i);
            const bookingIdToCancel = bookingIdMatch ? bookingIdMatch[0].toUpperCase() : null;
            let bookingMessageToUpdate: Message | undefined;

            if (bookingIdToCancel) {
                 bookingMessageToUpdate = history.find(m => m.bookingDetails?.bookingId === bookingIdToCancel && m.bookingDetails?.bookingStatus === 'active');
            } else {
                bookingMessageToUpdate = [...history, newMessage].reverse().find(m => m.bookingDetails?.bookingId && m.bookingDetails?.bookingStatus === 'active');
            }
        
            if (bookingMessageToUpdate && bookingMessageToUpdate.bookingDetails) {
                bookingMessageToUpdate.bookingDetails.bookingStatus = 'cancelled';
                const bookingId = bookingMessageToUpdate.bookingDetails.bookingId;
                 return {
                    content: `Your booking with ID **${bookingId}** has been successfully cancelled.`,
                    updateBookingMessageId: bookingMessageToUpdate.id,
                    newBookingDetails: bookingMessageToUpdate.bookingDetails,
                };
            }
        
            return { 
                content: 'Sorry, I couldn\'t find an active booking to cancel.',
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
            const hotelNameMatch = query.replace('tell me more about', '').trim();
            const hotel = hotel_info_data.find(h => h.name.toLowerCase() === hotelNameMatch);
            if (hotel) {
                return {
                    content: `Here are the details for ${hotel.name}:`,
                    hotelData: [hotel],
                };
            }
            return { content: "I couldn't find that hotel. Please select one from a list." };
        }

        case 'book_hotel': {
            const hotelNameMatch = query.replace('book the', '').trim();
            const hotel = hotel_info_data.find(h => h.name.toLowerCase() === hotelNameMatch);

             if (hotel) {
                return {
                    content: `Please fill out the form below to book your stay at **${hotel.name}**.`,
                    isBookingForm: true,
                    hotelData: [hotel]
                };
            }

            return { content: "Please specify which hotel you'd like to book." };
        }

        case 'booking_procedure': {
            const hotelNameMatch = query.replace('how to book','').replace('the','').trim();
            const hotel = hotel_info_data.find(h => h.name.toLowerCase() === hotelNameMatch);

            if(hotel) {
                return {
                    content: `To book the **${hotel.name}**, please fill out the form below.`,
                    isBookingForm: true,
                    hotelData: [hotel],
                };
            }

            const lastBookingMessage = history.find(m => m.isBookingForm);
            if (lastBookingMessage && lastBookingMessage.hotelData) {
                 return {
                    content: `You were about to book the **${'hotel' in lastBookingMessage.hotelData[0] ? lastBookingMessage.hotelData[0].hotel.name : lastBookingMessage.hotelData[0].name}**. Do you want to proceed?`,
                    quickReplies: [`Yes, proceed to book ${'hotel' in lastBookingMessage.hotelData[0] ? lastBookingMessage.hotelData[0].hotel.name : lastBookingMessage.hotelData[0].name}`]
                };
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
        
        case 'submit_feedback':
            return {
                content: "Thanks for your feedback! I'm glad I could help. Is there anything else you need?"
            };

        case 'rate_experience':
            if (newMessage.content.includes('⭐')) {
                return {
                    content: "Thanks for your feedback! I'm glad I could help. Is there anything else you need?"
                };
            }
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
        
        case 'get_weather': {
            let hotel: Hotel | undefined;
            const hotelNameMatch = query.match(/weather at (.*)/) || query.match(/weather in (.*)/);
            const hotelName = hotelNameMatch ? hotelNameMatch[1].replace('?','').trim() : '';

            if (hotelName) {
                hotel = hotel_info_data.find(h => h.name.toLowerCase() === hotelName) || hotel_info_data.find(h => h.city.toLowerCase() === hotelName);
            } else {
                const lastMessageWithHotel = [...history, newMessage].reverse().find(m => m.hotelData && m.hotelData.length > 0);
                if (lastMessageWithHotel?.hotelData) {
                    const hotelData = lastMessageWithHotel.hotelData[0];
                    hotel = 'hotel' in hotelData ? hotelData.hotel : hotelData;
                }
            }

            if (!hotel) {
                return { 
                    content: "Which city's weather would you like to know? I can fetch forecasts for Salem, Chennai, or Ooty.",
                    quickReplies: ['Salem', 'Chennai', 'Ooty']
                };
            }

            try {
                const result = await getWeatherForecast({ city: hotel.city });
                const { temperature, condition, summary } = result.forecast;
                return {
                    content: `Here's the weather forecast for **${hotel.city}**:
                    \n- **Condition:** ${condition}
                    \n- **Temperature:** ${temperature}
                    \n\n${summary}`
                };
            } catch (e) {
                console.error('Weather forecast failed', e);
                return { content: 'Sorry, I am having trouble getting the weather forecast right now.' };
            }
        }


        default:
            return { content: "I'm sorry, I can't help with that. I can help find, book, or suggest hotels in Salem, Chennai, and Ooty. How can I help?" };
    }
}
