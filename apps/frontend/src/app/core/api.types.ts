export type ApiError = {error: string; details?:any};

export type PickupPointDto = {
  code: string;
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
}

export type UserShortDto = {id: string; displayName: string;};

export type BookDto = {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverUrl?: string | null;
  status: 'available' | 'reserved' | 'exchanged';
  createdAt: string;
  owner?: UserShortDto;
}

export type ExtendedPublicUserDto = {
  id: string;
  displayName: string;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;

  stats: {
    booksTotal: number;
    booksAvailable: number;
    booksReserved: number;
    booksExchanged: number;

    dealsTotal: number;
    dealsAsBuyer: number;
    dealsAsSeller: number;
    dealsCompleted: number;
  };
};


export type DealStatus =
  | 'pending'
  | 'accepted'
  | 'pickup_selected'
  | 'shipped'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type DealDto = {
  id: string;
  status: DealStatus;
  createdAt: string;

  acceptedAt?: string | null;
  pickupPointId?: string | null;
  trackingNumber?: string | null;
  sellerShippedAt?: string | null;
  buyerReceivedAt?: string | null;

  book?: {id: string; title: string;};
  seller?: UserShortDto;
  buyer?: UserShortDto;
}
