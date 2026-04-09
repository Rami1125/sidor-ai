// lib/builder.ts
import { builder } from '@builder.io/sdk';
import AnimatedOrderCard from '../components/AnimatedOrderCard';

// אתחול ה-SDK
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

// ב-SDK החדש, הרישום מתבצע כך כדי למנוע שגיאות Type
export const CUSTOM_COMPONENTS = [
  {
    component: AnimatedOrderCard,
    name: 'Order Card',
    inputs: [
      { name: 'client_info', type: 'string', defaultValue: 'לקוח חדש' },
      { name: 'location', type: 'string', defaultValue: 'כתובת' },
    ],
  },
];

// פונקציית עזר לרישום (אם תרצה להשתמש בה בהמשך)
export { builder };
