import type { Hotel } from '@/lib/types';

export const hotel_info_data: Hotel[] = [
    {
        "id": "HTL001", "name": "Sunrise Inn", "city": "Salem", "stars": 3, "price": 50,
        "amenities": ["Free WiFi", "Breakfast included", "Parking", "24/7 Reception"],
        "description": "A comfortable budget hotel in the heart of Salem with modern amenities.",
        "address": "123 Main Street, Salem", "phone": "+91-427-1234567", "email": "info@sunriseinn.com",
        "image": "https://images.unsplash.com/photo-1568495248636-6432b97bd949?q=80&w=2574&auto=format&fit=crop",
        "available_rooms": 25, "rating": 4.2, "location_url": "https://www.google.com/maps?q=11.6643,78.1481"
    },
    {
        "id": "HTL002", "name": "Ocean View", "city": "Chennai", "stars": 4, "price": 120,
        "amenities": ["Sea view", "Swimming Pool", "Fitness Center", "Free WiFi", "Restaurant"],
        "description": "Luxurious beachfront hotel with stunning ocean views and premium facilities.",
        "address": "456 Marina Beach Road, Chennai", "phone": "+91-44-9876543", "email": "reservations@oceanview.com",
        "image": "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2524&auto=format&fit=crop",
        "available_rooms": 18, "rating": 4.6, "location_url": "https://www.google.com/maps?q=13.0827,80.2707"
    },
    {
        "id": "HTL003", "name": "Mountain Retreat", "city": "Ooty", "stars": 5, "price": 200,
        "amenities": ["Spa & Wellness", "Hiking Trails", "Breakfast included", "Mountain View", "Fireplace"],
        "description": "Premium mountain resort offering breathtaking views and world-class amenities.",
        "address": "789 Hill Station Road, Ooty", "phone": "+91-423-5551234", "email": "bookings@mountainretreat.com",
        "image": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2670&auto=format&fit=crop",
        "available_rooms": 12, "rating": 4.8, "location_url": "https://www.google.com/maps?q=11.4064,76.6939"
    },
    {
        "id": "HTL004", "name": "City Comforts", "city": "Salem", "stars": 4, "price": 80,
        "amenities": ["Free WiFi", "Restaurant", "Parking", "Business Center", "Room Service"],
        "description": "Modern business hotel with excellent facilities for both leisure and business travelers.",
        "address": "321 Business District, Salem", "phone": "+91-427-7778888", "email": "stay@citycomforts.com",
        "image": "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2862&auto=format&fit=crop",
        "available_rooms": 30, "rating": 4.3, "location_url": "https://www.google.com/maps?q=11.6643,78.1481"
    },
    {
        "id": "HTL005", "name": "Royal Palace", "city": "Chennai", "stars": 5, "price": 250,
        "amenities": ["Swimming Pool", "Full-Service Spa", "Luxury Suites", "Fine Dining", "Valet Service"],
        "description": "Ultra-luxury hotel offering royal treatment with opulent rooms and exceptional service.",
        "address": "567 Luxury Lane, Chennai", "phone": "+91-44-1112233", "email": "concierge@royalpalace.com",
        "image": "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2670&auto=format&fit=crop",
        "available_rooms": 8, "rating": 4.9, "location_url": "https://www.google.com/maps?q=13.0827,80.2707"
    },
];
