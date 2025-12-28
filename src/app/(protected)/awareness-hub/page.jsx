'use client';

import { useState } from 'react';
import {
  BookOpen,
  Search,
  HeartPulse,
  Brain,
  Shield,
} from 'lucide-react';

export default function AwarenessHubPage() {
  // Placeholder data — later we connect to SQLite
  const [articles] = useState([]);

  // Filter state
  const [category, setCategory] = useState('all');

  return (
    <div className="awareness-page">
      <div className="awareness-container">

        {/* Header */}
        <div className="awareness-header">
          <div className="header-content">
            <h1 className="awareness-title">
              <BookOpen className="title-icon" />
              Awareness Hub
            </h1>
            <p className="awareness-subtitle">
              Learn about health topics, prevention, and wellness
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search articles..."
            className="search-input"
          />
        </div>

        {/* Categories */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            All
          </button>

          <button
            className={`filter-tab ${category === 'heart' ? 'active' : ''}`}
            onClick={() => setCategory('heart')}
          >
            <HeartPulse className="tab-icon" />
            Heart Health
          </button>

          <button
            className={`filter-tab ${category === 'mental' ? 'active' : ''}`}
            onClick={() => setCategory('mental')}
          >
            <Brain className="tab-icon" />
            Mental Health
          </button>

          <button
            className={`filter-tab ${category === 'prevention' ? 'active' : ''}`}
            onClick={() => setCategory('prevention')}
          >
            <Shield className="tab-icon" />
            Prevention
          </button>
        </div>

        {/* Articles */}
        <div className="articles-section">
          {articles.length === 0 ? (
            <div className="empty-state">
              <BookOpen className="empty-icon" />
              <h3 className="empty-title">No Articles Found</h3>
              <p className="empty-text">
                Try adjusting your search or selecting a different category.
              </p>
            </div>
          ) : (
            <div className="articles-grid">
              {articles
                .filter((a) => category === 'all' || a.category === category)
                .map((article) => (
                  <div key={article.id} className="article-card">
                    <h3 className="article-title">{article.title}</h3>
                    <p className="article-summary">{article.summary}</p>
                    <p className="article-category">{article.category}</p>
                  </div>
                ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
