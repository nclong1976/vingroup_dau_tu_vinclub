export interface Transaction {
  id?: string;
  amount: number;
  type: 'plus' | 'minus';
  paymentMethod: string;
  signature_type: string;
  signature_content: string;
  date: string;
  status: string;
  userName: string;
  title?: string;
  points?: number;
}
