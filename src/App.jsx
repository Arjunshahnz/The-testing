import { useMemo, useState } from 'react';
import {
  articles,
  categories,
  followedPlayers as initialFollowedPlayers,
  followedTeams as initialFollowedTeams,
  scheduleDays,
  sportsOptions,
  suggestedPlayers,
} from './data.js';

const pages = ['Feed', 'Schedule', 'Players'];
const sportsStorageKey = 'fieldwatch:selected-sports';

function getSavedSports() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const savedSports = JSON.parse(window.localStorage.getItem(sportsStorageKey) ?? '[]');
    return Array.isArray(savedSports) ? savedSports : [];
  } catch {
    return [];
  }
}

function App() {
  const [activePage, setActivePage] = useState('Feed');
  const [selectedSports, setSelectedSports] = useState(getSavedSports);
  const [showOnboarding, setShowOnboarding] = useState(() => getSavedSports().length === 0);
  const [followingTeams, setFollowingTeams] = useState(initialFollowedTeams);
  const [followingPlayers, setFollowingPlayers] = useState(initialFollowedPlayers);
  const [watchlist, setWatchlist] = useState([]);

  const playerDirectory = useMemo(() => {
    const articleTargets = articles
      .map((article) => article.watchlistTarget)
      .filter((target) => target?.type === 'player')
      .map((target) => ({
        id: `article-${target.name}`,
        name: target.name,
        team: target.team,
        role: target.role,
        note: target.note,
        metric: target.metric,
      }));

    return uniquePlayers([...followingPlayers, ...suggestedPlayers, ...articleTargets]);
  }, [followingPlayers]);

  const isFollowing = (item) => {
    if (!item) {
      return false;
    }

    if (item.type === 'team') {
      return followingTeams.includes(item.name);
    }

    return followingPlayers.some((player) => player.name === item.name);
  };

  const isWatchlisted = (item) => {
    if (!item) {
      return false;
    }

    return watchlist.some((watchlistItem) => watchlistItem.id === getWatchlistId(item));
  };

  const addToWatchlist = (item) => {
    const watchlistItem = normalizeWatchlistItem(item);

    if (!watchlistItem || isFollowing(watchlistItem) || isWatchlisted(watchlistItem)) {
      return;
    }

    setWatchlist((currentWatchlist) => [...currentWatchlist, watchlistItem]);
  };

  const followTeam = (teamName) => {
    setFollowingTeams((currentTeams) =>
      currentTeams.includes(teamName) ? currentTeams : [...currentTeams, teamName],
    );
  };

  const followPlayer = (player) => {
    setFollowingPlayers((currentPlayers) =>
      currentPlayers.some((currentPlayer) => currentPlayer.name === player.name)
        ? currentPlayers
        : [...currentPlayers, player],
    );
    setWatchlist((currentWatchlist) =>
      currentWatchlist.filter((item) => item.id !== getWatchlistId({ type: 'player', name: player.name })),
    );
  };

  const moveToFollowing = (item) => {
    if (item.type === 'team') {
      followTeam(item.name);
    } else {
      followPlayer(watchlistItemToPlayer(item));
    }

    setWatchlist((currentWatchlist) =>
      currentWatchlist.filter((watchlistItem) => watchlistItem.id !== item.id),
    );
  };

  const completeOnboarding = () => {
    window.localStorage.setItem(sportsStorageKey, JSON.stringify(selectedSports));
    setActivePage('Feed');
    setShowOnboarding(false);
  };

  if (showOnboarding) {
    return (
      <OnboardingScreen
        selectedSports={selectedSports}
        setSelectedSports={setSelectedSports}
        onContinue={completeOnboarding}
      />
    );
  }

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
          <div className="hero-card" aria-label="Tracked teams and sports">
            <span>Following</span>
            <strong>{followingTeams.length} teams</strong>
            <small>{selectedSports.join(', ')}</small>
          </div>
        </section>

        {activePage === 'Feed' && (
          <FeedPage
            addToWatchlist={addToWatchlist}
            followingTeams={followingTeams}
            isFollowing={isFollowing}
            isWatchlisted={isWatchlisted}
            moveToFollowing={moveToFollowing}
            watchlist={watchlist}
          />
        )}
        {activePage === 'Schedule' && <SchedulePage />}
        {activePage === 'Players' && (
          <PlayersPage
            addToWatchlist={addToWatchlist}
            followPlayer={followPlayer}
            followingPlayers={followingPlayers}
            isFollowing={isFollowing}
            isWatchlisted={isWatchlisted}
            playerDirectory={playerDirectory}
          />
        )}
      </main>
    </div>
  );
}

