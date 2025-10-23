import React from 'react';
import './NotFound.css';

function NotFound() {
  return (
    <div className="not-found-container">
      <h1>404</h1>
      <p>Oops! The link you're looking for doesn't exist.</p>
      <a href="/">Go back to the homepage</a>
    </div>
  );
}

export default NotFound;