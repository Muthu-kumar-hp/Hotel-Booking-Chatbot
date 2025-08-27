
'use server';

/**
 * @fileOverview Provides upselling suggestions for hotel bookings using generative AI.
 *
 * @exports suggestUpsell - A function to generate an upsell suggestion for a given hotel.
 * @exports SuggestUpsellInput - The input type for the suggestUpsell function.
 * @exports SuggestUpsellOutput - The return type for the suggestUpsell function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { HotelSchema } from '@/lib/types';

const SuggestUpsellInputSchema = z.object({
  hotel: HotelSchema.describe('The hotel the user is considering booking.'),
  currentChoice: z.string().describe('The user\'s current room choice or interest. e.g. "a standard room"'),
});
export type SuggestUpsellInput = z.infer<typeof SuggestUpsellInputSchema>;

const SuggestUpsellOutputSchema = z.object({
  suggestion: z.string().describe('A compelling, short message to upsell the user. e.g., "For just a little more, you can get a room with a sea view."'),
  newChoice: z.string().describe('The upgraded room or package being offered. e.g., "Deluxe Room"'),
});
export type SuggestUpsellOutput = z.infer<typeof SuggestUpsellOutputSchema>;

export async function suggestUpsell(input: SuggestUpsellInput): Promise<SuggestUpsellOutput> {
  return suggestUpsellFlow(input);
}

const suggestUpsellPrompt = ai.definePrompt({
  name: 'suggestUpsellPrompt',
  input: {schema: SuggestUpsellInputSchema},
  output: {schema: SuggestUpsellOutputSchema},
  prompt: `You are a hotel concierge trying to provide the best experience for a guest.
The user is booking a room at the following hotel:
{{{json hotel}}}

Their current choice is: {{{currentChoice}}}

Offer them a simple, compelling upsell. For example, if they are booking a standard room, suggest a deluxe room. If they are booking a deluxe room, suggest a suite.
Keep the suggestion concise and appealing.
`,
});

const suggestUpsellFlow = ai.defineFlow(
  {
    name: 'suggestUpsellFlow',
    inputSchema: SuggestUpsellInputSchema,
    outputSchema: SuggestUpsellOutputSchema,
  },
  async input => {
    const {output} = await suggestUpsellPrompt(input);
    return output!;
  }
);
