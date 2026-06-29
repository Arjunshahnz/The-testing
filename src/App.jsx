import { useMemo, useState } from 'react';

const storageKey = 'fieldwatch:v2-profile';
const navItems = ['Feed', 'Schedule', 'Players'];
const categories = ['All', 'Transfers', 'Injuries', 'Match Reports', 'Press'];

const sports = [
  { id: 'football', label: 'Football' },
  { id: 'basketball', label: 'Basketball' },
  { id: 'tennis', label: 'Tennis' },
  { id: 'f1', label: 'F1' },
  { id: 'cricket', label: 'Cricket' },
  { id: 'rugby', label: 'Rugby' },
  { id: 'nfl', label: 'NFL' },
  { id: 'baseball', label: 'Baseball' },
];

const teamDirectory = [
  { id: 'arsenal', name: 'Arsenal', sport: 'Football', league: 'Premier League' },
  { id: 'man-united', name: 'Man United', sport: 'Football', league: 'Premier League' },
  { id: 'warriors', name: 'Golden State Warriors', sport: 'Basketball', league: 'NBA' },
  { id: 'lakers', name: 'Los Angeles Lakers', sport: 'Basketball', league: 'NBA' },
  { id: 'mclaren', name: 'McLaren', sport: 'F1', league: 'Formula 1' },
  { id: 'india', name: 'India Cricket', sport: 'Cricket', league: 'ICC' },
  { id: 'all-blacks', name: 'All Blacks', sport: 'Rugby', league: 'Test Rugby' },
  { id: 'chiefs', name: 'Kansas City Chiefs', sport: 'NFL', league: 'NFL' },
  { id: 'dodgers', name: 'Los Angeles Dodgers', sport: 'Baseball', league: 'MLB' },
  { id: 'swiatek-camp', name: 'Team Swiatek', sport: 'Tennis', league: 'WTA' },
];

const playerDirectory = [
  {
    id: 'saka',
    name: 'Bukayo Saka',
    position: 'Forward',
    team: 'Arsenal',
    blurb: 'Creating chances from the right side.',
  },
  {
    id: 'rice',
    name: 'Declan Rice',
    position: 'Midfielder',
    team: 'Arsenal',
    blurb: 'Controlling tempo and transitions.',
  },
  {
    id: 'curry',
    name: 'Stephen Curry',
    position: 'Guard',
    team: 'Golden State Warriors',
    blurb: 'Back in full shooting rhythm.',
  },
  {
    id: 'kuminga',
    name: 'Jonathan Kuminga',
    position: 'Forward',
    team: 'Golden State Warriors',
    blurb: 'Trending after a sharp camp session.',
  },
  {
    id: 'fernandes',
    name: 'Bruno Fernandes',
    position: 'Midfielder',
    team: 'Man United',
    blurb: 'Still the main chance creator.',
  },
  {
    id: 'mainoo',
    name: 'Kobbie Mainoo',
    position: 'Midfielder',
    team: 'Man United',
    blurb: 'Suggested from your United follows.',
  },
  {
    id: 'swiatek',
    name: 'Iga Swiatek',
    position: 'Singles',
    team: 'Team Swiatek',
    blurb: 'Major form tracker for tennis fans.',
  },
  {
    id: 'mahomes',
    name: 'Patrick Mahomes',
    position: 'Quarterback',
    team: 'Kansas City Chiefs',
    blurb: 'Camp reports are picking up.',
  },
  {
    id: 'betts',
    name: 'Mookie Betts',
    position: 'Shortstop',
    team: 'Los Angeles Dodgers',
    blurb: 'Multi-position impact watch.',
  },
];

