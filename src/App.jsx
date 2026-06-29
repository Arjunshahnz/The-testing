import { useMemo, useState } from 'react';

const profileStorageKey = 'fieldwatch:onboarding-profile';
const pages = ['Feed', 'Schedule', 'Players'];

const sports = [
  { id: 'football', label: 'Football', icon: 'FC' },
  { id: 'basketball', label: 'Basketball', icon: 'BB' },
  { id: 'tennis', label: 'Tennis', icon: 'TN' },
  { id: 'f1', label: 'F1', icon: 'F1' },
  { id: 'cricket', label: 'Cricket', icon: 'CR' },
  { id: 'rugby', label: 'Rugby', icon: 'RU' },
  { id: 'nfl', label: 'NFL', icon: 'NFL' },
  { id: 'baseball', label: 'Baseball', icon: 'MLB' },
];

const teams = [
  { id: 'arsenal', name: 'Arsenal', sport: 'Football', league: 'Premier League' },
  { id: 'man-united', name: 'Man United', sport: 'Football', league: 'Premier League' },
  { id: 'warriors', name: 'Golden State Warriors', sport: 'Basketball', league: 'NBA' },
  { id: 'lakers', name: 'Los Angeles Lakers', sport: 'Basketball', league: 'NBA' },
  { id: 'ferrari', name: 'Ferrari', sport: 'F1', league: 'Formula 1' },
  { id: 'india-cricket', name: 'India', sport: 'Cricket', league: 'ICC' },
  { id: 'all-blacks', name: 'All Blacks', sport: 'Rugby', league: 'Test Rugby' },
  { id: 'chiefs', name: 'Kansas City Chiefs', sport: 'NFL', league: 'NFL' },
  { id: 'dodgers', name: 'Los Angeles Dodgers', sport: 'Baseball', league: 'MLB' },
  { id: 'swiatek-team', name: 'Team Swiatek', sport: 'Tennis', league: 'WTA' },
];

const players = [
  {
    id: 'saka',
    name: 'Bukayo Saka',
    position: 'Forward',
    team: 'Arsenal',
    note: 'Creative threat from the right',
  },
  {
    id: 'rice',
    name: 'Declan Rice',
    position: 'Midfielder',
    team: 'Arsenal',
    note: 'Controls Arsenal tempo',
  },
  {
    id: 'curry',
    name: 'Stephen Curry',
    position: 'Guard',
    team: 'Golden State Warriors',
    note: 'Cleared for full practice',
  },
  {
    id: 'kuminga',
    name: 'Jonathan Kuminga',
    position: 'Forward',
    team: 'Golden State Warriors',
    note: 'Camp standout',
  },
  {
    id: 'fernandes',
    name: 'Bruno Fernandes',
    position: 'Midfielder',
    team: 'Man United',
    note: 'Chance creation leader',
  },
  {
    id: 'mainoo',
    name: 'Kobbie Mainoo',
    position: 'Midfielder',
    team: 'Man United',
    note: 'Suggested from United follows',
  },
  {
    id: 'swiatek',
    name: 'Iga Swiatek',
    position: 'Singles',
    team: 'Team Swiatek',
    note: 'Clay court form tracker',
  },
  {
    id: 'mahomes',
    name: 'Patrick Mahomes',
    position: 'Quarterback',
    team: 'Kansas City Chiefs',
    note: 'Camp rhythm reports',
  },
];

const categories = ['All', 'Transfers', 'Injuries', 'Match Reports', 'Press'];

