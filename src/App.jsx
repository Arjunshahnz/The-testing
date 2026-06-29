import { useEffect, useMemo, useState } from 'react';

const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const PROFILE_KEY = 'fieldwatch:live-profile';
const SEARCH_DELAY = 350;
const navItems = ['Feed', 'Schedule', 'Players'];
const categories = ['All', 'Upcoming', 'Match Reports', 'Press'];

const sportOptions = [
  { id: 'football', label: 'Football', apiSport: 'Soccer', icon: 'FB' },
  { id: 'basketball', label: 'Basketball', apiSport: 'Basketball', icon: 'BB' },
  { id: 'tennis', label: 'Tennis', apiSport: 'Tennis', icon: 'TN' },
  { id: 'f1', label: 'F1', apiSport: 'Motorsport', icon: 'F1' },
  { id: 'cricket', label: 'Cricket', apiSport: 'Cricket', icon: 'CR' },
  { id: 'rugby', label: 'Rugby', apiSport: 'Rugby', icon: 'RU' },
  { id: 'nfl', label: 'NFL', apiSport: 'American Football', icon: 'NFL' },
  { id: 'baseball', label: 'Baseball', apiSport: 'Baseball', icon: 'MLB' },
];

const featuredLeagues = {
  football: [
    { name: 'English Premier League', fallbackId: '4328' },
    { name: 'Spanish La Liga', fallbackId: '4335' },
    { name: 'German Bundesliga', fallbackId: '4331' },
    { name: 'Italian Serie A', fallbackId: '4332' },
    { name: 'FIFA World Cup', fallbackId: '4429' },
    { name: 'FIFA World Cup 2026', fallbackId: '4429' },
  ],
  basketball: [
    { name: 'NBA', fallbackId: '4387' },
    { name: 'EuroLeague Basketball', fallbackId: '4546' },
  ],
  tennis: [
    { name: 'ATP Tour', fallbackId: '4464' },
    { name: 'WTA Tour', fallbackId: '4465' },
  ],
  f1: [{ name: 'Formula 1', fallbackId: '4370' }],
  cricket: [
    { name: 'Indian Premier League', fallbackId: '4465' },
    { name: 'ICC Cricket World Cup', fallbackId: '4522' },
    { name: 'The Ashes', fallbackId: '4618' },
  ],
  rugby: [
    { name: 'Rugby World Cup', fallbackId: '4428' },
    { name: 'Six Nations Championship', fallbackId: '4474' },
  ],
  nfl: [{ name: 'NFL', fallbackId: '4391' }],
  baseball: [{ name: 'MLB', fallbackId: '4424' }],
};

const fallbackTeams = [
  liveTeam({
    idTeam: '133604',
    strTeam: 'Arsenal',
    strSport: 'Soccer',
    strLeague: 'English Premier League',
  }),
  liveTeam({
    idTeam: '133602',
    strTeam: 'Man United',
    strSport: 'Soccer',
    strLeague: 'English Premier League',
  }),
  liveTeam({
    idTeam: '134865',
    strTeam: 'Golden State Warriors',
    strSport: 'Basketball',
    strLeague: 'NBA',
  }),
];

const emptyProfile = {
  sports: [],
  teams: [],
  players: [],
  timezone: getBrowserTimezone(),
};