const news = [
  {
    id: 'n1',
    team: 'Arsenal',
    category: 'Transfers',
    timeAgo: '12 min ago',
    publishedAt: '2026-06-29T06:43:00Z',
    headline: 'Arsenal eye late-window midfield depth after friendly win',
    snippet: 'Club scouts are tracking two versatile midfielders as Mikel Arteta keeps rotation options open.',
    url: 'https://example.com/fieldwatch/arsenal-midfield-depth',
    watchItem: { type: 'player', id: 'rice', name: 'Declan Rice', meta: 'Midfielder - Arsenal' },
  },
  {
    id: 'n2',
    team: 'Golden State Warriors',
    category: 'Press',
    timeAgo: '28 min ago',
    publishedAt: '2026-06-29T06:27:00Z',
    headline: 'Warriors training notes: Kuminga flashes in transition drills',
    snippet: "Steve Kerr praised the forward's pace and decision-making during an upbeat media session.",
    url: 'https://example.com/fieldwatch/warriors-kuminga-camp',
    watchItem: { type: 'player', id: 'kuminga', name: 'Jonathan Kuminga', meta: 'Forward - Warriors' },
  },
  {
    id: 'n3',
    team: 'Man United',
    category: 'Injuries',
    timeAgo: '44 min ago',
    publishedAt: '2026-06-29T06:11:00Z',
    headline: 'Man United confirm Martinez returns to full contact work',
    snippet: 'The defender completed a full session and could feature in the next preseason fixture.',
    url: 'https://example.com/fieldwatch/man-united-martinez-training',
    watchItem: { type: 'team', id: 'man-united', name: 'Man United', meta: 'Premier League' },
  },
  {
    id: 'n4',
    team: 'Arsenal',
    category: 'Match Reports',
    timeAgo: '1 hr ago',
    publishedAt: '2026-06-29T05:55:00Z',
    headline: 'Arsenal 2-1 Lyon: Saka seals sharp preseason comeback',
    snippet: 'Bukayo Saka scored late after Arsenal controlled possession and created the better chances.',
    url: 'https://example.com/fieldwatch/arsenal-lyon-report',
    watchItem: { type: 'team', id: 'lyon', name: 'Lyon', meta: 'Football club' },
  },
  {
    id: 'n5',
    team: 'Golden State Warriors',
    category: 'Transfers',
    timeAgo: '2 hrs ago',
    publishedAt: '2026-06-29T04:45:00Z',
    headline: 'Golden State add summer-league guard on two-way deal',
    snippet: 'The Warriors moved quickly after a strong workout that impressed front-office staff.',
    url: 'https://example.com/fieldwatch/warriors-two-way-guard',
    watchItem: { type: 'team', id: 'lakers', name: 'Los Angeles Lakers', meta: 'NBA rival watch' },
  },
  {
    id: 'n6',
    team: 'Man United',
    category: 'Match Reports',
    timeAgo: '3 hrs ago',
    publishedAt: '2026-06-29T03:41:00Z',
    headline: 'United 0-0 Inter: Clean sheet leads staff takeaways',
    snippet: 'Ruben Amorim highlighted compact defending and faster buildup after a controlled draw.',
    url: 'https://example.com/fieldwatch/united-inter-report',
    watchItem: { type: 'team', id: 'inter', name: 'Inter', meta: 'Serie A contender' },
  },
];

