
'use server';

/**
 * @fileOverview Provides nearby attraction suggestions for a given hotel.
 *
 * @exports suggestAttractions - A function to get attraction suggestions.
 * @exports SuggestAttractionsInput - The input type for the suggestAttractions function.
 * @exports SuggestAttractionsOutput - The return type for the suggestAttractions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAttractionsInputSchema = z.object({
  hotelName: z.string().describe('The name of the hotel.'),
  city: z.string().describe('The city where the hotel is located.'),
});
export type SuggestAttractionsInput = z.infer<typeof SuggestAttractionsInputSchema>;

const SuggestAttractionsOutputSchema = z.object({
  attractions: z.array(z.object({
    name: z.string().describe('The name of the attraction.'),
    type: z.enum(['tourist_spot', 'restaurant', 'shopping']).describe('The type of attraction (e.g., tourist spot, restaurant, shopping).'),
    description: z.string().describe('A brief, compelling description of the attraction.'),
  })),
});
export type SuggestAttractionsOutput = z.infer<typeof SuggestAttractionsOutputSchema>;

export async function suggestAttractions(input: SuggestAttractionsInput): Promise<SuggestAttractionsOutput> {
  return suggestAttractionsFlow(input);
}

const suggestAttractionsPrompt = ai.definePrompt({
  name: 'suggestAttractionsPrompt',
  input: {schema: SuggestAttractionsInputSchema},
  output: {schema: SuggestAttractionsOutputSchema},
  prompt: `You are an expert local guide. A user is staying at {{{hotelName}}} in {{{city}}}.

Suggest 3-4 nearby attractions, including a mix of tourist spots, restaurants, and shopping areas.

For each attraction, provide its name, type, and a short, engaging description.
`,
});

const suggestAttractionsFlow = ai.defineFlow(
  {
    name: 'suggestAttractionsFlow',
    inputSchema: SuggestAttractionsInputSchema,
    outputSchema: SuggestAttractionsOutputSchema,
  },
  async input => {
    const {output} = await suggestAttractionsPrompt(input);
    return output!;
  }
);
