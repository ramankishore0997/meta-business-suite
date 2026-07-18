export const OBJECTIVES = [
  "AWARENESS",
  "TRAFFIC",
  "ENGAGEMENT",
  "LEADS",
  "APP_PROMOTION",
  "SALES",
  "MESSAGES",
];

export const FORMATS = ["image", "video", "carousel", "collection", "stories"];

export const BUYING_TYPES = [
  { value: "AUCTION", label: "Auction" },
  { value: "RESERVED", label: "Reservation" },
];

export const SPECIAL_CATEGORIES = [
  { value: "none", label: "None" },
  { value: "CREDIT", label: "Credit" },
  { value: "EMPLOYMENT", label: "Employment" },
  { value: "HOUSING", label: "Housing" },
  { value: "SOCIAL_ISSUES", label: "Social issues, elections or politics" },
];

export const CONVERSION_LOCATIONS = [
  { value: "website", label: "Website" },
  { value: "app", label: "App" },
  { value: "messenger", label: "Messenger" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instant_forms", label: "Instant forms" },
  { value: "calls", label: "Calls" },
];

export const PERFORMANCE_GOALS = [
  { value: "link_clicks", label: "Maximise number of link clicks" },
  { value: "landing_page_views", label: "Maximise landing page views" },
  { value: "impressions", label: "Maximise number of impressions" },
  { value: "reach", label: "Maximise daily unique reach" },
  { value: "conversions", label: "Maximise number of conversions" },
];

export const GENDERS = [
  { value: "all", label: "All genders" },
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
];

export const PLACEMENT_MODES = [
  { value: "advantage_plus", label: "Advantage+ placements (recommended)" },
  { value: "manual", label: "Manual placements" },
];

export const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn more" },
  { value: "SHOP_NOW", label: "Shop now" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "SEND_MESSAGE", label: "Send message" },
  { value: "BOOK_NOW", label: "Book now" },
  { value: "DOWNLOAD", label: "Download" },
  { value: "CONTACT_US", label: "Contact us" },
  { value: "SUBSCRIBE", label: "Subscribe" },
  { value: "GET_OFFER", label: "Get offer" },
  { value: "APPLY_NOW", label: "Apply now" },
];

export function humanizeObjective(o: string): string {
  return o.charAt(0) + o.slice(1).toLowerCase().replace(/_/g, " ");
}
