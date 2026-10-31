import { useEffect, useState } from 'react';
import http from '../api/http';

export default function Payments() {
  const [rows, setRows] = useState(null);
  useEffect(() => { http.get('/premium/history').then((r) => setRows(r.data)).catch(() => setRows([])); }, []);
  const badge = { PAID: 'success', FAILED: 'danger', CREATED: 'secondary' };

  return (
    <div className="container-xl py-5">
      <h3 className="mb-4">Payment history</h3>
      <div className="cs-card p-2 table-responsive">
        <table className="table cs-table align-middle mb-0">
          <thead><tr><th>Order ID</th><th>Payment ID</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {rows === null && <tr><td colSpan={5} className="text-muted-cs">Loading…</td></tr>}
            {rows?.length === 0 && <tr><td colSpan={5} className="text-muted-cs py-4">No payments yet. Upgrade from the profile menu to get Premium.</td></tr>}
            {rows?.map((r) => (
              <tr key={r.orderId}><td>{r.orderId}</td><td>{r.paymentId || '—'}</td><td>₹{(r.amount / 100).toFixed(2)}</td>
                <td>{new Date(r.date).toLocaleString()}</td><td><span className={`badge text-bg-${badge[r.status]}`}>{r.status}</span></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
