import { IPayment } from '../models/Payment';
import { IRegistration } from '../models/Registration';
import { IEvent } from '../models/Event';

interface ReceiptData {
  receiptNumber: string;
  playerName: string;
  firstName: string;
  surname: string;
  sex: string;
  dateOfBirth: string;
  age: number;
  stateOfResidence: string;
  stateOfOrigin: string;
  religion: string;
  positionOfPlay: string;
  firstAlternatePosition: string;
  secondAlternatePosition: string;
  guardianFullName: string;
  guardianWhatsappNumber: string;
  guardianOccupation: string;
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
    playerName: `${registration.firstName} ${registration.surname}`,
    firstName: registration.firstName,
    surname: registration.surname,
    sex: registration.sex,
    dateOfBirth: registration.dateOfBirth,
    age: registration.age,
    stateOfResidence: registration.stateOfResidence,
    stateOfOrigin: registration.stateOfOrigin,
    religion: registration.religion,
    positionOfPlay: registration.positionOfPlay,
    firstAlternatePosition: registration.firstAlternatePosition,
    secondAlternatePosition: registration.secondAlternatePosition,
    guardianFullName: registration.guardianFullName,
    guardianWhatsappNumber: registration.guardianWhatsappNumber,
    guardianOccupation: registration.guardianOccupation,
    event: event.name,
    amount: payment.amount / 100,
    currency: payment.currency,
    paidAt: payment.paidAt,
    channel: payment.channel,
  };
};