function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [activePage, setActivePage] = useState('Feed');
  const [watchlist, setWatchlist] = useState([]);
  const [teamEvents, setTeamEvents] = useState({ upcoming: [], recent: [] });
  const [eventState, setEventState] = useState({ loading: false, error: '' });

  const onboarded = profile.sports.length > 0 && profile.teams.length > 0;

  useEffect(() => {
    if (!onboarded) {
      return;
    }

    let isCurrent = true;
    setEventState({ loading: true, error: '' });

    fetchFollowedTeamEvents(profile.teams)
      .then((events) => {
        if (!isCurrent) {
          return;
        }
        setTeamEvents(events);
        setEventState({ loading: false, error: '' });
      })
      .catch((error) => {
        if (!isCurrent) {
          return;
        }
        setTeamEvents({ upcoming: [], recent: [] });
        setEventState({
          loading: false,
          error: error.message || 'Unable to load live fixtures from TheSportsDB.',
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [onboarded, profile.teams]);

  const updateProfile = (updater) => {
    setProfile((currentProfile) => {
      const nextProfile = updater(currentProfile);
      saveProfile(nextProfile);
      return nextProfile;
    });
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

  const followWatchlistItem = (item) => {
    updateProfile((currentProfile) => followItem(currentProfile, item));
    removeFromWatchlist(item.id);
  };

  const followPlayer = (player) => {
    updateProfile((currentProfile) => addUnique(currentProfile, 'players', player));
  };

  if (!onboarded) {
    return <Onboarding onComplete={(nextProfile) => setAndSaveProfile(nextProfile, setProfile)} />;
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
          <p className="eyebrow">Live from TheSportsDB</p>
          <h1>Track real fixtures, teams, and players in your local time.</h1>
          <p>
            Timezone: <strong>{profile.timezone}</strong>. Following {profile.teams.length} teams
            across {profile.sports.map((sport) => sport.label).join(', ')}.
          </p>
        </section>

        {activePage === 'Feed' && (
          <Feed
            eventState={eventState}
            followedTeamNames={followedTeamNames}
            onAddWatchlist={addToWatchlist}
            onFollowWatchlist={followWatchlistItem}
            onRemoveWatchlist={removeFromWatchlist}
            profile={profile}
            teamEvents={teamEvents}
            watchlist={watchlist}
          />
        )}
        {activePage === 'Schedule' && (
          <Schedule eventState={eventState} events={teamEvents.upcoming} timezone={profile.timezone} />
        )}
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
  const [sports, setSports] = useState([]);
  const [teams, setTeams] = useState(fallbackTeams);
  const [players, setPlayers] = useState([]);
  const [timezone, setTimezone] = useState(getBrowserTimezone());
  const [leagueState, setLeagueState] = useState({ loading: false, error: '', leagues: [] });

  useEffect(() => {
    if (!sports.length) {
      setLeagueState({ loading: false, error: '', leagues: [] });
      return;
    }

    let isCurrent = true;
    setLeagueState({ loading: true, error: '', leagues: visibleLeagueConfigs(sports) });

    fetchLeagueDirectory(sports)
      .then((leagues) => {
        if (isCurrent) {
          setLeagueState({ loading: false, error: '', leagues });
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setLeagueState({
            loading: false,
            error: error.message || 'Unable to load leagues right now.',
            leagues: visibleLeagueConfigs(sports),
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [sports]);

  const canContinue = step === 1 ? sports.length > 0 : teams.length > 0;

  const finish = () => {
    onComplete({ sports, teams, players, timezone });
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
          <p className="eyebrow">Live setup</p>
          <h1 id="welcome-title">{onboardingTitle(step)}</h1>
          <p>{onboardingText(step)}</p>
        </div>

        {step === 1 && (
          <>
            <SportGrid selectedSports={sports} setSelectedSports={setSports} />
            <TimezoneField timezone={timezone} setTimezone={setTimezone} />
          </>
        )}
        {step === 2 && (
          <>
            <LeaguePreview leagueState={leagueState} />
            <LiveSearchPicker
              label="Search teams across all selected sports"
              mode="team"
              onSelect={(team) => setTeams((currentTeams) => addUniqueItem(currentTeams, team))}
              selectedItems={teams}
              setSelectedItems={setTeams}
              sports={sports}
            />
          </>
        )}
        {step === 3 && (
          <LiveSearchPicker
            label="Search players across TheSportsDB"
            mode="player"
            optional
            onSelect={(player) => setPlayers((currentPlayers) => addUniqueItem(currentPlayers, player))}
            selectedItems={players}
            setSelectedItems={setPlayers}
            sports={sports}
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
            <button className="button primary" onClick={finish} type="button">
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
      {sportOptions.map((sport) => (
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
          <SportIcon sport={sport} />
          <span>{sport.label}</span>
        </button>
      ))}
    </div>
  );
}

function TimezoneField({ setTimezone, timezone }) {
  return (
    <div className="timezone-card">
      <div>
        <p className="eyebrow">Timezone detected</p>
        <h3>{timezone}</h3>
        <p>Match times are converted with your browser&apos;s timezone detection.</p>
      </div>
      <label>
        Change timezone
        <input
          onChange={(event) => setTimezone(event.target.value)}
          placeholder="Europe/London"
          type="text"
          value={timezone}
        />
      </label>
    </div>
  );
}

function LeaguePreview({ leagueState }) {
  return (
    <div className="league-panel">
      <div>
        <p className="eyebrow">Major leagues visible</p>
        <h3>Coverage from TheSportsDB</h3>
      </div>
      {leagueState.loading && <p className="notice">Loading live league directory...</p>}
      {leagueState.error && <p className="error-text">{leagueState.error}</p>}
      <div className="league-grid">
        {leagueState.leagues.map((league) => (
          <article className="league-card" key={`${league.sportId}-${league.name}`}>
            <span>{sportLabel(league.sportId)}</span>
            <strong>{league.name}</strong>
            <small>{league.id ? `TheSportsDB ID ${league.id}` : 'Configured fallback'}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function LiveSearchPicker({
  label,
  mode,
  onSelect,
  optional = false,
  selectedItems,
  setSelectedItems,
  sports,
}) {
  const [query, setQuery] = useState('');
  const search = useLiveSearch(query, mode, sports);

  return (
    <div className="picker">
      <label htmlFor={`${mode}-search`}>
        {label}
        {optional && <small>Optional</small>}
      </label>
      <div className="input-wrap">
        <input
          autoComplete="off"
          id={`${mode}-search`}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={mode === 'team' ? 'Try Arsenal, Spain, Lakers...' : 'Try Saka, Messi, Curry...'}
          type="search"
          value={query}
        />
        {query && (
          <SearchDropdown
            error={search.error}
            loading={search.loading}
            mode={mode}
            onSelect={(item) => {
              onSelect(item);
              setQuery('');
            }}
            results={search.results}
          />
        )}
      </div>
      <SelectedItems items={selectedItems} mode={mode} setItems={setSelectedItems} optional={optional} />
    </div>
  );
}

function SearchDropdown({ error, loading, mode, onSelect, results }) {
  return (
    <div className="dropdown" role="listbox">
      {loading && <p className="notice">Searching TheSportsDB...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && results.length === 0 && <p>No live results found</p>}
      {results.map((item) => (
        <button key={item.id} onClick={() => onSelect(item)} type="button">
          <SportIcon sport={sportFromApi(item.sport)} compact />
          <span>
            <strong>{item.name}</strong>
            <small>{itemMeta(item, mode)}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function SelectedItems({ items, mode, optional, setItems }) {
  return (
    <div className="selected-list">
      {items.length ? (
        items.map((item) => (
          <button
            key={item.id}
            onClick={() => setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id))}
            type="button"
          >
            {item.name}
            <span>Remove</span>
          </button>
        ))
      ) : (
        <p>{optional ? `No ${mode}s selected yet. You can skip this.` : `Search and select at least one ${mode}.`}</p>
      )}
    </div>
  );
}

function Feed({
  eventState,
  followedTeamNames,
  onAddWatchlist,
  onFollowWatchlist,
  onRemoveWatchlist,
  profile,
  teamEvents,
  watchlist,
}) {
  const [teamFilter, setTeamFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const recentCards = useMemo(
    () => teamEvents.recent.map((event) => eventToFeedCard(event, profile.timezone)),
    [profile.timezone, teamEvents.recent],
  );
  const upcomingCards = useMemo(
    () => teamEvents.upcoming.map((event) => eventToUpcomingCard(event, profile.timezone)),
    [profile.timezone, teamEvents.upcoming],
  );
  const feedCards = [...upcomingCards, ...recentCards]
    .filter((card) => teamFilter === 'All' || card.team === teamFilter)
    .filter((card) => categoryFilter === 'All' || card.category === categoryFilter)
    .sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));

  return (
    <section className="page-view feed-layout">
      <div className="feed-main">
        <PageHeading eyebrow="Live feed" title="Feed" meta={`${feedCards.length} live items`} />
        <StatusBlock loading={eventState.loading} error={eventState.error} />

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

        <UpcomingStrip
          events={teamEvents.upcoming}
          onAddWatchlist={onAddWatchlist}
          profile={profile}
          watchlist={watchlist}
        />

        <div className="news-stack">
          {feedCards.length ? (
            feedCards.map((card) => (
              <article className="news-card" key={card.id}>
                <div className="news-meta">
                  <strong>{card.team}</strong>
                  <span className="badge">{card.category}</span>
                  <span>{card.timeAgo}</span>
                </div>
                <h3>{card.headline}</h3>
                <p>{card.snippet}</p>
                <div className="news-actions">
                  <a href={card.url} rel="noreferrer" target="_blank">
                    Open event &rarr;
                  </a>
                  <WatchButton item={card.watchItem} onAdd={onAddWatchlist} profile={profile} watchlist={watchlist} />
                </div>
              </article>
            ))
          ) : (
            <div className="empty-card">No live feed items yet. Try following a team from search.</div>
          )}
        </div>
      </div>

      <Watchlist
        onAdd={onAddWatchlist}
        onFollow={onFollowWatchlist}
        onRemove={onRemoveWatchlist}
        profile={profile}
        watchlist={watchlist}
      />
    </section>
  );
}

function UpcomingStrip({ events, onAddWatchlist, profile, watchlist }) {
  const nextEvents = events.slice(0, 4);

  return (
    <section className="upcoming-panel">
      <div>
        <p className="eyebrow">Upcoming events</p>
        <h3>Next fixtures for followed teams</h3>
      </div>
      {nextEvents.length ? (
        <div className="upcoming-grid">
          {nextEvents.map((event) => (
            <article className="upcoming-card" key={event.id}>
              <strong>{event.name}</strong>
              <span>{formatEventDate(event, profile.timezone)}</span>
              <small>{event.league}</small>
              <WatchButton item={eventToWatchItem(event)} onAdd={onAddWatchlist} profile={profile} watchlist={watchlist} />
            </article>
          ))}
        </div>
      ) : (
        <p className="notice">No upcoming live fixtures returned yet.</p>
      )}
    </section>
  );
}

function Watchlist({ onAdd, onFollow, onRemove, profile, watchlist }) {
  return (
    <aside className="watchlist" aria-label="Watchlist">
      <div className="watchlist-head">
        <h2>Watchlist</h2>
        <span>{watchlist.length}</span>
      </div>
      <GlobalWatchlistSearch onAdd={onAdd} profile={profile} watchlist={watchlist} />
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
              {item.type !== 'event' && (
                <button className="follow-button" onClick={() => onFollow(item)} type="button">
                  Follow
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="watchlist-empty">Nothing added yet</p>
      )}
    </aside>
  );
}

function GlobalWatchlistSearch({ onAdd, profile, watchlist }) {
  const [query, setQuery] = useState('');
  const search = useLiveSearch(query, 'all', sportOptions);

  return (
    <div className="watch-search">
      <label htmlFor="watchlist-search">Search everything</label>
      <input
        autoComplete="off"
        id="watchlist-search"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Teams and players across all sports"
        type="search"
        value={query}
      />
      {query && (
        <SearchDropdown
          error={search.error}
          loading={search.loading}
          mode="all"
          onSelect={(item) => {
            onAdd(searchItemToWatchItem(item));
            setQuery('');
          }}
          results={search.results.filter(
            (item) => !isFollowing(searchItemToWatchItem(item), profile) && !watchlist.some((entry) => entry.id === item.id),
          )}
        />
      )}
    </div>
  );
}

function Schedule({ eventState, events, timezone }) {
  const week = getCurrentWeek(timezone);
  const eventsByDay = groupEventsByDay(events, timezone);

  return (
    <section className="page-view">
      <PageHeading eyebrow="Real fixtures" title="Schedule" meta={timezone} />
      <StatusBlock loading={eventState.loading} error={eventState.error} />
      <div className="calendar" aria-label="Weekly match calendar">
        {week.map((day) => {
          const dayEvents = eventsByDay[day.isoDate] ?? [];
          return (
            <section className={day.isToday ? 'day-column today' : 'day-column'} key={day.isoDate}>
              <header>
                <span>{day.dayName}</span>
                <strong>{day.label}</strong>
              </header>
              <div className="match-list">
                {dayEvents.length ? (
                  dayEvents.map((event) => (
                    <article className="match-card" key={event.id}>
                      <h3>{event.name}</h3>
                      <strong>{formatEventTime(event, timezone)}</strong>
                      <p>{event.league}</p>
                      <span>{event.venue || 'Venue TBA'}</span>
                    </article>
                  ))
                ) : (
                  <p className="no-matches">No matches</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function Players({ followedPlayerIds, onAddWatchlist, onFollowPlayer, profile, watchlist }) {
  const [query, setQuery] = useState('');
  const search = useLiveSearch(query, 'player', profile.sports);
  const suggestedPlayers = search.results
    .filter((player) => !followedPlayerIds.includes(player.id))
    .slice(0, 6);

  return (
    <section className="page-view players-page">
      <PageHeading eyebrow="Live player search" title="Players" />
      <div className="player-search">
        <label htmlFor="player-live-search">Search players</label>
        <input
          autoComplete="off"
          id="player-live-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a player by name, team, or sport"
          type="search"
          value={query}
        />
        {query && (
          <SearchDropdown
            error={search.error}
            loading={search.loading}
            mode="player"
            onSelect={(player) => onFollowPlayer(player)}
            results={search.results}
          />
        )}
      </div>

      <PlayerSection
        emptyText="Use search above to follow live players."
        followedPlayerIds={followedPlayerIds}
        onAddWatchlist={onAddWatchlist}
        onFollowPlayer={onFollowPlayer}
        players={profile.players}
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
        title={query ? 'Suggested from search' : 'Suggested players'}
        watchlist={watchlist}
      />
    </section>
  );
}

function PlayerSection({
  emptyText = 'Search for players to populate this section.',
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
                <p>{player.position || player.sport || 'Player'}</p>
                <span>{player.team || player.league || 'TheSportsDB'}</span>
              </div>
              <small>{player.nationality || player.sport || 'Live player profile'}</small>
              <div className="card-actions">
                <button onClick={() => onFollowPlayer(player)} type="button">
                  {followedPlayerIds.includes(player.id) ? 'Following' : 'Follow'}
                </button>
                <WatchButton item={playerToWatchItem(player)} onAdd={onAddWatchlist} profile={profile} watchlist={watchlist} />
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

function StatusBlock({ error, loading }) {
  if (loading) {
    return <p className="notice status">Loading live data from TheSportsDB...</p>;
  }

  if (error) {
    return <p className="error-text status">{error}</p>;
  }

  return null;
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
  const alreadyFollowing = item.type !== 'event' && isFollowing(item, profile);
  const alreadyWatching = watchlist.some((entry) => entry.id === item.id);

  return (
    <button disabled={alreadyFollowing || alreadyWatching} onClick={() => onAdd(item)} type="button">
      {alreadyFollowing ? 'Following' : alreadyWatching ? 'In watchlist' : 'Add to watchlist'}
    </button>
  );
}

function SportIcon({ compact = false, sport }) {
  const safeSport = sport?.label ? sport : sportOptions.find((option) => option.id === sport?.id) ?? sportOptions[0];

  return (
    <span className={compact ? 'sport-icon compact' : 'sport-icon'} aria-hidden="true">
      {safeSport.icon}
    </span>
  );
}

function useLiveSearch(query, mode, sports) {
  const [state, setState] = useState({ loading: false, error: '', results: [] });

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setState({ loading: false, error: '', results: [] });
      return undefined;
    }

    let isCurrent = true;
    setState({ loading: true, error: '', results: [] });

    const timer = window.setTimeout(() => {
      searchSportsDb(trimmedQuery, mode, sports)
        .then((results) => {
          if (isCurrent) {
            setState({ loading: false, error: '', results });
          }
        })
        .catch((error) => {
          if (isCurrent) {
            setState({
              loading: false,
              error: error.message || 'Search failed. Please try again.',
              results: [],
            });
          }
        });
    }, SEARCH_DELAY);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [mode, query, sports]);

  return state;
}

async function searchSportsDb(query, mode, sports) {
  const shouldSearchTeams = mode === 'team' || mode === 'all';
  const shouldSearchPlayers = mode === 'player' || mode === 'all';
  const requests = [];

  if (shouldSearchTeams) {
    requests.push(apiGet('searchteams.php', { t: query }).then((data) => (data.teams ?? []).map(liveTeam)));
  }

  if (shouldSearchPlayers) {
    requests.push(apiGet('searchplayers.php', { p: query }).then((data) => (data.player ?? []).map(livePlayer)));
  }

  const settledResults = await Promise.allSettled(requests);
  const results = settledResults
    .filter((result) => result.status === 'fulfilled')
    .flatMap((result) => result.value);

  if (!results.length && settledResults.some((result) => result.status === 'rejected')) {
    throw new Error('TheSportsDB search is temporarily unavailable.');
  }

  const allowedSports = new Set((sports ?? []).map((sport) => sport.apiSport).filter(Boolean));
  const filteredResults = allowedSports.size
    ? results.filter((item) => allowedSports.has(item.sport) || mode === 'all')
    : results;

  return uniqueById(filteredResults).slice(0, 10);
}

async function fetchLeagueDirectory(selectedSports) {
  const allLeagueData = await apiGet('all_leagues.php');
  const allLeagues = allLeagueData.leagues ?? [];

  return visibleLeagueConfigs(selectedSports).map((config) => {
    const liveLeague = allLeagues.find((league) => {
      const liveName = league.strLeague?.toLowerCase() ?? '';
      return liveName === config.name.toLowerCase() || liveName.includes(config.name.toLowerCase());
    });

    return {
      ...config,
      id: liveLeague?.idLeague ?? config.fallbackId,
      apiSport: liveLeague?.strSport ?? config.apiSport,
    };
  });
}

async function fetchFollowedTeamEvents(teams) {
  const teamsWithIds = teams.filter((team) => team.id);
  const upcomingLists = await Promise.all(
    teamsWithIds.map((team) =>
      apiGet('eventsnext.php', { id: team.id })
        .then((data) => (data.events ?? []).map((event) => liveEvent(event, team)))
        .catch(() => []),
    ),
  );
  const recentLists = await Promise.all(
    teamsWithIds.map((team) =>
      apiGet('eventslast.php', { id: team.id })
        .then((data) => (data.results ?? data.events ?? []).map((event) => liveEvent(event, team)))
        .catch(() => []),
    ),
  );

  return {
    upcoming: uniqueById(upcomingLists.flat()).sort((a, b) => eventTimestamp(a) - eventTimestamp(b)),
    recent: uniqueById(recentLists.flat()).sort((a, b) => eventTimestamp(b) - eventTimestamp(a)),
  };
}

async function apiGet(endpoint, params = {}) {
  const url = new URL(`${API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TheSportsDB request failed (${response.status})`);
  }

  return response.json();
}

function liveTeam(team) {
  return {
    id: team.idTeam,
    league: team.strLeague || team.strLeague2 || 'TheSportsDB',
    meta: team.strLeague || team.strSport || 'Team',
    name: team.strTeam,
    sport: team.strSport,
    type: 'team',
  };
}

function livePlayer(player) {
  return {
    id: player.idPlayer,
    league: player.strTeam || player.strSport || 'TheSportsDB',
    meta: `${player.strPosition || 'Player'} - ${player.strTeam || player.strSport || 'TheSportsDB'}`,
    name: player.strPlayer,
    nationality: player.strNationality,
    position: player.strPosition,
    sport: player.strSport,
    team: player.strTeam,
    type: 'player',
  };
}

function liveEvent(event, followedTeam) {
  return {
    id: event.idEvent,
    awayTeam: event.strAwayTeam,
    date: event.dateEvent,
    homeTeam: event.strHomeTeam,
    league: event.strLeague || followedTeam.league || event.strSport || 'TheSportsDB',
    name: event.strEvent,
    score:
      event.intHomeScore !== null && event.intHomeScore !== undefined
        ? `${event.intHomeScore} - ${event.intAwayScore}`
        : '',
    sport: event.strSport || followedTeam.sport,
    team: followedTeam.name,
    time: event.strTime,
    timestamp: event.strTimestamp,
    type: 'event',
    venue: event.strVenue,
  };
}

function visibleLeagueConfigs(selectedSports) {
  return selectedSports.flatMap((sport) =>
    (featuredLeagues[sport.id] ?? []).map((league) => ({
      ...league,
      apiSport: sport.apiSport,
      sportId: sport.id,
    })),
  );
}

function eventToFeedCard(event, timezone) {
  const score = event.score ? `Final score: ${event.score}.` : 'Recent result from TheSportsDB.';
  return {
    id: `recent-${event.id}`,
    category: 'Match Reports',
    headline: event.name,
    snippet: `${score} ${event.league} at ${event.venue || 'venue TBA'}.`,
    sortDate: eventDate(event).toISOString(),
    team: event.team || event.homeTeam,
    timeAgo: formatEventDate(event, timezone),
    url: `https://www.thesportsdb.com/event/${event.id}`,
    watchItem: eventToWatchItem(event),
  };
}

function eventToUpcomingCard(event, timezone) {
  return {
    id: `upcoming-${event.id}`,
    category: 'Upcoming',
    headline: event.name,
    snippet: `${event.league} kickoff is ${formatEventDate(event, timezone)} at ${event.venue || 'venue TBA'}.`,
    sortDate: eventDate(event).toISOString(),
    team: event.team || event.homeTeam,
    timeAgo: formatEventDate(event, timezone),
    url: `https://www.thesportsdb.com/event/${event.id}`,
    watchItem: eventToWatchItem(event),
  };
}

function eventToWatchItem(event) {
  return {
    id: event.id,
    meta: `${event.league} - ${formatEventDate(event, getBrowserTimezone())}`,
    name: event.name,
    type: 'event',
  };
}

function playerToWatchItem(player) {
  return {
    id: player.id,
    meta: player.meta || `${player.position || 'Player'} - ${player.team || player.sport || 'TheSportsDB'}`,
    name: player.name,
    type: 'player',
  };
}

function searchItemToWatchItem(item) {
  if (item.type === 'player') {
    return playerToWatchItem(item);
  }

  return {
    id: item.id,
    meta: item.meta || item.league || item.sport || 'TheSportsDB',
    name: item.name,
    type: 'team',
  };
}

function followItem(profile, item) {
  if (item.type === 'team') {
    return addUnique(profile, 'teams', {
      id: item.id,
      league: item.meta,
      meta: item.meta,
      name: item.name,
      sport: item.sport,
      type: 'team',
    });
  }

  if (item.type === 'player') {
    return addUnique(profile, 'players', {
      id: item.id,
      meta: item.meta,
      name: item.name,
      position: item.position,
      sport: item.sport,
      team: item.team,
      type: 'player',
    });
  }

  return profile;
}

function addUnique(profile, key, item) {
  if (profile[key].some((existingItem) => existingItem.id === item.id)) {
    return profile;
  }

  return { ...profile, [key]: [...profile[key], item] };
}

function addUniqueItem(items, item) {
  return items.some((existingItem) => existingItem.id === item.id) ? items : [...items, item];
}

function isFollowing(item, profile) {
  if (item.type === 'team') {
    return profile.teams.some((team) => team.id === item.id);
  }

  if (item.type === 'player') {
    return profile.players.some((player) => player.id === item.id);
  }

  return false;
}

function groupEventsByDay(events, timezone) {
  return events.reduce((groupedEvents, event) => {
    const key = formatIsoDate(eventDate(event), timezone);
    return {
      ...groupedEvents,
      [key]: [...(groupedEvents[key] ?? []), event],
    };
  }, {});
}

function getCurrentWeek(timezone) {
  const safeTimezone = normalizeTimezone(timezone);
  const today = new Date();
  const localToday = new Date(formatIsoDate(today, safeTimezone));
  const dayIndex = localToday.getUTCDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;
  const monday = new Date(localToday);
  monday.setUTCDate(localToday.getUTCDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    const isoDate = date.toISOString().slice(0, 10);
    return {
      dayName: date.toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' }),
      isToday: isoDate === formatIsoDate(today, safeTimezone),
      isoDate,
      label: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    };
  });
}

function eventDate(event) {
  if (event.timestamp) {
    return new Date(event.timestamp);
  }

  if (event.date && event.time) {
    return new Date(`${event.date}T${event.time.replace('+00:00', '')}Z`);
  }

  if (event.date) {
    return new Date(`${event.date}T12:00:00Z`);
  }

  return new Date();
}

function eventTimestamp(event) {
  return eventDate(event).getTime();
}

function formatEventDate(event, timezone) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: normalizeTimezone(timezone),
  }).format(eventDate(event));
}

function formatEventTime(event, timezone) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: normalizeTimezone(timezone),
  }).format(eventDate(event));
}

function formatIsoDate(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    month: '2-digit',
    timeZone: normalizeTimezone(timezone),
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function itemMeta(item, mode) {
  if (mode === 'player') {
    return item.meta || `${item.position || 'Player'} - ${item.team || item.sport || 'TheSportsDB'}`;
  }

  if (mode === 'team') {
    return item.meta || item.league || item.sport || 'Team';
  }

  return item.type === 'player'
    ? item.meta || `${item.position || 'Player'} - ${item.team || item.sport || 'TheSportsDB'}`
    : item.meta || item.league || item.sport || 'Team';
}

function sportFromApi(apiSport) {
  return sportOptions.find((sport) => sport.apiSport === apiSport) ?? {
    id: 'live',
    label: apiSport || 'Live',
    icon: (apiSport || 'Live').slice(0, 3).toUpperCase(),
  };
}

function sportLabel(sportId) {
  return sportOptions.find((sport) => sport.id === sportId)?.label ?? sportId;
}

function uniqueById(items) {
  return items.filter((item, index, allItems) => allItems.findIndex((candidate) => candidate.id === item.id) === index);
}

function initials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function onboardingTitle(step) {
  if (step === 1) {
    return 'Pick sports and confirm your timezone.';
  }

  if (step === 2) {
    return 'Search real teams to follow.';
  }

  return 'Optionally add live player follows.';
}

function onboardingText(step) {
  if (step === 1) {
    return 'Fieldwatch detects your timezone automatically and shows major leagues for every sport you pick.';
  }

  if (step === 2) {
    return 'Search TheSportsDB across major football, basketball, tennis, F1, cricket, rugby, NFL, baseball, and World Cup data.';
  }

  return 'Player search is optional, and you can always add more from the Players page or the Watchlist search.';
}

function loadProfile() {
  if (typeof window === 'undefined') {
    return emptyProfile;
  }

  try {
    const storedProfile = JSON.parse(window.localStorage.getItem(PROFILE_KEY) ?? 'null');
    if (!storedProfile) {
      return emptyProfile;
    }

    return {
      sports: Array.isArray(storedProfile.sports) ? storedProfile.sports : [],
      teams: Array.isArray(storedProfile.teams) ? storedProfile.teams : [],
      players: Array.isArray(storedProfile.players) ? storedProfile.players : [],
      timezone: storedProfile.timezone || getBrowserTimezone(),
    };
  } catch {
    return emptyProfile;
  }
}

function saveProfile(profile) {
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function setAndSaveProfile(profile, setProfile) {
  saveProfile(profile);
  setProfile(profile);
}

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function normalizeTimezone(timezone) {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return getBrowserTimezone();
  }
}

export default App;
