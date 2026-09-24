// Closed-period history (before today). Current-period numbers are computed live from the store.
export const MONTHS_12 = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

// Revenue in ₹ lakh for Oct 2025 – Aug 2026. September comes from invoices.
export const REVENUE_HISTORY = [13.2, 12.8, 12.1, 16.9, 15.4, 14.8, 14.1, 13.6, 14.9, 16.2, 17.1];

// Active members at month end, Apr – Aug. September is live.
export const ACTIVE_HISTORY = [1121, 1138, 1164, 1187, 1219];

export const NEW_MEMBERS_12 = [62, 58, 49, 112, 94, 81, 76, 70, 79, 88, 95];
export const LOST_MEMBERS_12 = [41, 44, 52, 38, 47, 55, 59, 53, 53, 65, 63];
export const AVG_CHECKINS_12 = [288, 279, 254, 352, 338, 321, 305, 296, 309, 318, 326];

// Daily check-ins for 1–23 Sep 2026. Today (24th) is live.
export const SEP_DAILY_CHECKINS = [331, 344, 352, 318, 307, 181, 342, 349, 355, 322, 301, 288, 174, 358, 347, 339, 316, 309, 291, 169, 362, 349, 341];
export const LAST_WEEK = [351, 338, 332, 327, 334, 298, 176]; // Mon–Sun, 14–20 Sep
export const PEAK_HOURS = [10, 34, 36, 27, 15, 8, 6, 6, 5, 4, 6, 10, 22, 39, 43, 31, 17, 4];
export const PEAK_LABELS = ['5a', '6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '10p'];

// Renewal rate by plan, last 12 months.
export const RENEWAL_BY_PLAN: [string, number][] = [['Monthly', 64], ['Quarterly', 76], ['Half Yearly', 84], ['Annual', 91]];
