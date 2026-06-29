import { useMemo, useState } from 'react';
import {
  articles,
  categories,
  followedPlayers,
  followedTeams,
  scheduleDays,
  suggestedPlayers,
} from './data.js';

const pages = ['Feed', 'Schedule', 'Players'];

function App() {
  const [activePage, setActivePage] = useState('Feed');

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fieldwatch home">
          <span className="brand-mark">F</span>
          <span>Fieldwatch</span>
        </a>

        <nav className="nav" aria-label="Main navigation">
          {pages.map((page) => (
            <button
              className={activePage === page ? 'nav-link active' : 'nav-link'}
              key={page}
              onClick={() => setActivePage(page)}
              type="button"
            >
              {page}
            </button>
          ))}
        </nav>
      </header>

      <main id="top" className="shell">
        <section className="hero">
          <div>
            <p className="eyebrow">Live sports brief</p>
            <h1>Track every story, fixture, and player signal in one calm feed.</h1>
          </div>
          <div className="hero-card" aria-label="Tracked teams">
            <span>Following</span>
            <strong>{followedTeams.length} teams</strong>
          </div>
        </section>

        {activePage === 'Feed' && <FeedPage />}
        {activePage === 'Schedule' && <SchedulePage />}
        {activePage === 'Players' && <PlayersPage />}
      </main>
    </div>
  );
}

function FeedPage() {
  const [activeTeam, setActiveTeam] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .filter((article) => activeTeam === 'All' || article.team === activeTeam)
      .filter((article) => activeCategory === 'All' || article.category === activeCategory);
  }, [activeCategory, activeTeam]);

  return (
    <section className="page-grid" aria-labelledby="feed-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Latest updates</p>
          <h2 id="feed-title">Feed</h2>
        </div>
        <span className="count">{filteredArticles.length} stories</span>
      </div>

      <div className="filter-panel" aria-label="Feed filters">
        <div>
          <span className="filter-label">Teams</span>
          <div className="chip-row">
            {['All', ...followedTeams].map((team) => (
              <button
                className={activeTeam === team ? 'chip selected' : 'chip'}
                key={team}
                onClick={() => setActiveTeam(team)}
                type="button"
              >
                {team}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="filter-label">Categories</span>
          <div className="chip-row">
            {['All', ...categories].map((category) => (
              <button
                className={activeCategory === category ? 'pill selected' : 'pill'}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="article-list">
        {filteredArticles.map((article) => (
          <article className="article-card" key={article.id}>
            <div className="article-meta">
              <span>{article.team}</span>
              <span>{article.category}</span>
              <span>{article.time}</span>
            </div>
            <h3>{article.title}</h3>
            <p>{article.summary}</p>
            <div className="article-footer">
              <span>{article.source}</span>
              <button type="button">Save</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(scheduleDays[0].key);
  const day = scheduleDays.find((item) => item.key === selectedDay) ?? scheduleDays[0];

  return (
    <section className="page-grid" aria-labelledby="schedule-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Next seven days</p>
          <h2 id="schedule-title">Schedule</h2>
        </div>
        <span className="count">{day.matches.length} matches</span>
      </div>

      <div className="day-strip" aria-label="Choose schedule day">
        {scheduleDays.map((item) => (
          <button
            className={selectedDay === item.key ? 'day-tile active' : 'day-tile'}
            key={item.key}
            onClick={() => setSelectedDay(item.key)}
            type="button"
          >
            <span>{item.label}</span>
            <strong>{item.date}</strong>
          </button>
        ))}
      </div>

      <div className="match-list">
        {day.matches.length > 0 ? (
          day.matches.map((match) => (
            <article className="match-card" key={match.id}>
              <div>
                <span className="status">{match.status}</span>
                <h3>
                  {match.home} <span>vs</span> {match.away}
                </h3>
                <p>{match.venue}</p>
              </div>
              <div className="match-action">
                <strong>{match.score ?? match.kickoff}</strong>
                <button type="button">Notify</button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <h3>No matches scheduled</h3>
            <p>Enjoy a quiet day or check back when new fixtures are announced.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function PlayersPage() {
  return (
    <section className="page-grid" aria-labelledby="players-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Player watchlist</p>
          <h2 id="players-title">Players</h2>
        </div>
        <span className="count">{followedPlayers.length + suggestedPlayers.length} players</span>
      </div>

      <PlayerSection title="Followed players" players={followedPlayers} actionLabel="Following" />
      <PlayerSection title="Suggested players" players={suggestedPlayers} actionLabel="Follow" />
    </section>
  );
}

function PlayerSection({ title, players, actionLabel }) {
  return (
    <section className="player-section" aria-labelledby={`${title.replaceAll(' ', '-')}-title`}>
      <h3 id={`${title.replaceAll(' ', '-')}-title`}>{title}</h3>
      <div className="player-grid">
        {players.map((player) => (
          <article className="player-card" key={player.id}>
            <div className="avatar" aria-hidden="true">
              {player.name
                .split(' ')
                .map((part) => part[0])
                .join('')}
            </div>
            <div>
              <h4>{player.name}</h4>
              <p>
                {player.role} - {player.team}
              </p>
            </div>
            <div className="player-note">
              <span>{player.note}</span>
              <strong>{player.metric}</strong>
            </div>
            <button type="button">{actionLabel}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default App;
