import { IPayment } from '../models/Payment';
import { IRegistration } from '../models/Registration';
import { IEvent } from '../models/Event';

interface ReceiptData {
  receiptNumber: string;
  name: string;
  email: string;
  event: string;
  amount: number;
  currency: string;
  paidAt: Date;
  channel: string;
}

export const formatReceipt = (
  payment: IPayment,
  registration: IRegistration,
  event: IEvent
): ReceiptData => {
  return {
    receiptNumber: payment.receiptNumber,
    name: registration.fullName,
    email: registration.email,
    event: event.name,
    amount: payment.amount / 100,
    currency: payment.currency,
    paidAt: payment.paidAt,
    channel: payment.channel,
  };
};
