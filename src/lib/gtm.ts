declare global {
  interface Window {
    dataLayer: any[];
  }
}

/**
 * Safe push to window.dataLayer
 */
export const pushToDataLayer = (data: Record<string, any>) => {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(data);
  }
};

/**
 * Generate a unique event ID for Browser & Meta CAPI Deduplication
 */
export const generateEventId = () => {
  return `evt_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
};

interface EcommerceItem {
  item_id: string;
  item_name: string;
  price: number;
  item_category?: string;
  item_variant?: string;
  quantity?: number;
}

interface EcommercePayload {
  currency?: string;
  value?: number;
  transaction_id?: string;
  shipping?: number;
  items: EcommerceItem[];
}

interface UserData {
  email?: string;
  phone?: string;
  name?: string;
}

/**
 * Standard Ecommerce Event Tracker with Deduplication Support
 */
export const trackEcommerceEvent = ({
  eventName,
  ecommerce,
  userData,
}: {
  eventName: "view_item" | "add_to_cart" | "begin_checkout" | "purchase";
  ecommerce: EcommercePayload;
  userData?: UserData;
}) => {
  const eventId = generateEventId();

  // Clear previous ecommerce object to prevent data leaking
  pushToDataLayer({ ecommerce: null });

  pushToDataLayer({
    event: eventName,
    event_id: eventId, // Critical for Meta CAPI deduplication
    user_data: userData || {},
    ecommerce: {
      currency: "BDT",
      ...ecommerce,
    },
  });

  return eventId;
};