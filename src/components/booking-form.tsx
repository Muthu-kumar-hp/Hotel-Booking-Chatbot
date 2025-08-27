'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Hotel } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  customerName: z.string().min(2, { message: 'Name is required.' }),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(10, { message: 'A valid phone number is required.' }),
  checkinDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date"}),
  checkoutDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date"}),
  cardNumber: z.string().length(16, { message: 'Card number must be 16 digits.'}),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, { message: 'Invalid expiry date (MM/YY).' }),
  cvv: z.string().length(3, { message: 'CVV must be 3 digits.' }),
});

interface BookingFormProps {
    hotel: Hotel;
    onBookHotel: (data: any) => void;
}

export function BookingForm({ hotel, onBookHotel }: BookingFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      checkinDate: new Date().toISOString().split('T')[0],
      checkoutDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0],
      cardNumber: '',
      expiryDate: '',
      cvv: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onBookHotel({
        hotelName: hotel.name,
        hotelCity: hotel.city,
        hotelPrice: hotel.price,
        ...values,
    });
  }

  return (
    <div className="bg-card p-4 rounded-lg mt-2">
        <h3 className="font-bold mb-4">Booking for {hotel.name}</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="customerName" render={({ field }) => (
              <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="customerEmail" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="customerPhone" render={({ field }) => (
              <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="flex gap-4">
             <FormField control={form.control} name="checkinDate" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Check-in</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="checkoutDate" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Check-out</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <h4 className="font-bold pt-2">Payment Details</h4>
           <FormField control={form.control} name="cardNumber" render={({ field }) => (
              <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input placeholder="1234123412341234" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
           <div className="flex gap-4">
             <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem className="flex-1"><FormLabel>Expiry (MM/YY)</FormLabel><FormControl><Input placeholder="MM/YY" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="cvv" render={({ field }) => (
                <FormItem className="w-1/3"><FormLabel>CVV</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>

          <Button type="submit" className="w-full">Confirm Booking</Button>
        </form>
      </Form>
    </div>
  );
}
