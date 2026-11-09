import React, { useState } from "react";
import "./LanguageModal.css";

const LANGS = [
  { code: "EN", label: "English (India)", flag: "🇮🇳" },
  { code: "EN", label: "English (US)", flag: "🇺🇸" },
  { code: "EN", label: "English (UK)", flag: "🇬🇧" },
  { code: "HI", label: "Hindi", flag: "🇮🇳" },
];

const LanguageModal = ({ open, current, onClose, onSave }) => {
  const [sel, setSel] = useState(current || LANGS[0]);

  if (!open) return null;

  return (
    <div className="langOverlay" onClick={onClose}>
      <div className="langModal" onClick={(e) => e.stopPropagation()}>
        <h3>Select language</h3>

        <div className="langList">
          {LANGS.map((l) => (
            <label key={l.code + l.flag} className={`langItem ${sel.flag===l.flag && sel.code===l.code ? 'active' : ''}`}>
              <input
                type="radio"
                name="language"
                checked={sel.flag===l.flag && sel.code===l.code}
                onChange={() => setSel(l)}
              />
              <span className="langFlag">{l.flag}</span>
              <span className="langLabel">{l.label} ({l.code})</span>
            </label>
          ))}
        </div>

        <div className="langActions">
          <button className="langBtn" onClick={onClose}>Cancel</button>
          <button
            className="langBtn langSave"
            onClick={() => {
              onSave(sel);
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

export default LanguageModal;