const articles = [
  {
    id: 'a1',
    team: 'Arsenal',
    category: 'Transfers',
    time: '12 min ago',
    publishedAt: '2026-06-29T06:43:00Z',
    headline: 'Arsenal eye late-window midfield depth after friendly win',
    snippet: 'Club scouts are tracking two versatile midfielders as Mikel Arteta keeps rotation options open.',
    url: 'https://example.com/fieldwatch/arsenal-midfield-depth',
    watchlistItem: { type: 'player', id: 'rice', name: 'Declan Rice', meta: 'Arsenal midfielder' },
  },
  {
    id: 'a2',
    team: 'Golden State Warriors',
    category: 'Press',
    time: '28 min ago',
    publishedAt: '2026-06-29T06:27:00Z',
    headline: 'Warriors training notes: Kuminga flashes in transition drills',
    snippet: "Steve Kerr praised the forward's pace and decision-making during an upbeat media session.",
    url: 'https://example.com/fieldwatch/warriors-kuminga-camp',
    watchlistItem: {
      type: 'player',
      id: 'kuminga',
      name: 'Jonathan Kuminga',
      meta: 'Golden State Warriors forward',
    },
  },
  {
    id: 'a3',
    team: 'Man United',
    category: 'Injuries',
    time: '44 min ago',
    publishedAt: '2026-06-29T06:11:00Z',
    headline: 'Man United confirm Martinez returns to full contact work',
    snippet: 'The defender completed a full session and could feature in the next preseason fixture.',
    url: 'https://example.com/fieldwatch/man-united-martinez-training',
    watchlistItem: { type: 'team', id: 'man-united', name: 'Man United', meta: 'Premier League' },
  },
  {
    id: 'a4',
    team: 'Arsenal',
    category: 'Match Reports',
    time: '1 hr ago',
    publishedAt: '2026-06-29T05:55:00Z',
    headline: 'Arsenal 2-1 Lyon: Saka seals sharp preseason comeback',
    snippet: 'Bukayo Saka scored late after Arsenal controlled possession and created the better chances.',
    url: 'https://example.com/fieldwatch/arsenal-lyon-report',
    watchlistItem: { type: 'team', id: 'lyon', name: 'Lyon', meta: 'Football club' },
  },
  {
    id: 'a5',
    team: 'Golden State Warriors',
    category: 'Transfers',
    time: '2 hrs ago',
    publishedAt: '2026-06-29T04:45:00Z',
    headline: 'Golden State add summer-league guard on two-way deal',
    snippet: 'The Warriors moved quickly after a strong workout that impressed front-office staff.',
    url: 'https://example.com/fieldwatch/warriors-two-way-guard',
    watchlistItem: { type: 'team', id: 'lakers', name: 'Los Angeles Lakers', meta: 'NBA rival watch' },
  },
  {
    id: 'a6',
    team: 'Man United',
    category: 'Match Reports',
    time: '3 hrs ago',
    publishedAt: '2026-06-29T03:41:00Z',
    headline: 'United 0-0 Inter: Clean sheet leads staff takeaways',
    snippet: 'Ruben Amorim highlighted compact defending and faster buildup after a controlled draw.',
    url: 'https://example.com/fieldwatch/united-inter-report',
    watchlistItem: { type: 'team', id: 'inter', name: 'Inter', meta: 'Serie A contender' },
  },
];

