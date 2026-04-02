'use client';

import React from 'react';
import { Box, User, Phone, Bookmark } from 'lucide-react';

export default function ContainerDetails({ container }: any) {
  return (
    <div className="mt-6 bg-gray-100 p-4 rounded-xl shadow-inner">
      <h3 className="text-xl font-bold mb-3">פרטי מכולה</h3>

      <div className="space-y-2 text-gray-700">
        <div className="flex items-center gap-2">
          <User className="text-blue-700" /> {container.client_name}
        </div>

        <div className="flex items-center gap-2">
          <Bookmark className="text-purple-600" /> סוג פעולה: {container.action_type}
        </div>

        <div className="flex items-center gap-2">
          <Box className="text-green-700" /> גודל: {container.container_size}
        </div>

        {container.contractor_name && (
          <div className="flex items-center gap-2">
            <User className="text-orange-700" />
            קבלן: {container.contractor_name}
          </div>
        )}

        {container.delivery_address && (
          <div className="flex items-center gap-2">
            <Phone className="text-gray-700" />
            כתובת: {container.delivery_address}
          </div>
        )}

        {container.brain_notes && (
          <div className="text-gray-600 bg-white p-3 rounded-lg shadow-sm">
            הערות: {container.brain_notes}
          </div>
        )}
      </div>
    </div>
  );
}
