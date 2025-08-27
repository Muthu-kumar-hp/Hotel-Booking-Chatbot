'use server';

/**
 * @fileOverview Provides a weather forecast for a given city.
 *
 * @exports getWeatherForecast - A function to get the weather forecast.
 * @exports GetWeatherForecastInput - The input type for the getWeatherForecast function.
 * @exports GetWeatherForecastOutput - The return type for the getWeatherForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetWeatherForecastInputSchema = z.object({
  city: z.string().describe('The city for which to get the weather forecast.'),
});
export type GetWeatherForecastInput = z.infer<typeof GetWeatherForecastInputSchema>;

const GetWeatherForecastOutputSchema = z.object({
  forecast: z.object({
    temperature: z.string().describe('The current temperature in Celsius.'),
    condition: z.string().describe('A short description of the weather condition (e.g., "Sunny", "Cloudy", "Rainy").'),
    summary: z.string().describe('A brief, friendly summary of the weather for the day.'),
  }),
});
export type GetWeatherForecastOutput = z.infer<typeof GetWeatherForecastOutputSchema>;

export async function getWeatherForecast(input: GetWeatherForecastInput): Promise<GetWeatherForecastOutput> {
  return getWeatherForecastFlow(input);
}

const getWeatherForecastPrompt = ai.definePrompt({
  name: 'getWeatherForecastPrompt',
  input: {schema: GetWeatherForecastInputSchema},
  output: {schema: GetWeatherForecastOutputSchema},
  prompt: `You are a helpful weather bot. Generate a realistic but fictional weather forecast for {{{city}}}.
  
  Provide the current temperature in Celsius, the weather condition, and a short, friendly summary.
  Do not mention that the data is fictional.
`,
});

const getWeatherForecastFlow = ai.defineFlow(
  {
    name: 'getWeatherForecastFlow',
    inputSchema: GetWeatherForecastInputSchema,
    outputSchema: GetWeatherForecastOutputSchema,
  },
  async input => {
    const {output} = await getWeatherForecastPrompt(input);
    return output!;
  }
);
