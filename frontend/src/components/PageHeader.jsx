import React from 'react';

export default function PageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  action = null
}) {
  return (
    <div className="page-header">
      <div className="page-header-main">
        {breadcrumbs.length > 0 && (
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {breadcrumbs.map((crumb, idx) => (
                <li key={idx}>
                  {crumb.href ? (
                    <a href={crumb.href}>{crumb.label}</a>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 && (
                    <span className="crumb-divider" aria-hidden="true">/</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}
