# জ্যাকেট হিসাব

জ্যাকেটের কেনা, কুরিয়ার চার্জ, বিক্রি, বাকি টাকা, স্টক আর প্রি-অর্ডারের হিসাব রাখার অ্যাপ।

## Local-এ চালানো

```bash
npm install
npm run dev
```

তারপর http://localhost:3000 খুলুন। আলাদা database লাগবে না: ডেটা `.data/pglite` ফোল্ডারে থাকে।

ঢোকার ইউজারনেম ও পাসওয়ার্ড থাকে `.env.local` ফাইলে (`APP_USERNAME`, `APP_PASSWORD`)। বদলালে `npm run dev` আবার চালু করুন।

## হিসাব যেভাবে হয়

- **আসল খরচ:** প্রতি পিসের কেনার দাম + সেই আইটেমের কুরিয়ার চার্জ ÷ পিস সংখ্যা।
- **কুরিয়ার:** চালানের মোট চার্জ পিস অনুযায়ী নিজে থেকে ভাগ হয়। চাইলে প্রতিটা আইটেমের চার্জ আলাদা করে লেখা যায়।
- **লাভ:** যে চালান আগে কেনা, তার মাল আগে বিক্রি হয়েছে ধরে (FIFO) হিসাব হয়।
- **ভুল ঠিক করা:** কেনা ও প্রোডাক্ট এডিট করা যায়। বিক্রি মুছে আবার লিখুন।

## Vercel-এ দেওয়ার জন্য যা লাগবে

| Environment variable | মান |
|---|---|
| `DATABASE_URL` | `jacket_business`-এর pooled connection string |
| `DATABASE_URL_UNPOOLED` | `jacket_business`-এর direct connection string |
| `APP_USERNAME` | অ্যাপে ঢোকার ইউজারনেম |
| `APP_PASSWORD` | অ্যাপে ঢোকার পাসওয়ার্ড (লম্বা ও শক্ত রাখুন) |

Vercel-এর Storage থেকে Neon connect করবেন না, এই variable-গুলো হাতে বসান।

Database প্রথমবার তৈরি করতে দুটো URL `.env`-এ রেখে আগে যাচাই করুন, তারপর setup চালান:

```bash
npm run db:check
```

```bash
npm run db:setup
```

`db:check` কোথাও connect করে না, শুধু database-এর নাম দেখায়। URL `jacket_business`-এর না হলে অ্যাপ ও `db:setup` কোনোটাই connect করে না।

## Commands

- `npm test`: হিসাবের test
- `npm run typecheck`: TypeScript যাচাই
- `npm run db:generate`: schema বদলালে নতুন migration তৈরি
- `npm run db:check`: `.env`-এর URL কোন database-এর, তা দেখায়
