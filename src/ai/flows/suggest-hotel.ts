// This file uses server-side code.
'use server';

/**
 * @fileOverview Provides hotel suggestions based on user preferences using generative AI.
 *
 * @exports suggestHotel - A function to initiate hotel suggestions based on user input.
 * @exports SuggestHotelInput - The input type for the suggestHotel function.
 * @exports SuggestHotelOutput - The return type for the suggestHotel function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestHotelInputSchema = z.object({
  preferences: z.string().describe('The user’s preferences for hotel suggestions, including price range, rating, location, and amenities.'),
  hotelData: z.string().describe('The data for available hotels in JSON format.'),
});
export type SuggestHotelInput = z.infer<typeof SuggestHotelInputSchema>;

const SuggestHotelOutputSchema = z.array(z.object({
  hotel_id: z.string().describe('The ID of the suggested hotel.'),
  reason: z.string().describe('The reason for suggesting this hotel based on user preferences.'),
}));
export type SuggestHotelOutput = z.infer<typeof SuggestHotelOutputSchema>;

export async function suggestHotel(input: SuggestHotelInput): Promise<SuggestHotelOutput> {
  return suggestHotelFlow(input);
}

const suggestHotelPrompt = ai.definePrompt({
  name: 'suggestHotelPrompt',
  input: {schema: SuggestHotelInputSchema},
  output: {schema: SuggestHotelOutputSchema},
  prompt: `You are an intelligent hotel booking assistant. Your goal is to recommend hotels that best match the user's preferences.

Analyze the user's request for details like city, price (e.g., "cheap," "luxury"), desired rating ("high-rated," "best"), and specific amenities or features (e.g., "swimming pool," "near the beach," "sea view").

Based on the following user preferences:
"{{{preferences}}}"

And the available hotel data:
"{{{hotelData}}}"

Recommend up to 3 hotels that are the best fit. For each recommendation, provide the hotel_id and a brief, compelling reason explaining why it matches their request.

Example Response Format:
[
    {
        "hotel_id": "HTL002",
        "reason": "This luxurious beachfront hotel has stunning sea views and a pool, matching your request perfectly."
    }
]
        `,
});

const suggestHotelFlow = ai.defineFlow(
  {
    name: 'suggestHotelFlow',
    inputSchema: SuggestHotelInputSchema,
    outputSchema: SuggestHotelOutputSchema,
  },
  async input => {
    const {output} = await suggestHotelPrompt(input);
    return output!;
  }
);