const week = [
  {
    id: 'mon',
    day: 'Monday',
    date: 'Jun 29',
    isoDate: '2026-06-29',
    matches: [
      {
        id: 'm1',
        teams: 'Arsenal vs Lyon',
        score: '2 - 1',
        league: 'Club Friendly',
        venue: 'Emirates Stadium',
      },
      {
        id: 'm2',
        teams: 'Man United vs Inter',
        score: '0 - 0',
        league: 'Club Friendly',
        venue: 'Old Trafford',
      },
    ],
  },
  {
    id: 'tue',
    day: 'Tuesday',
    date: 'Jun 30',
    isoDate: '2026-06-30',
    matches: [
      {
        id: 'm3',
        teams: 'Warriors vs Lakers',
        kickoff: '7:30 PM',
        league: 'NBA Summer Showcase',
        venue: 'Chase Center',
      },
    ],
  },
  {
    id: 'wed',
    day: 'Wednesday',
    date: 'Jul 1',
    isoDate: '2026-07-01',
    matches: [
      {
        id: 'm4',
        teams: 'Arsenal vs Benfica',
        kickoff: '6:00 PM',
        league: 'Club Friendly',
        venue: 'Estadio da Luz',
      },
    ],
  },
  {
    id: 'thu',
    day: 'Thursday',
    date: 'Jul 2',
    isoDate: '2026-07-02',
    matches: [
      {
        id: 'm5',
        teams: 'Man United vs Ajax',
        kickoff: '8:15 PM',
        league: 'Club Friendly',
        venue: 'Johan Cruyff Arena',
      },
    ],
  },
  {
    id: 'fri',
    day: 'Friday',
    date: 'Jul 3',
    isoDate: '2026-07-03',
    matches: [
      {
        id: 'm6',
        teams: 'Warriors vs Nuggets',
        kickoff: '8:00 PM',
        league: 'NBA Summer Showcase',
        venue: 'Ball Arena',
      },
    ],
  },
  {
    id: 'sat',
    day: 'Saturday',
    date: 'Jul 4',
    isoDate: '2026-07-04',
    matches: [
      {
        id: 'm7',
        teams: 'Arsenal vs Barcelona',
        kickoff: '4:30 PM',
        league: 'Club Friendly',
        venue: 'SoFi Stadium',
      },
      {
        id: 'm8',
        teams: 'Man United vs Milan',
        kickoff: '9:00 PM',
        league: 'Club Friendly',
        venue: 'MetLife Stadium',
      },
    ],
  },
  {
    id: 'sun',
    day: 'Sunday',
    date: 'Jul 5',
    isoDate: '2026-07-05',
    matches: [],
  },
];

const defaultProfile = {
  sports: [],
  teams: [],
  players: [],
};

function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [activePage, setActivePage] = useState('Feed');
  const [watchlist, setWatchlist] = useState([]);

  const hasCompletedOnboarding = profile.sports.length > 0 && profile.teams.length > 0;

  const followedTeamNames = profile.teams.map((team) => team.name);
  const followedPlayerIds = profile.players.map((player) => player.id);

  const updateProfile = (updater) => {
    setProfile((currentProfile) => {
      const nextProfile = updater(currentProfile);
      saveProfile(nextProfile);
      return nextProfile;
    });
  };

  const completeOnboarding = (nextProfile) => {
    saveProfile(nextProfile);
    setProfile(nextProfile);
    setActivePage('Feed');
  };

  const addToWatchlist = (item) => {
    if (!item || isFollowingItem(item, profile) || watchlist.some((entry) => entry.id === item.id)) {
      return;
    }

    setWatchlist((currentWatchlist) => [...currentWatchlist, item]);
  };

  const removeFromWatchlist = (itemId) => {
    setWatchlist((currentWatchlist) => currentWatchlist.filter((item) => item.id !== itemId));
  };

  const followItem = (item) => {
    updateProfile((currentProfile) => {
      if (item.type === 'team') {
        const team = teams.find((teamOption) => teamOption.id === item.id) ?? {
          id: item.id,
          name: item.name,
          sport: 'Football',
          league: item.meta,
        };

        if (currentProfile.teams.some((followedTeam) => followedTeam.id === team.id)) {
          return currentProfile;
        }

        return { ...currentProfile, teams: [...currentProfile.teams, team] };
      }

      const player = players.find((playerOption) => playerOption.id === item.id) ?? {
        id: item.id,
        name: item.name,
        position: 'Player',
        team: item.meta,
        note: 'Added from watchlist',
      };

      if (currentProfile.players.some((followedPlayer) => followedPlayer.id === player.id)) {
        return currentProfile;
      }

      return { ...currentProfile, players: [...currentProfile.players, player] };
    });
    removeFromWatchlist(item.id);
  };

  if (!hasCompletedOnboarding) {
    return <OnboardingFlow initialProfile={profile} onComplete={completeOnboarding} />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fieldwatch home">
          <span className="brand-mark">F</span>
          <span>Fieldwatch</span>
        </a>

        <nav className="nav-tabs" aria-label="Main navigation">
          {pages.map((page) => (
            <button
              className={activePage === page ? 'nav-tab active' : 'nav-tab'}
              key={page}
              onClick={() => setActivePage(page)}
              type="button"
            >
              {page}
            </button>
          ))}
        </nav>
      </header>

      <main id="top" className="app-shell">
        <section className="hero">
          <p className="eyebrow">Fieldwatch</p>
          <h1>Sports news, fixtures, and player signals tuned to your follows.</h1>
          <p>{profile.sports.map((sport) => sport.label).join(', ')}</p>
        </section>

        {activePage === 'Feed' && (
          <FeedPage
            addToWatchlist={addToWatchlist}
            followedTeamNames={followedTeamNames}
            onFollowItem={followItem}
            onRemoveWatchlistItem={removeFromWatchlist}
            profile={profile}
            watchlist={watchlist}
          />
        )}
        {activePage === 'Schedule' && <SchedulePage />}
        {activePage === 'Players' && (
          <PlayersPage
            addToWatchlist={addToWatchlist}
            followedPlayerIds={followedPlayerIds}
            profile={profile}
            updateProfile={updateProfile}
            watchlist={watchlist}
          />
        )}
      </main>
    </div>
  );
}

