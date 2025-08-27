'use client';

import Image from 'next/image';
import type { Hotel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

interface HotelCardProps {
  hotel: Hotel;
  reason?: string;
  onQuickReply: (text: string) => void;
}

export function HotelCard({ hotel, reason, onQuickReply }: HotelCardProps) {
  const handleViewDetails = () => {
    onQuickReply(`Tell me more about ${hotel.name}`);
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative h-40 w-full">
          <Image
            src={hotel.image}
            alt={hotel.name}
            fill
            className="object-cover"
            data-ai-hint="hotel exterior"
          />
        </div>
        <div className="p-4">
          <CardTitle className="text-lg">{hotel.name}</CardTitle>
          <CardDescription className="flex items-center pt-1">
            {'⭐'.repeat(hotel.stars)}
            <span className="ml-2 text-xs text-muted-foreground">
              {hotel.rating} / 5
            </span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <p className="text-sm text-muted-foreground">
          {reason || hotel.description}
        </p>
        <div className="mt-2 text-lg font-bold">
          ${hotel.price}{' '}
          <span className="text-xs font-normal text-muted-foreground">
            / night
          </span>
        </div>
        
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleViewDetails} className="w-full">
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

export function HotelDetailCard({ hotel, onQuickReply }: HotelCardProps) {
    const handleBookNow = () => {
        onQuickReply(`I want to book ${hotel.name}`);
    }
  return (
    <div className="bg-card rounded-lg overflow-hidden flex flex-col gap-4 p-4">
        <div className="relative h-56 w-full rounded-md overflow-hidden">
            <Image src={hotel.image} alt={hotel.name} fill className="object-cover" data-ai-hint="hotel interior" />
        </div>
        <div>
            <h3 className="text-xl font-bold">{hotel.name}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
                {'⭐'.repeat(hotel.stars)}
                <span className="ml-2">{hotel.rating} / 5</span>
            </div>
            <p className="text-sm mt-2">{hotel.description}</p>
        </div>
        <div>
            <h4 className="font-semibold text-md">Amenities</h4>
            <div className="flex flex-wrap gap-2 mt-2">
                {hotel.amenities.map(amenity => (
                    <Badge key={amenity} variant="secondary">{amenity}</Badge>
                ))}
            </div>
        </div>
         <div>
            <h4 className="font-semibold text-md">Location</h4>
             <p className="text-sm text-muted-foreground mt-1">{hotel.address}</p>
            <Link href={hotel.location_url} target="_blank" rel="noopener noreferrer">
                <Button variant="link" className="px-0">
                    <MapPin className="mr-2 h-4 w-4" />
                    View on Google Maps
                </Button>
            </Link>
        </div>
        <div className="text-2xl font-bold mt-2">
            ${hotel.price} <span className="text-sm font-normal text-muted-foreground">/ night</span>
        </div>
        <Button onClick={handleBookNow} className="w-full mt-2">Book this Hotel</Button>
    </div>
  )
}
