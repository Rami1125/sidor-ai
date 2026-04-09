// lib/builder.ts
import { builder } from '@builder.io/sdk';

// אתחול ה-SDK עם המפתח שלך
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY!);

export { builder };

// דוגמה לרישום קומפוננטה קיימת מהמאגר שלך
builder.registerComponent(AnimatedOrderCard, {
  name: 'Order Card',
  inputs: [
    { name: 'client_info', type: 'string', defaultValue: 'לקוח חדש' },
    { name: 'location', type: 'string', defaultValue: 'כתובת' },
  ],
});