const schedule = [
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

const emptyProfile = { sports: [], teams: [], players: [] };

function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [activePage, setActivePage] = useState('Feed');
  const [watchlist, setWatchlist] = useState([]);
  const onboarded = profile.sports.length > 0 && profile.teams.length > 0;

  const saveProfileState = (updater) => {
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
    if (!item || isFollowing(item, profile) || watchlist.some((entry) => entry.id === item.id)) {
      return;
    }

    setWatchlist((currentWatchlist) => [...currentWatchlist, item]);
  };

  const removeFromWatchlist = (itemId) => {
    setWatchlist((currentWatchlist) => currentWatchlist.filter((item) => item.id !== itemId));
  };

  const followFromWatchlist = (item) => {
    saveProfileState((currentProfile) => followItemInProfile(item, currentProfile));
    removeFromWatchlist(item.id);
  };

  const followPlayer = (player) => {
    saveProfileState((currentProfile) => followPlayerInProfile(player, currentProfile));
  };

  if (!onboarded) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  const followedTeamNames = profile.teams.map((team) => team.name);
  const followedPlayerIds = profile.players.map((player) => player.id);

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fieldwatch home">
          <span className="brand-mark">F</span>
          <span>Fieldwatch</span>
        </a>
        <nav className="nav-tabs" aria-label="Main navigation">
          {navItems.map((page) => (
            <button
              className={activePage === page ? 'nav-tab is-active' : 'nav-tab'}
              key={page}
              onClick={() => setActivePage(page)}
              type="button"
            >
              {page}
            </button>
          ))}
        </nav>
      </header>

      <main className="shell" id="top">
        <section className="hero">
          <p className="eyebrow">Fieldwatch</p>
          <h1>Track the sports stories, fixtures, and players that matter to you.</h1>
          <p>{profile.sports.map((sport) => sport.label).join(', ')}</p>
        </section>

        {activePage === 'Feed' && (
          <Feed
            followedTeamNames={followedTeamNames}
            onAddWatchlist={addToWatchlist}
            onFollowWatchlist={followFromWatchlist}
            onRemoveWatchlist={removeFromWatchlist}
            profile={profile}
            watchlist={watchlist}
          />
        )}
        {activePage === 'Schedule' && <Schedule />}
        {activePage === 'Players' && (
          <Players
            followedPlayerIds={followedPlayerIds}
            onAddWatchlist={addToWatchlist}
            onFollowPlayer={followPlayer}
            profile={profile}
            watchlist={watchlist}
          />
        )}
      </main>
    </div>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  const canContinue = step === 1 ? selectedSports.length > 0 : selectedTeams.length > 0;

  const getStarted = () => {
    onComplete({ sports: selectedSports, teams: selectedTeams, players: selectedPlayers });
  };

  return (
    <main className="onboarding-screen">
      <section className="welcome-card">
        <div className="welcome-top">
          <a className="brand" href="#welcome-title" aria-label="Fieldwatch welcome">
            <span className="brand-mark">F</span>
            <span>Fieldwatch</span>
          </a>
          <div className="steps" aria-label={`Step ${step} of 3`}>
            {[1, 2, 3].map((stepNumber) => (
              <span className={step === stepNumber ? 'is-active' : ''} key={stepNumber}>
                {stepNumber}
              </span>
            ))}
          </div>
        </div>

        <div className="welcome-copy">
          <p className="eyebrow">Welcome</p>
          <h1 id="welcome-title">{onboardingTitle(step)}</h1>
          <p>{onboardingText(step)}</p>
        </div>

        {step === 1 && (
          <SportGrid selectedSports={selectedSports} setSelectedSports={setSelectedSports} />
        )}
        {step === 2 && (
          <PickerSearch
            items={teamDirectory}
            label="Search teams"
            placeholder="Search Arsenal, Warriors, Chiefs..."
            selectedItems={selectedTeams}
            setSelectedItems={setSelectedTeams}
            type="team"
          />
        )}
        {step === 3 && (
          <PickerSearch
            items={playerDirectory}
            label="Search players"
            optional
            placeholder="Search Saka, Curry, Mahomes..."
            selectedItems={selectedPlayers}
            setSelectedItems={setSelectedPlayers}
            type="player"
          />
        )}

        <div className="welcome-actions">
          {step > 1 && (
            <button className="button secondary" onClick={() => setStep((current) => current - 1)} type="button">
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              className="button primary"
              disabled={!canContinue}
              onClick={() => setStep((current) => current + 1)}
              type="button"
            >
              Continue
            </button>
          ) : (
            <button className="button primary" onClick={getStarted} type="button">
              Get started
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function SportGrid({ selectedSports, setSelectedSports }) {
  const toggleSport = (sport) => {
    setSelectedSports((currentSports) =>
      currentSports.some((currentSport) => currentSport.id === sport.id)
        ? currentSports.filter((currentSport) => currentSport.id !== sport.id)
        : [...currentSports, sport],
    );
  };

  return (
    <div className="sport-grid" aria-label="Pick sports">
      {sports.map((sport) => (
        <button
          className={
            selectedSports.some((selectedSport) => selectedSport.id === sport.id)
              ? 'sport-card is-selected'
              : 'sport-card'
          }
          key={sport.id}
          onClick={() => toggleSport(sport)}
          type="button"
        >
          <SportIcon sportId={sport.id} />
          <span>{sport.label}</span>
        </button>
      ))}
    </div>
  );
}

function SportIcon({ sportId }) {
  return (
    <span className={`sport-icon sport-icon-${sportId}`} aria-hidden="true">
      <svg viewBox="0 0 32 32" role="img">
        <circle cx="16" cy="16" r="12" />
        {sportId === 'basketball' && (
          <>
            <path d="M4 16h24" />
            <path d="M16 4v24" />
            <path d="M9 7c5 5 5 13 0 18" />
            <path d="M23 7c-5 5-5 13 0 18" />
          </>
        )}
        {sportId === 'football' && (
          <>
            <path d="M16 8l5 4-2 6h-6l-2-6 5-4z" />
            <path d="M7 18l6 0" />
            <path d="M19 18l6 0" />
          </>
        )}
        {sportId === 'tennis' && (
          <>
            <path d="M8 24l16-16" />
            <path d="M20 8c4 4 4 8 0 12s-8 4-12 0" />
          </>
        )}
        {sportId === 'f1' && <path d="M8 11h16M8 16h11M8 21h16" />}
        {sportId === 'cricket' && <path d="M11 24l10-16M20 8l3 2M9 25l4 2" />}
        {sportId === 'rugby' && <path d="M7 16c5-8 13-8 18 0-5 8-13 8-18 0z" />}
        {sportId === 'nfl' && (
          <>
            <path d="M7 16c5-8 13-8 18 0-5 8-13 8-18 0z" />
            <path d="M13 16h6M16 13v6" />
          </>
        )}
        {sportId === 'baseball' && (
          <>
            <path d="M11 6c-2 6-2 14 0 20" />
            <path d="M21 6c2 6 2 14 0 20" />
          </>
        )}
      </svg>
    </span>
  );
}

function PickerSearch({
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
        .filter((item) => searchableText(item, type).toLowerCase().includes(normalizedQuery))
        .filter((item) => !selectedItems.some((selectedItem) => selectedItem.id === item.id))
        .slice(0, 6)
    : [];

  const addItem = (item) => {
    setSelectedItems((currentItems) => [...currentItems, item]);
    setQuery('');
  };

  return (
    <div className="picker">
      <label htmlFor={`${type}-search`}>
        {label}
        {optional && <small>Optional</small>}
      </label>
      <div className="input-wrap">
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
            {results.length ? (
              results.map((item) => (
                <button key={item.id} onClick={() => addItem(item)} type="button">
                  <strong>{item.name}</strong>
                  <span>{itemMeta(item, type)}</span>
                </button>
              ))
            ) : (
              <p>No results found</p>
            )}
          </div>
        )}
      </div>
      <div className="selected-list">
        {selectedItems.length ? (
          selectedItems.map((item) => (
            <button
              key={item.id}
              onClick={() =>
                setSelectedItems((currentItems) =>
                  currentItems.filter((currentItem) => currentItem.id !== item.id),
                )
              }
              type="button"
            >
              {item.name}
              <span>Remove</span>
            </button>
          ))
        ) : (
          <p>{optional ? 'No players selected yet. You can skip this.' : 'Search and select at least one.'}</p>
        )}
      </div>
    </div>
  );
}

function Feed({
  followedTeamNames,
  onAddWatchlist,
  onFollowWatchlist,
  onRemoveWatchlist,
  profile,
  watchlist,
}) {
  const [teamFilter, setTeamFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const sortedNews = useMemo(
    () => [...news].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)),
    [],
  );
  const filteredNews = sortedNews
    .filter((article) => teamFilter === 'All' || article.team === teamFilter)
    .filter((article) => categoryFilter === 'All' || article.category === categoryFilter);

  return (
    <section className="page-view feed-layout">
      <div className="feed-main">
        <PageHeading eyebrow="Latest news" title="Feed" meta={`${filteredNews.length} stories`} />

        <div className="filters" aria-label="Feed filters">
          <div>
            <p>Followed teams</p>
            <div className="chip-row">
              {['All', ...followedTeamNames].map((team) => (
                <button
                  className={teamFilter === team ? 'chip is-active' : 'chip'}
                  key={team}
                  onClick={() => setTeamFilter(team)}
                  type="button"
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p>Categories</p>
            <div className="chip-row">
              {categories.map((category) => (
                <button
                  className={categoryFilter === category ? 'pill is-active' : 'pill'}
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="news-stack">
          {filteredNews.length ? (
            filteredNews.map((article) => (
              <article className="news-card" key={article.id}>
                <div className="news-meta">
                  <strong>{article.team}</strong>
                  <span className="badge">{article.category}</span>
                  <span>{article.timeAgo}</span>
                </div>
                <h3>{article.headline}</h3>
                <p>{article.snippet}</p>
                <div className="news-actions">
                  <a href={article.url} rel="noreferrer" target="_blank">
                    Read article &rarr;
                  </a>
                  <WatchButton
                    item={article.watchItem}
                    onAdd={onAddWatchlist}
                    profile={profile}
                    watchlist={watchlist}
                  />
                </div>
              </article>
            ))
          ) : (
            <div className="empty-card">No stories match these filters.</div>
          )}
        </div>
      </div>

      <Watchlist
        onFollow={onFollowWatchlist}
        onRemove={onRemoveWatchlist}
        watchlist={watchlist}
      />
    </section>
  );
}

function Watchlist({ onFollow, onRemove, watchlist }) {
  return (
    <aside className="watchlist" aria-label="Watchlist">
      <div className="watchlist-head">
        <h2>Watchlist</h2>
        <span>{watchlist.length}</span>
      </div>
      {watchlist.length ? (
        <div className="watchlist-items">
          {watchlist.map((item) => (
            <article className="watchlist-card" key={item.id}>
              <button
                aria-label={`Remove ${item.name}`}
                className="x-button"
                onClick={() => onRemove(item.id)}
                type="button"
              >
                X
              </button>
              <span>{item.type}</span>
              <strong>{item.name}</strong>
              <p>{item.meta}</p>
              <button className="follow-button" onClick={() => onFollow(item)} type="button">
                Follow
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="watchlist-empty">Nothing added yet</p>
      )}
    </aside>
  );
}

function Schedule() {
  const todayIso = getTodayIso();

  return (
    <section className="page-view">
      <PageHeading eyebrow="This week" title="Schedule" />
      <div className="calendar" aria-label="Weekly match calendar">
        {schedule.map((day) => (
          <section className={day.isoDate === todayIso ? 'day-column today' : 'day-column'} key={day.id}>
            <header>
              <span>{day.day}</span>
              <strong>{day.date}</strong>
            </header>
            <div className="match-list">
              {day.matches.length ? (
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

function Players({ followedPlayerIds, onAddWatchlist, onFollowPlayer, profile, watchlist }) {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();
  const followedPlayers = profile.players;
  const suggestedPlayers = playerDirectory
    .filter((player) => !followedPlayerIds.includes(player.id))
    .slice(0, 6);
  const searchResults = normalizedQuery
    ? playerDirectory
        .filter((player) => searchableText(player, 'player').toLowerCase().includes(normalizedQuery))
        .slice(0, 7)
    : [];

  return (
    <section className="page-view players-page">
      <PageHeading eyebrow="Player tracking" title="Players" />
      <div className="player-search">
        <label htmlFor="player-live-search">Search players</label>
        <input
          autoComplete="off"
          id="player-live-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a player by name, position, or team"
          type="search"
          value={query}
        />
        {query && (
          <div className="dropdown player-dropdown" role="listbox">
            {searchResults.length ? (
              searchResults.map((player) => (
                <div className="player-result" key={player.id}>
                  <div>
                    <strong>{player.name}</strong>
                    <span>{player.position} - {player.team}</span>
                  </div>
                  <div className="result-actions">
                    <button onClick={() => onFollowPlayer(player)} type="button">
                      {followedPlayerIds.includes(player.id) ? 'Following' : 'Follow'}
                    </button>
                    <WatchButton
                      item={playerToWatchItem(player)}
                      onAdd={onAddWatchlist}
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

      <PlayerSection
        emptyText="Use search above to follow players."
        followedPlayerIds={followedPlayerIds}
        onAddWatchlist={onAddWatchlist}
        onFollowPlayer={onFollowPlayer}
        players={followedPlayers}
        profile={profile}
        title="Followed players"
        watchlist={watchlist}
      />
      <PlayerSection
        followedPlayerIds={followedPlayerIds}
        onAddWatchlist={onAddWatchlist}
        onFollowPlayer={onFollowPlayer}
        players={suggestedPlayers}
        profile={profile}
        title="Suggested players"
        watchlist={watchlist}
      />
    </section>
  );
}

function PlayerSection({
  emptyText = 'No players to show.',
  followedPlayerIds,
  onAddWatchlist,
  onFollowPlayer,
  players,
  profile,
  title,
  watchlist,
}) {
  return (
    <section className="player-section">
      <h3>{title}</h3>
      {players.length ? (
        <div className="player-grid">
          {players.map((player) => (
            <article className="player-card" key={player.id}>
              <div className="avatar" aria-hidden="true">
                {initials(player.name)}
              </div>
              <div>
                <h4>{player.name}</h4>
                <p>{player.position}</p>
                <span>{player.team}</span>
              </div>
              <small>{player.blurb}</small>
              <div className="card-actions">
                <button onClick={() => onFollowPlayer(player)} type="button">
                  {followedPlayerIds.includes(player.id) ? 'Following' : 'Follow'}
                </button>
                <WatchButton
                  item={playerToWatchItem(player)}
                  onAdd={onAddWatchlist}
                  profile={profile}
                  watchlist={watchlist}
                />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-card">{emptyText}</div>
      )}
    </section>
  );
}

function PageHeading({ eyebrow, meta, title }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {meta && <span>{meta}</span>}
    </div>
  );
}

function WatchButton({ item, onAdd, profile, watchlist }) {
  const alreadyFollowing = isFollowing(item, profile);
  const alreadyWatching = watchlist.some((entry) => entry.id === item.id);

  return (
    <button disabled={alreadyFollowing || alreadyWatching} onClick={() => onAdd(item)} type="button">
      {alreadyFollowing ? 'Following' : alreadyWatching ? 'In watchlist' : 'Add to watchlist'}
    </button>
  );
}

function loadProfile() {
  if (typeof window === 'undefined') {
    return emptyProfile;
  }

  try {
    const storedProfile = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null');
    if (!storedProfile) {
      return emptyProfile;
    }

    return {
      sports: Array.isArray(storedProfile.sports) ? storedProfile.sports : [],
      teams: Array.isArray(storedProfile.teams) ? storedProfile.teams : [],
      players: Array.isArray(storedProfile.players) ? storedProfile.players : [],
    };
  } catch {
    return emptyProfile;
  }
}

function saveProfile(profile) {
  window.localStorage.setItem(storageKey, JSON.stringify(profile));
}

function followItemInProfile(item, profile) {
  if (item.type === 'team') {
    const team = teamDirectory.find((teamOption) => teamOption.id === item.id) ?? {
      id: item.id,
      name: item.name,
      sport: 'Football',
      league: item.meta,
    };

    if (profile.teams.some((followedTeam) => followedTeam.id === team.id)) {
      return profile;
    }

    return { ...profile, teams: [...profile.teams, team] };
  }

  const player = playerDirectory.find((playerOption) => playerOption.id === item.id) ?? {
    id: item.id,
    name: item.name,
    position: 'Player',
    team: item.meta,
    blurb: 'Moved from watchlist.',
  };

  return followPlayerInProfile(player, profile);
}

function followPlayerInProfile(player, profile) {
  if (profile.players.some((followedPlayer) => followedPlayer.id === player.id)) {
    return profile;
  }

  return { ...profile, players: [...profile.players, player] };
}

function isFollowing(item, profile) {
  if (item.type === 'team') {
    return profile.teams.some((team) => team.id === item.id);
  }

  return profile.players.some((player) => player.id === item.id);
}

function playerToWatchItem(player) {
  return {
    id: player.id,
    meta: `${player.position} - ${player.team}`,
    name: player.name,
    type: 'player',
  };
}

function searchableText(item, type) {
  return type === 'team'
    ? `${item.name} ${item.sport} ${item.league}`
    : `${item.name} ${item.position} ${item.team}`;
}

function itemMeta(item, type) {
  return type === 'team' ? `${item.sport} - ${item.league}` : `${item.position} - ${item.team}`;
}

function onboardingTitle(step) {
  if (step === 1) {
    return 'Pick your sports.';
  }

  if (step === 2) {
    return 'Search teams to follow.';
  }

  return 'Add players, or skip for now.';
}

function onboardingText(step) {
  if (step === 1) {
    return 'Choose one or more sports to shape your Fieldwatch experience.';
  }

  if (step === 2) {
    return 'Select the teams you want at the center of your feed and schedule.';
  }

  return 'Player follows are optional. You can always add more from the Players page.';
}

function initials(name) {
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
