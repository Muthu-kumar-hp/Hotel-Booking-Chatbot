import { z } from 'zod';

export const HotelSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  stars: z.number(),
  price: z.number(),
  amenities: z.array(z.string()),
  description: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  image: z.string(),
  available_rooms: z.number(),
  rating: z.number(),
  location_url: z.string(),
});

export type Hotel = z.infer<typeof HotelSchema>;

export interface Message {
  id:string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  hotelData?: (Hotel | { hotel: Hotel; reason: string })[];
  isBookingForm?: boolean;
  quickReplies?: string[];
  bookingDetails?: Record<string, any>;
}