function OnboardingScreen({ selectedSports, setSelectedSports, onContinue }) {
  const toggleSport = (sport) => {
    setSelectedSports((currentSports) =>
      currentSports.includes(sport)
        ? currentSports.filter((currentSport) => currentSport !== sport)
        : [...currentSports, sport],
    );
  };

  return (
    <main className="onboarding">
      <section className="onboarding-card" aria-labelledby="onboarding-title">
        <a className="brand" href="#onboarding-title" aria-label="Fieldwatch onboarding">
          <span className="brand-mark">F</span>
          <span>Fieldwatch</span>
        </a>
        <div>
          <p className="eyebrow">Pick your sports</p>
          <h1 id="onboarding-title">Choose what Fieldwatch should track first.</h1>
          <p>
            Select one or more sports to personalize the feed. You can keep it focused or follow
            the whole board.
          </p>
        </div>

        <div className="sport-grid" aria-label="Sport choices">
          {sportsOptions.map((sport) => (
            <button
              className={selectedSports.includes(sport) ? 'sport-card selected' : 'sport-card'}
              key={sport}
              onClick={() => toggleSport(sport)}
              type="button"
            >
              <span>{sport}</span>
              <small>{selectedSports.includes(sport) ? 'Selected' : 'Tap to choose'}</small>
            </button>
          ))}
        </div>

        <button
          className="primary-action"
          disabled={selectedSports.length === 0}
          onClick={onContinue}
          type="button"
        >
          Continue to Feed
        </button>
      </section>
    </main>
  );
}

