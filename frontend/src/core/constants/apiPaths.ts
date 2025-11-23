// Central API path mapping for reuse in hooks/components.

export const API_PATHS = {
  CARI_LIST: "/cari", // expects pagination params
  WORK_ORDER_LIST: "/work-order",
  WORK_ORDER_DETAIL: (id: number) => `/work-order/${id}`,
  WORK_ORDER_BY_NUMBER: (woNumber: string) => `/work-order/number/${woNumber}`,
  WORK_ORDER_ITEMS: (woId: number) => `/work-order-item/wo/${woId}`,
  WORK_ORDER_STATS: "/work-order/stats",
  UNINVOICED_ITEMS: "/work-order-item/uninvoiced`,
  EXCHANGE_RATE_LIST: "/exchange-rate", // may include date filters
  PARAMETRE_LIST: "/parametre",
  TARIFE_LIST: "/price-list",
  BARINMA_LIST: "/barinma",
};

export type ApiPathKey = keyof typeof API_PATHS;
