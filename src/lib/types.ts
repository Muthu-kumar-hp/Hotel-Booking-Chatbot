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
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  hotelData?: (Hotel | { hotel: Hotel; reason: string })[];
  isBookingForm?: boolean;
}

export interface Booking {
  id: string;
  hotelName: string;
  hotelCity: string;
  hotelPrice: number;
  checkinDate: string;
  checkoutDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingId: string;
  timestamp: Date;
  userId: string;
}