function FeedPage({
  addToWatchlist,
  followingTeams,
  isFollowing,
  isWatchlisted,
  moveToFollowing,
  watchlist,
}) {
  const [activeTeam, setActiveTeam] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredArticles = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .filter((article) => activeTeam === 'All' || article.team === activeTeam)
      .filter((article) => activeCategory === 'All' || article.category === activeCategory);
  }, [activeCategory, activeTeam]);

  return (
    <section className="feed-layout" aria-labelledby="feed-title">
      <div className="page-grid">
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
              {['All', ...followingTeams].map((team) => (
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
                <div className="action-row">
                  <a href={article.url} rel="noreferrer" target="_blank">
                    Read more
                  </a>
                  <WatchlistButton
                    item={article.watchlistTarget}
                    onAdd={addToWatchlist}
                    isFollowing={isFollowing}
                    isWatchlisted={isWatchlisted}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <WatchlistSidebar watchlist={watchlist} moveToFollowing={moveToFollowing} />
    </section>
  );
}

function WatchlistSidebar({ watchlist, moveToFollowing }) {
  return (
    <aside className="watchlist-panel" aria-labelledby="watchlist-title">
      <div>
        <p className="eyebrow">Scouting list</p>
        <h2 id="watchlist-title">Watchlist</h2>
      </div>

      {watchlist.length === 0 ? (
        <div className="watchlist-empty">
          <p>Add teams or players from stories and player cards before following them.</p>
        </div>
      ) : (
        <div className="watchlist-items">
          {watchlist.map((item) => (
            <article className="watchlist-item" key={item.id}>
              <span>{item.type}</span>
              <strong>{item.name}</strong>
              <p>{item.team ?? item.note}</p>
              <button onClick={() => moveToFollowing(item)} type="button">
                Move to Following
              </button>
            </article>
          ))}
        </div>
      )}
    </aside>
  );
}

function SchedulePage() {
  const todayIso = getTodayIso();
  const totalMatches = scheduleDays.reduce((total, day) => total + day.matches.length, 0);

  return (
    <section className="page-grid" aria-labelledby="schedule-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Monday to Sunday</p>
          <h2 id="schedule-title">Schedule</h2>
        </div>
        <span className="count">{totalMatches} matches this week</span>
      </div>

      <div className="calendar-grid" aria-label="Weekly calendar schedule">
        {scheduleDays.map((day) => (
          <section
            className={day.isoDate === todayIso ? 'calendar-day today' : 'calendar-day'}
            key={day.key}
            aria-labelledby={`${day.key}-heading`}
          >
            <header className="calendar-day-header">
              <span>{day.label}</span>
              <strong id={`${day.key}-heading`}>{day.date}</strong>
            </header>

            <div className="calendar-matches">
              {day.matches.length > 0 ? (
                day.matches.map((match) => (
                  <article className="calendar-match-card" key={match.id}>
                    <span className="status">{match.status}</span>
                    <h3>
                      {match.home} <span>vs</span> {match.away}
                    </h3>
                    <p>{match.venue}</p>
                    <div className="match-action">
                      <strong>{match.score ?? match.kickoff}</strong>
                      <button type="button">Notify</button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="calendar-empty">No matches</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function PlayersPage({
  addToWatchlist,
  followPlayer,
  followingPlayers,
  isFollowing,
  isWatchlisted,
  playerDirectory,
}) {
  const suggestedPlayerCards = suggestedPlayers.filter(
    (player) => !followingPlayers.some((followingPlayer) => followingPlayer.name === player.name),
  );

  return (
    <section className="page-grid" aria-labelledby="players-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Player watchlist</p>
          <h2 id="players-title">Players</h2>
        </div>
        <span className="count">{followingPlayers.length + suggestedPlayerCards.length} players</span>
      </div>

      <PlayerSearch
        addToWatchlist={addToWatchlist}
        isFollowing={isFollowing}
        isWatchlisted={isWatchlisted}
        players={playerDirectory}
      />
      <PlayerSection
        title="Followed players"
        players={followingPlayers}
        addToWatchlist={addToWatchlist}
        followPlayer={followPlayer}
        isFollowing={isFollowing}
        isWatchlisted={isWatchlisted}
      />
      <PlayerSection
        title="Suggested players"
        players={suggestedPlayerCards}
        addToWatchlist={addToWatchlist}
        followPlayer={followPlayer}
        isFollowing={isFollowing}
        isWatchlisted={isWatchlisted}
      />
    </section>
  );
}

function PlayerSearch({ addToWatchlist, isFollowing, isWatchlisted, players }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    return players
      .filter((player) =>
        [player.name, player.team, player.role].some((value) =>
          value?.toLowerCase().includes(normalizedQuery),
        ),
      )
      .slice(0, 6);
  }, [players, query]);

  return (
    <section className="search-panel" aria-label="Optional player search">
      <div>
        <label htmlFor="player-search">Search players</label>
        <p>Optional - type a name, role, or team to find a player quickly.</p>
      </div>
      <div className="search-box">
        <input
          autoComplete="off"
          id="player-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search players..."
          type="search"
          value={query}
        />
        {query && (
          <button className="skip-search" onClick={() => setQuery('')} type="button">
            Skip
          </button>
        )}
        {query && (
          <div className="search-dropdown">
            {results.length > 0 ? (
              results.map((player) => (
                <div className="search-result" key={player.name}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>
                      {player.role} - {player.team}
                    </span>
                  </div>
                  <WatchlistButton
                    item={playerToWatchlistTarget(player)}
                    onAdd={addToWatchlist}
                    isFollowing={isFollowing}
                    isWatchlisted={isWatchlisted}
                  />
                </div>
              ))
            ) : (
              <p>No players found.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function PlayerSection({
  title,
  players,
  addToWatchlist,
  followPlayer,
  isFollowing,
  isWatchlisted,
}) {
  const headingId = `${title.replaceAll(' ', '-')}-title`;

  return (
    <section className="player-section" aria-labelledby={headingId}>
      <h3 id={headingId}>{title}</h3>
      <div className="player-grid">
        {players.map((player) => {
          const watchlistTarget = playerToWatchlistTarget(player);
          const playerIsFollowing = isFollowing(watchlistTarget);

          return (
            <article className="player-card" key={player.name}>
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
              <div className="card-actions">
                <button
                  disabled={playerIsFollowing}
                  onClick={() => followPlayer(player)}
                  type="button"
                >
                  {playerIsFollowing ? 'Following' : 'Follow'}
                </button>
                <WatchlistButton
                  item={watchlistTarget}
                  onAdd={addToWatchlist}
                  isFollowing={isFollowing}
                  isWatchlisted={isWatchlisted}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function WatchlistButton({ item, onAdd, isFollowing, isWatchlisted }) {
  const following = isFollowing(item);
  const watchlisted = isWatchlisted(item);

  return (
    <button
      className="watchlist-button"
      disabled={following || watchlisted}
      onClick={() => onAdd(item)}
      type="button"
    >
      {following ? 'Following' : watchlisted ? 'In watchlist' : 'Add to watchlist'}
    </button>
  );
}

function playerToWatchlistTarget(player) {
  return {
    type: 'player',
    name: player.name,
    team: player.team,
    role: player.role,
    note: player.note,
    metric: player.metric,
  };
}

function watchlistItemToPlayer(item) {
  return {
    id: item.id,
    name: item.name,
    team: item.team ?? 'Independent',
    role: item.role ?? 'Player',
    note: item.note ?? 'Moved from your watchlist',
    metric: item.metric ?? 'Watching',
  };
}

function normalizeWatchlistItem(item) {
  if (!item?.name || !item?.type) {
    return null;
  }

  return {
    ...item,
    id: getWatchlistId(item),
  };
}

function getWatchlistId(item) {
  return `${item.type}:${item.name.toLowerCase().replaceAll(' ', '-')}`;
}

function uniquePlayers(players) {
  return players.filter(
    (player, index, allPlayers) =>
      allPlayers.findIndex((currentPlayer) => currentPlayer.name === player.name) === index,
  );
}

function getTodayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default App;
