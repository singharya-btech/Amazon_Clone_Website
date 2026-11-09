import React, { useState } from "react";
import "./LocationModal.css";

const LocationModal = ({ open, current, onClose, onSave }) => {
  const [value, setValue] = useState(current || "India");

  if (!open) return null;

  return (
    <div className="locOverlay" onClick={onClose}>
      <div className="locModal" onClick={(e) => e.stopPropagation()}>
        <h3>Choose delivery location</h3>

        <select value={value} onChange={(e) => setValue(e.target.value)}>
          <option>India</option>
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Australia</option>
          <option>Canada</option>
        </select>

        <div className="locActions">
          <button className="locBtn locCancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="locBtn locSave"
            onClick={() => {
              onSave(value);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
