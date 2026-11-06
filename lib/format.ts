const taka = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const dateOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
} as const;
const dateFormats = {
  bn: new Intl.DateTimeFormat("bn-BD-u-nu-latn", dateOptions),
  en: new Intl.DateTimeFormat("en-GB", dateOptions),
};

export function money(value: number) {
  const rounded = Math.round(value);
  return `${rounded < 0 ? "-" : ""}৳${taka.format(Math.abs(rounded))}`;
}

/** For per-piece costs and profits: keeps paisa, as in ৳1,063.33. */
export function moneyExact(value: number) {
  const text = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Math.abs(value));
  return `${value <= -0.005 ? "-" : ""}৳${text}`;
}

export function shortDate(iso: string, lang: "bn" | "en" = "bn") {
  return dateFormats[lang].format(new Date(`${iso}T00:00:00Z`));
}

/** Today's date in Bangladesh, whatever timezone the server runs in. */
export function todayInDhaka() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
