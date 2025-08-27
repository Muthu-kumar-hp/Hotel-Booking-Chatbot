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
  preferences: z.string().describe('The user\u0027s preferences for hotel suggestions, including price range, rating, and location.'),
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
  prompt: `Based on the following user preferences: {{{preferences}}}, and the following hotel data: {{{hotelData}}}, recommend hotels that match these preferences.

        Provide the response as a JSON array of hotel objects, including the hotel_id and a reason for the suggestion.

        JSON Format:
        [
            {
                "hotel_id": "HTL001",
                "reason": "This hotel is highly-rated and offers great value."
            }
        ]
        `, // Updated prompt
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