function OnboardingFlow({ initialProfile, onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState(initialProfile.sports);
  const [selectedTeams, setSelectedTeams] = useState(initialProfile.teams);
  const [selectedPlayers, setSelectedPlayers] = useState(initialProfile.players);

  const canGoNext = step === 1 ? selectedSports.length > 0 : selectedTeams.length > 0;

  const finish = () => {
    onComplete({
      sports: selectedSports,
      teams: selectedTeams,
      players: selectedPlayers,
    });
  };

  return (
    <main className="onboarding-screen">
      <section className="onboarding-panel">
        <div className="onboarding-header">
          <a className="brand" href="#welcome" aria-label="Fieldwatch welcome">
            <span className="brand-mark">F</span>
            <span>Fieldwatch</span>
          </a>
          <div className="step-indicator" aria-label={`Step ${step} of 3`}>
            <span className={step === 1 ? 'active' : ''}>1</span>
            <span className={step === 2 ? 'active' : ''}>2</span>
            <span className={step === 3 ? 'active' : ''}>3</span>
          </div>
        </div>

        <div className="onboarding-copy" id="welcome">
          <p className="eyebrow">Welcome</p>
          <h1>{getStepTitle(step)}</h1>
          <p>{getStepText(step)}</p>
        </div>

        {step === 1 && (
          <SportPicker selectedSports={selectedSports} setSelectedSports={setSelectedSports} />
        )}
        {step === 2 && (
          <SelectionSearch
            items={teams}
            label="Search teams"
            placeholder="Try Arsenal, Warriors, Chiefs..."
            selectedItems={selectedTeams}
            setSelectedItems={setSelectedTeams}
            type="team"
          />
        )}
        {step === 3 && (
          <SelectionSearch
            items={players}
            label="Search players"
            optional
            placeholder="Try Saka, Curry, Mahomes..."
            selectedItems={selectedPlayers}
            setSelectedItems={setSelectedPlayers}
            type="player"
          />
        )}

        <div className="onboarding-actions">
          {step > 1 && (
            <button className="secondary-button" onClick={() => setStep((current) => current - 1)} type="button">
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              className="primary-button"
              disabled={!canGoNext}
              onClick={() => setStep((current) => current + 1)}
              type="button"
            >
              Continue
            </button>
          ) : (
            <button className="primary-button" onClick={finish} type="button">
              Get started
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function SportPicker({ selectedSports, setSelectedSports }) {
  const toggleSport = (sport) => {
    setSelectedSports((currentSports) =>
      currentSports.some((currentSport) => currentSport.id === sport.id)
        ? currentSports.filter((currentSport) => currentSport.id !== sport.id)
        : [...currentSports, sport],
    );
  };

  return (
    <div className="sport-grid" aria-label="Sports">
      {sports.map((sport) => (
        <button
          className={
            selectedSports.some((selectedSport) => selectedSport.id === sport.id)
              ? 'sport-card selected'
              : 'sport-card'
          }
          key={sport.id}
          onClick={() => toggleSport(sport)}
          type="button"
        >
          <span className="sport-icon">{sport.icon}</span>
          <span>{sport.label}</span>
        </button>
      ))}
    </div>
  );
}

function SelectionSearch({
  items,
  label,
  optional = false,
  placeholder,
  selectedItems,
  setSelectedItems,
  type,
}) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const results = normalizedQuery
    ? items
        .filter((item) => {
          const searchableText =
            type === 'team'
              ? `${item.name} ${item.sport} ${item.league}`
              : `${item.name} ${item.position} ${item.team}`;

          return searchableText.toLowerCase().includes(normalizedQuery);
        })
        .filter((item) => !selectedItems.some((selectedItem) => selectedItem.id === item.id))
        .slice(0, 6)
    : [];

  const addItem = (item) => {
    setSelectedItems((currentItems) => [...currentItems, item]);
    setQuery('');
  };

  const removeItem = (itemId) => {
    setSelectedItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  };

  return (
    <div className="selection-search">
      <label htmlFor={`${type}-search`}>
        {label}
        {optional && <span> Optional</span>}
      </label>
      <div className="search-input-wrap">
        <input
          autoComplete="off"
          id={`${type}-search`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={query}
        />
        {query && (
          <div className="dropdown" role="listbox">
            {results.length > 0 ? (
              results.map((item) => (
                <button key={item.id} onClick={() => addItem(item)} type="button">
                  <strong>{item.name}</strong>
                  <span>{type === 'team' ? `${item.sport} - ${item.league}` : `${item.position} - ${item.team}`}</span>
                </button>
              ))
            ) : (
              <p>No results found</p>
            )}
          </div>
        )}
      </div>
      <div className="selected-row" aria-label={`Selected ${type}s`}>
        {selectedItems.length > 0 ? (
          selectedItems.map((item) => (
            <button key={item.id} onClick={() => removeItem(item.id)} type="button">
              {item.name} <span>Remove</span>
            </button>
          ))
        ) : (
          <p>{optional ? 'Skip this step or add a player.' : 'Search above to add at least one.'}</p>
        )}
      </div>
    </div>
  );
}

function FeedPage({
  addToWatchlist,
  followedTeamNames,
  onFollowItem,
  onRemoveWatchlistItem,
  profile,
  watchlist,
}) {
  const [activeTeam, setActiveTeam] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredArticles = useMemo(() => {
    return [...articles]
      .sort((first, second) => new Date(second.publishedAt) - new Date(first.publishedAt))
      .filter((article) => activeTeam === 'All' || article.team === activeTeam)
      .filter((article) => activeCategory === 'All' || article.category === activeCategory);
  }, [activeCategory, activeTeam]);

  return (
    <section className="page feed-page">
      <div className="feed-main">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Latest news</p>
            <h2>Feed</h2>
          </div>
          <span>{filteredArticles.length} stories</span>
        </div>

        <div className="filter-panel">
          <div>
            <p>Teams</p>
            <div className="chip-row">
              {['All', ...followedTeamNames].map((teamName) => (
                <button
                  className={activeTeam === teamName ? 'chip active' : 'chip'}
                  key={teamName}
                  onClick={() => setActiveTeam(teamName)}
                  type="button"
                >
                  {teamName}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p>Categories</p>
            <div className="chip-row">
              {categories.map((category) => (
                <button
                  className={activeCategory === category ? 'pill active' : 'pill'}
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

        <div className="news-list">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <article className="news-card" key={article.id}>
                <div className="news-meta">
                  <strong>{article.team}</strong>
                  <span className="category-badge">{article.category}</span>
                  <span>{article.time}</span>
                </div>
                <h3>{article.headline}</h3>
                <p>{article.snippet}</p>
                <div className="news-actions">
                  <a href={article.url} rel="noreferrer" target="_blank">
                    Read article -&gt;
                  </a>
                  <WatchlistButton
                    item={article.watchlistItem}
                    onAdd={addToWatchlist}
                    profile={profile}
                    watchlist={watchlist}
                  />
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">No stories match these filters.</div>
          )}
        </div>
      </div>

      <WatchlistSidebar
        onFollowItem={onFollowItem}
        onRemoveItem={onRemoveWatchlistItem}
        watchlist={watchlist}
      />
    </section>
  );
}

function WatchlistSidebar({ onFollowItem, onRemoveItem, watchlist }) {
  return (
    <aside className="watchlist-sidebar" aria-label="Watchlist">
      <div className="watchlist-heading">
        <h2>Watchlist</h2>
        <span>{watchlist.length}</span>
      </div>

      {watchlist.length === 0 ? (
        <p className="watchlist-empty">Nothing added yet</p>
      ) : (
        <div className="watchlist-list">
          {watchlist.map((item) => (
            <article className="watchlist-item" key={item.id}>
              <button
                aria-label={`Remove ${item.name}`}
                className="remove-button"
                onClick={() => onRemoveItem(item.id)}
                type="button"
              >
                X
              </button>
              <span>{item.type}</span>
              <strong>{item.name}</strong>
              <p>{item.meta}</p>
              <button className="follow-button" onClick={() => onFollowItem(item)} type="button">
                Follow
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

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">This week</p>
          <h2>Schedule</h2>
        </div>
      </div>

      <div className="calendar" aria-label="Weekly schedule">
        {week.map((day) => (
          <section className={day.isoDate === todayIso ? 'calendar-day today' : 'calendar-day'} key={day.id}>
            <header>
              <span>{day.day}</span>
              <strong>{day.date}</strong>
            </header>

            <div className="match-stack">
              {day.matches.length > 0 ? (
                day.matches.map((match) => (
                  <article className="match-card" key={match.id}>
                    <h3>{match.teams}</h3>
                    <strong>{match.score ?? match.kickoff}</strong>
                    <p>{match.league}</p>
                    <span>{match.venue}</span>
                  </article>
                ))
              ) : (
                <p className="no-matches">No matches</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function PlayersPage({ addToWatchlist, followedPlayerIds, profile, updateProfile, watchlist }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const followedPlayers = profile.players;
  const suggestedPlayers = players.filter((player) => !followedPlayerIds.includes(player.id)).slice(0, 6);
  const searchResults = normalizedQuery
    ? players
        .filter((player) =>
          `${player.name} ${player.position} ${player.team}`.toLowerCase().includes(normalizedQuery),
        )
        .slice(0, 6)
    : [];

  const followPlayer = (player) => {
    updateProfile((currentProfile) => {
      if (currentProfile.players.some((followedPlayer) => followedPlayer.id === player.id)) {
        return currentProfile;
      }

      return { ...currentProfile, players: [...currentProfile.players, player] };
    });
  };

  return (
    <section className="page players-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Player tracking</p>
          <h2>Players</h2>
        </div>
      </div>

      <div className="player-search">
        <label htmlFor="player-finder">Find players</label>
        <input
          autoComplete="off"
          id="player-finder"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by player, team, or position"
          type="search"
          value={query}
        />
        {query && (
          <div className="player-dropdown">
            {searchResults.length > 0 ? (
              searchResults.map((player) => (
                <div className="player-result" key={player.id}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>{player.position} - {player.team}</span>
                  </div>
                  <div className="result-actions">
                    <button onClick={() => followPlayer(player)} type="button">
                      {followedPlayerIds.includes(player.id) ? 'Following' : 'Follow'}
                    </button>
                    <WatchlistButton
                      item={playerToWatchlistItem(player)}
                      onAdd={addToWatchlist}
                      profile={profile}
                      watchlist={watchlist}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p>No players found</p>
            )}
          </div>
        )}
      </div>

      <PlayerGrid
        addToWatchlist={addToWatchlist}
        emptyText="Search above to add followed players."
        followedPlayerIds={followedPlayerIds}
        onFollowPlayer={followPlayer}
        players={followedPlayers}
        profile={profile}
        title="Followed players"
        watchlist={watchlist}
      />
      <PlayerGrid
        addToWatchlist={addToWatchlist}
        followedPlayerIds={followedPlayerIds}
        onFollowPlayer={followPlayer}
        players={suggestedPlayers}
        profile={profile}
        title="Suggested players"
        watchlist={watchlist}
      />
    </section>
  );
}

function PlayerGrid({
  addToWatchlist,
  emptyText = 'No players here yet.',
  followedPlayerIds,
  onFollowPlayer,
  players,
  profile,
  title,
  watchlist,
}) {
  return (
    <section className="player-section">
      <h3>{title}</h3>
      {players.length > 0 ? (
        <div className="player-grid">
          {players.map((player) => (
            <article className="player-card" key={player.id}>
              <div className="avatar">{getInitials(player.name)}</div>
              <div>
                <h4>{player.name}</h4>
                <p>{player.position}</p>
                <span>{player.team}</span>
              </div>
              <small>{player.note}</small>
              <div className="card-actions">
                <button onClick={() => onFollowPlayer(player)} type="button">
                  {followedPlayerIds.includes(player.id) ? 'Following' : 'Follow'}
                </button>
                <WatchlistButton
                  item={playerToWatchlistItem(player)}
                  onAdd={addToWatchlist}
                  profile={profile}
                  watchlist={watchlist}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">{emptyText}</div>
      )}
    </section>
  );
}

function WatchlistButton({ item, onAdd, profile, watchlist }) {
  const isFollowing = isFollowingItem(item, profile);
  const isAdded = watchlist.some((entry) => entry.id === item.id);
  const label = isFollowing ? 'Following' : isAdded ? 'In watchlist' : 'Add to watchlist';

  return (
    <button disabled={isFollowing || isAdded} onClick={() => onAdd(item)} type="button">
      {label}
    </button>
  );
}

function loadProfile() {
  if (typeof window === 'undefined') {
    return defaultProfile;
  }

  try {
    const savedProfile = JSON.parse(window.localStorage.getItem(profileStorageKey) ?? 'null');
    if (!savedProfile) {
      return defaultProfile;
    }

    return {
      sports: Array.isArray(savedProfile.sports) ? savedProfile.sports : [],
      teams: Array.isArray(savedProfile.teams) ? savedProfile.teams : [],
      players: Array.isArray(savedProfile.players) ? savedProfile.players : [],
    };
  } catch {
    return defaultProfile;
  }
}

function saveProfile(profile) {
  window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
}

function isFollowingItem(item, profile) {
  if (item.type === 'team') {
    return profile.teams.some((team) => team.id === item.id);
  }

  return profile.players.some((player) => player.id === item.id);
}

function playerToWatchlistItem(player) {
  return {
    type: 'player',
    id: player.id,
    name: player.name,
    meta: `${player.position} - ${player.team}`,
  };
}

function getStepTitle(step) {
  if (step === 1) {
    return 'Pick the sports you want to follow.';
  }

  if (step === 2) {
    return 'Search for teams to follow.';
  }

  return 'Add players now, or skip this step.';
}

function getStepText(step) {
  if (step === 1) {
    return 'Choose one or more sports. Each selection helps Fieldwatch prioritize your feed.';
  }

  if (step === 2) {
    return 'Type a team name and select any clubs or franchises you want in your daily tracker.';
  }

  return 'Players are optional. You can always find and follow more from the Players page.';
}

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

function getTodayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default App;
