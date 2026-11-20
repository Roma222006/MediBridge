import React from 'react';

export function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return (
    <nav className={`tabs-nav ${className}`.trim()} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {Icon && <Icon size={16} strokeWidth={1.75} aria-hidden="true" />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="badge badge-pill badge-neutral" style={{ fontSize: '11px' }}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
