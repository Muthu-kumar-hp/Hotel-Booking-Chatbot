'use server';

/**
 * @fileOverview Answers questions about a specific hotel using generative AI.
 *
 * @exports answerHotelQuestion - A function to answer a question about a hotel.
 * @exports AnswerHotelQuestionInput - The input type for the answerHotelQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerHotelQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s question about the hotel.'),
  hotelData: z.string().describe('The JSON data for the hotel.'),
});
export type AnswerHotelQuestionInput = z.infer<typeof AnswerHotelQuestionInputSchema>;


export async function answerHotelQuestion(input: AnswerHotelQuestionInput): Promise<string> {
  const result = await answerHotelQuestionFlow(input);
  return result;
}

const answerHotelQuestionPrompt = ai.definePrompt({
  name: 'answerHotelQuestionPrompt',
  input: {schema: AnswerHotelQuestionInputSchema},
  output: {schema: z.string()},
  prompt: `You are a helpful hotel assistant. Answer the user's question based on the provided hotel data.
  If the information is not in the data, say you don't have that information.
  
  Hotel Data:
  {{{hotelData}}}

  Question:
  {{{question}}}
  `,
});

const answerHotelQuestionFlow = ai.defineFlow(
  {
    name: 'answerHotelQuestionFlow',
    inputSchema: AnswerHotelQuestionInputSchema,
    outputSchema: z.string(),
  },
  async input => {
    const {output} = await answerHotelQuestionPrompt(input);
    return output!;
  }
);
