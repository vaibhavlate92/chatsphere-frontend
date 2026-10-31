import { useState } from 'react';

export default function PreferenceModal({ onConfirm, onClose }) {
  const [pref, setPref] = useState('BOTH');
  return (
    <div className="modal-cs" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel" role="dialog" aria-modal="true" aria-label="Choose match preference">
        <h4 className="mb-3">Choose Match Preference</h4>
        {[['MALE', 'Male'], ['FEMALE', 'Female'], ['BOTH', 'Both']].map(([v, l]) => (
          <div className="form-check mb-2" key={v}>
            <input className="form-check-input" type="radio" id={`pref-${v}`} checked={pref === v} onChange={() => setPref(v)} />
            <label className="form-check-label" htmlFor={`pref-${v}`}>{l}</label>
          </div>
        ))}
        <div className="d-flex gap-2 mt-4">
          <button className="btn-ghost flex-fill" onClick={onClose}>Cancel</button>
          <button className="btn-grad flex-fill" onClick={() => onConfirm(pref)}>Find Match</button>
        </div>
      </div>
    </div>
  );
}
