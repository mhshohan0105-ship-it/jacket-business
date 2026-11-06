"use client";

import { useRef, useState, useTransition } from "react";
import { deliverPreorder } from "@/lib/actions";
import { PaymentFields, type PaymentStatus } from "./payment-fields";
import { buttonClass, inputClass, labelClass } from "./ui";

export function DeliverButton({
  id,
  customer,
  today,
}: {
  id: number;
  customer: string;
  today: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState<PaymentStatus>("paid");
  const [expectedDate, setExpectedDate] = useState("");

  const confirm = () => {
    setError("");
    start(async () => {
      const result = await deliverPreorder({
        id,
        date,
        paymentStatus: status,
        expectedPayDate: expectedDate,
      });
      if (result.ok) dialog.current?.close();
      else setError(result.error);
    });
  };

  return (
    <>
      <button
        type="button"
        className={buttonClass("primary")}
        onClick={() => dialog.current?.showModal()}
      >
        ডেলিভারি দিন
      </button>
      <dialog
        ref={dialog}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-card p-5 text-ink"
      >
        <h2 className="text-lg font-bold">{customer}-কে ডেলিভারি</h2>
        <p className="mt-1 text-sm text-muted">এটা বিক্রিতে যোগ হবে এবং স্টক কমে যাবে।</p>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor={`deliver-date-${id}`} className={labelClass}>
              তারিখ
            </label>
            <input
              id={`deliver-date-${id}`}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </div>
          <PaymentFields
            status={status}
            expectedDate={expectedDate}
            minDate={date}
            onStatus={setStatus}
            onExpectedDate={setExpectedDate}
          />
        </div>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-loss-soft px-3 py-2 text-sm text-loss">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={buttonClass("quiet")} onClick={() => dialog.current?.close()}>
            থাক
          </button>
          <button type="button" disabled={pending} className={buttonClass("primary")} onClick={confirm}>
            {pending ? "হচ্ছে..." : "নিশ্চিত করুন"}
          </button>
        </div>
      </dialog>
    </>
  );
}
