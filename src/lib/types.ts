export interface Hotel {
  id: string;
  name: string;
  city: string;
  stars: number;
  price: number;
  amenities: string[];
  description: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  available_rooms: number;
  rating: number;
  location_url: string;
}

export interface Message {
  id:string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  hotelData?: (Hotel | { hotel: Hotel; reason: string })[];
  isBookingForm?: boolean;
  quickReplies?: string[];
  bookingDetails?: Record<string, any>;
}
