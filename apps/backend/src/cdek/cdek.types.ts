export type CdekOffice = {
    code: string;
    name: string;
    location: {
        address: string;
        city: string;
        latitude?: number;
        longitude?: number;
    };
};
