export interface ClinicMetadata {
  id: string
  name: string
  legalName: string
  tagline: string
  logoUrl: string
  address: {
    street: string
    suite: string
    city: string
    state: string
    postalCode: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  contact: {
    phone: string
    emergencyPhone: string
    email: string
    website: string
    whatsapp: string
  }
  registration: {
    taxId: string
    licenseNumber: string
    director: string
  }
  timings: {
    weekdays: string
    weekends: string
  }
}

export const defaultClinicConfig: ClinicMetadata = {
  id: "CLN-001",
  name: "Clinix Dental Care & Surgery",
  legalName: "Clinix Dental Specialty Center LLC",
  tagline: "Advanced Dental Care & Oral Surgery",
  logoUrl: "/logo.svg",
  address: {
    street: "847 Healthcare Blvd",
    suite: "Suite 402, Medical Arts Tower",
    city: "Metro City",
    state: "NY",
    postalCode: "10001",
    country: "USA",
  },
  contact: {
    phone: "+1 (555) 234-5678",
    emergencyPhone: "+1 (555) 999-DENT",
    email: "care@clinixdental.com",
    website: "https://clinixdental.com",
    whatsapp: "+15552345678",
  },
  registration: {
    taxId: "TX-998234-DENT",
    licenseNumber: "NY-DENT-88412",
    director: "Dr. Darrell Steward, D.D.S.",
  },
  timings: {
    weekdays: "09:00 AM - 12:00 AM",
    weekends: "10:00 AM - 08:00 PM",
  },
}

export function formatClinicAddress(config: ClinicMetadata = defaultClinicConfig): string {
  const { street, suite, city, state, postalCode } = config.address
  return [suite, street, `${city}, ${state} ${postalCode}`].filter(Boolean).join(", ")
}
