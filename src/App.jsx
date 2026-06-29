import { useEffect, useMemo, useState } from 'react';

const SPORTDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const NEWS_API_KEY = 'cbec53b5fc7f4f3eba4eff748baabdea';
const ODDS_API_KEY = 'd74335ffcec211434253c95de77111ae';
const PROFILE_KEY = 'fieldwatch:multi-source-profile';
const SEARCH_DELAY = 350;
const TIME_SLOTS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

const navItems = ['Feed', 'Schedule', 'Players'];
const categories = ['All', 'News', 'Upcoming', 'Final'];

const sports = [
  {
    id: 'football',
    label: 'Football',
    apiSport: 'Soccer',
    icon: 'FB',
    espn: ['soccer/fifa.world', 'soccer/eng.1', 'soccer/esp.1', 'soccer/ger.1', 'soccer/ita.1', 'soccer/ind.super', 'soccer/ind.1'],
    odds: ['soccer_epl'],
    leagues: ['Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Indian Super League', 'FIFA World Cup 2026'],
  },
  {
    id: 'basketball',
    label: 'Basketball',
    apiSport: 'Basketball',
    icon: 'BB',
    espn: ['basketball/nba'],
    odds: ['basketball_nba'],
    leagues: ['NBA', 'EuroLeague'],
  },
  {
    id: 'tennis',
    label: 'Tennis',
    apiSport: 'Tennis',
    icon: 'TN',
    espn: ['tennis/atp', 'tennis/wta'],
    odds: ['tennis_atp', 'tennis_wta'],
    leagues: ['ATP', 'WTA'],
  },
  {
    id: 'f1',
    label: 'F1',
    apiSport: 'Motorsport',
    icon: 'F1',
    espn: ['racing/f1'],
    odds: [],
    leagues: ['Formula 1'],
  },
  {
    id: 'cricket',
    label: 'Cricket',
    apiSport: 'Cricket',
    icon: 'CR',
    espn: ['cricket/icc', 'cricket/ipl'],
    odds: ['cricket_international_t20'],
    leagues: ['India Cricket', 'ICC Cricket', 'IPL'],
  },
  {
    id: 'rugby',
    label: 'Rugby',
    apiSport: 'Rugby',
    icon: 'RU',
    espn: ['rugby/scoreboard', 'rugby-league/nrl', 'rugby-league/3'],
    odds: ['rugbyleague_nrl', 'rugbyunion_six_nations'],
    leagues: ['NRL', 'Rugby World Cup', 'Six Nations'],
  },
  {
    id: 'nrl',
    label: 'NRL',
    apiSport: 'Rugby',
    icon: 'NRL',
    espn: ['rugby-league/nrl', 'rugby-league/3'],
    odds: ['rugbyleague_nrl'],
    leagues: ['National Rugby League'],
  },
  {
    id: 'nfl',
    label: 'NFL',
    apiSport: 'American Football',
    icon: 'NFL',
    espn: ['football/nfl'],
    odds: ['americanfootball_nfl'],
    leagues: ['NFL'],
  },
  {
    id: 'baseball',
    label: 'Baseball',
    apiSport: 'Baseball',
    icon: 'MLB',
    espn: ['baseball/mlb'],
    odds: ['baseball_mlb'],
    leagues: ['MLB'],
  },
];

const fallbackTeams = [
  { id: '133604', type: 'team', name: 'Arsenal', sport: 'Soccer', league: 'English Premier League', meta: 'Premier League' },
  { id: '133602', type: 'team', name: 'Man United', sport: 'Soccer', league: 'English Premier League', meta: 'Premier League' },
  { id: '134865', type: 'team', name: 'Golden State Warriors', sport: 'Basketball', league: 'NBA', meta: 'NBA' },
];

const emptyProfile = {
  sports: [],
  teams: [],
  players: [],
  timezone: browserTimezone(),
};

function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [activePage, setActivePage] = useState('Feed');
  const [watchlist, setWatchlist] = useState([]);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [data, setData] = useState({ fixtures: [], news: [], odds: {}, forms: {} });
  const [status, setStatus] = useState({ loading: false, errors: [] });

  const onboarded = profile.sports.length > 0 && profile.teams.length > 0;

  useEffect(() => {
    if (!onboarded) return undefined;

    let active = true;
    setStatus({ loading: true, errors: [] });

    loadDashboardData(profile)
      .then((nextData) => {
        if (!active) return;
        setData(nextData.data);
        setStatus({ loading: false, errors: nextData.errors });
      })
      .catch((error) => {
        if (!active) return;
        setData({ fixtures: [], news: [], odds: {}, forms: {} });
        setStatus({ loading: false, errors: [error.message || 'Unable to load live data.'] });
      });

    return () => {
      active = false;
    };
  }, [onboarded, profile]);

  const updateProfile = (updater) => {
    setProfile((current) => {
      const next = updater(current);
      saveProfile(next);
      return next;
    });
  };

  const goToPage = (page) => {
    setSelectedFixture(null);
    setSelectedTeam(null);
    setActivePage(page);
  };

  const addToWatchlist = (item) => {
    if (!item || watchlist.some((entry) => entry.id === item.id) || isFollowing(item, profile)) return;
    setWatchlist((current) => [...current, item]);
  };

  const removeFromWatchlist = (id) => setWatchlist((current) => current.filter((item) => item.id !== id));

  const followItem = (item) => {
    updateProfile((current) => {
      if (item.type === 'team') return addUnique(current, 'teams', item);
      if (item.type === 'player') return addUnique(current, 'players', item);
      return current;
    });
    removeFromWatchlist(item.id);
  };

  if (!onboarded) {
    return <Onboarding onComplete={(nextProfile) => setAndSaveProfile(nextProfile, setProfile)} />;
  }

  const upcomingFixtures = data.fixtures
    .filter((fixture) => !fixture.completed)
    .sort((a, b) => fixtureTime(a) - fixtureTime(b));

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fieldwatch home" onClick={() => goToPage('Feed')}>
          <span className="brand-mark">F</span>
          <span>Fieldwatch</span>
        </a>
        <nav className="nav-tabs" aria-label="Main navigation">
          {navItems.map((page) => (
            <button
              className={!selectedFixture && !selectedTeam && activePage === page ? 'nav-tab is-active' : 'nav-tab'}
              key={page}
              onClick={() => goToPage(page)}
              type="button"
            >
              {page}
            </button>
          ))}
        </nav>
      </header>

      <main className="shell" id="top">
        <section className="hero">
          <p className="eyebrow">Multi-source live tracker</p>
          <h1>Real fixtures, news, odds, and watchlists in your local time.</h1>
          <p>
            Timezone: <strong>{profile.timezone}</strong>. Powered by TheSportsDB, ESPN, NewsAPI,
            and The Odds API.
          </p>
        </section>

        {selectedFixture && (
          <FixtureDetail
            fixture={selectedFixture}
            news={data.news}
            odds={data.odds[selectedFixture.id]}
            onBack={() => setSelectedFixture(null)}
            onOpenTeam={setSelectedTeam}
            profile={profile}
          />
        )}
        {!selectedFixture && selectedTeam && (
          <TeamPage
            fixtures={data.fixtures}
            news={data.news}
            onBack={() => setSelectedTeam(null)}
            onOpenFixture={setSelectedFixture}
            profile={profile}
            team={selectedTeam}
          />
        )}
        {!selectedFixture && !selectedTeam && activePage === 'Feed' && (
          <Feed
            data={data}
            onAddWatchlist={addToWatchlist}
            onFollowWatchlist={followItem}
            onOpenFixture={setSelectedFixture}
            onOpenTeam={setSelectedTeam}
            onRemoveWatchlist={removeFromWatchlist}
            profile={profile}
            status={status}
            upcomingFixtures={upcomingFixtures}
            watchlist={watchlist}
          />
        )}
        {!selectedFixture && !selectedTeam && activePage === 'Schedule' && (
          <Schedule data={data} onAddWatchlist={addToWatchlist} onOpenFixture={setSelectedFixture} profile={profile} status={status} watchlist={watchlist} />
        )}
        {!selectedFixture && !selectedTeam && activePage === 'Players' && (
          <Players
            followedPlayerIds={profile.players.map((player) => player.id)}
            onAddWatchlist={addToWatchlist}
            onFollowPlayer={(player) => updateProfile((current) => addUnique(current, 'players', player))}
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
  const [selectedTeams, setSelectedTeams] = useState(fallbackTeams);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [timezone, setTimezone] = useState(browserTimezone());

  const canContinue = step === 1 ? selectedSports.length > 0 : selectedTeams.length > 0;

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
          <h1 id="welcome-title">{step === 1 ? 'Pick sports and confirm timezone.' : step === 2 ? 'Search real teams.' : 'Optionally add players.'}</h1>
          <p>
            {step === 1
              ? 'Fieldwatch auto-detects your timezone and shows major competitions for every sport.'
              : step === 2
                ? 'Search TheSportsDB for teams across your selected sports, including FIFA World Cup coverage.'
                : 'Player search is optional. You can add more later from the Players page.'}
          </p>
        </div>

        {step === 1 && (
          <>
            <SportGrid selectedSports={selectedSports} setSelectedSports={setSelectedSports} />
            <TimezonePicker timezone={timezone} setTimezone={setTimezone} />
            <LeagueCoverage sports={selectedSports} />
          </>
        )}
        {step === 2 && (
          <LiveSearchPicker
            label="Search teams"
            mode="team"
            onSelect={(team) => setSelectedTeams((current) => addUniqueItem(current, team))}
            selectedItems={selectedTeams}
            setSelectedItems={setSelectedTeams}
            sports={selectedSports}
          />
        )}
        {step === 3 && (
          <LiveSearchPicker
            label="Search players"
            mode="player"
            optional
            onSelect={(player) => setSelectedPlayers((current) => addUniqueItem(current, player))}
            selectedItems={selectedPlayers}
            setSelectedItems={setSelectedPlayers}
            sports={selectedSports}
          />
        )}

        <div className="welcome-actions">
          {step > 1 && <button className="button secondary" onClick={() => setStep((current) => current - 1)} type="button">Back</button>}
          {step < 3 ? (
            <button className="button primary" disabled={!canContinue} onClick={() => setStep((current) => current + 1)} type="button">Continue</button>
          ) : (
            <button className="button primary" onClick={() => onComplete({ sports: selectedSports, teams: selectedTeams, players: selectedPlayers, timezone })} type="button">
              Get started
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

function SportGrid({ selectedSports, setSelectedSports }) {
  const toggle = (sport) => {
    setSelectedSports((current) =>
      current.some((item) => item.id === sport.id)
        ? current.filter((item) => item.id !== sport.id)
        : [...current, sport],
    );
  };

  return (
    <div className="sport-grid">
      {sports.map((sport) => (
        <button
          className={selectedSports.some((item) => item.id === sport.id) ? 'sport-card is-selected' : 'sport-card'}
          key={sport.id}
          onClick={() => toggle(sport)}
          type="button"
        >
          <span className="sport-icon">{sport.icon}</span>
          <span>{sport.label}</span>
        </button>
      ))}
    </div>
  );
}

function LeagueCoverage({ sports: selectedSports }) {
  if (!selectedSports.length) return null;

  return (
    <div className="league-panel">
      <div>
        <p className="eyebrow">Competitions visible</p>
        <h3>Major coverage by sport</h3>
      </div>
      <div className="league-grid">
        {selectedSports.flatMap((sport) =>
          sport.leagues.map((league) => (
            <article className="league-card" key={`${sport.id}-${league}`}>
              <span>{sport.label}</span>
              <strong>{league}</strong>
              <small>{league === 'FIFA World Cup 2026' ? 'ESPN fifa.world scoreboard + NewsAPI' : 'TheSportsDB + ESPN where available'}</small>
            </article>
          )),
        )}
      </div>
    </div>
  );
}

function TimezonePicker({ setTimezone, timezone }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const options = useMemo(() => getTimezoneOptions(), []);
  const selected = options.find((option) => option.value === timezone) ?? formatTimezoneOption(timezone);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => `${option.value} ${option.label}`.toLowerCase().includes(normalizedQuery)).slice(0, 40)
    : options.slice(0, 40);

  return (
    <div className="timezone-card">
      <div>
        <p className="eyebrow">Choose timezone</p>
        <h3>{selected.label}</h3>
        <p>All fixtures, news timestamps, and odds pages use this saved timezone.</p>
      </div>
      <div className="timezone-picker">
        <label htmlFor="timezone-search">Search IANA timezones</label>
        <input
          id="timezone-search"
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search Sydney, London, New York..."
          type="search"
          value={query}
        />
        {open && (
          <div className="timezone-dropdown">
            {filteredOptions.map((option) => (
              <button
                className={option.value === timezone ? 'is-selected' : ''}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setTimezone(option.value);
                  setQuery('');
                  setOpen(false);
                }}
                type="button"
              >
                <strong>{option.label}</strong>
                <span>{option.value}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LiveSearchPicker({ label, mode, onSelect, optional = false, selectedItems, setSelectedItems, sports: selectedSports }) {
  const [query, setQuery] = useState('');
  const search = useLiveSearch(query, mode, selectedSports);

  return (
    <div className="picker">
      <label htmlFor={`${mode}-search`}>
        {label}
        {optional && <small>Optional</small>}
      </label>
      <div className="input-wrap">
        <input
          id={`${mode}-search`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={mode === 'team' ? 'Try Arsenal, Spain, Lakers...' : 'Try Messi, Saka, Curry...'}
          type="search"
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
      <div className="selected-list">
        {selectedItems.length ? (
          selectedItems.map((item) => (
            <button key={item.id} onClick={() => setSelectedItems((current) => current.filter((candidate) => candidate.id !== item.id))} type="button">
              {item.name}
              <span>Remove</span>
            </button>
          ))
        ) : (
          <p>{optional ? `No ${mode}s selected yet.` : `Search and select at least one ${mode}.`}</p>
        )}
      </div>
    </div>
  );
}

function SearchDropdown({ error, loading, mode, onSelect, results }) {
  return (
    <div className="dropdown">
      {loading && <p className="notice">Searching live sources...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && !results.length && <p>No live results found</p>}
      {results.map((item) => (
        <button key={`${mode}-${item.id}`} onClick={() => onSelect(item)} type="button">
          <span className="sport-icon compact">{sportIcon(item.sport)}</span>
          <span>
            <strong>{item.name}</strong>
            <small>{item.meta || item.league || item.sport}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

function Feed({ data, onAddWatchlist, onFollowWatchlist, onOpenFixture, onOpenTeam, onRemoveWatchlist, profile, status, upcomingFixtures, watchlist }) {
  const [teamFilter, setTeamFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const followedTeams = profile.teams.map((team) => team.name);
  const articleCards = data.news
    .filter((article) => teamFilter === 'All' || article.relatedTeams.includes(teamFilter))
    .filter(() => categoryFilter === 'All' || categoryFilter === 'News')
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  const fixtureCards = upcomingFixtures
    .filter((fixture) => teamFilter === 'All' || fixture.homeTeam === teamFilter || fixture.awayTeam === teamFilter)
    .filter(() => categoryFilter === 'All' || categoryFilter === 'Upcoming')
    .slice(0, 8);

  return (
    <section className="page-view feed-layout">
      <div className="feed-main">
        <FixtureBar fixtures={upcomingFixtures} oddsMap={data.odds} onAddWatchlist={onAddWatchlist} onOpenFixture={onOpenFixture} profile={profile} watchlist={watchlist} />
        <PageHeading eyebrow="Real sports news" title="Feed" meta={`${articleCards.length} articles`} />
        <StatusBlock status={status} />
        <Filters categories={categories} categoryFilter={categoryFilter} followedTeams={followedTeams} setCategoryFilter={setCategoryFilter} setTeamFilter={setTeamFilter} teamFilter={teamFilter} />

        <section className="upcoming-panel">
          <div>
            <p className="eyebrow">Upcoming events</p>
            <h3>Fixtures from followed teams</h3>
          </div>
          <div className="upcoming-grid">
            {fixtureCards.length ? (
              fixtureCards.map((fixture) => (
                <FixtureMiniCard
                  fixture={fixture}
                  key={fixture.id}
                  odds={data.odds[fixture.id]}
                  onAddWatchlist={onAddWatchlist}
                  onOpenFixture={onOpenFixture}
                  profile={profile}
                  watchlist={watchlist}
                />
              ))
            ) : (
              <p className="notice">No upcoming fixtures returned yet.</p>
            )}
          </div>
        </section>

        <div className="news-stack">
          {articleCards.length ? (
            articleCards.map((article) => (
              <article className="news-card" key={article.id}>
                <div className="news-meta">
                  <strong>{article.source}</strong>
                  <span className="badge">News</span>
                  <span>{formatDateTime(article.publishedAt, profile.timezone)}</span>
                </div>
                <h3>{article.title}</h3>
                <p>{article.description || 'Open the article for the latest report.'}</p>
                <div className="news-actions">
                  <a href={article.url} rel="noreferrer" target="_blank">Read article &rarr;</a>
                  {article.relatedTeams[0] && (
                    <button type="button" onClick={() => onOpenTeam(profile.teams.find((team) => team.name === article.relatedTeams[0]) || { name: article.relatedTeams[0], type: 'team' })}>
                      Team page
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-card">No relevant articles from the last 7 days yet.</div>
          )}
        </div>
      </div>

      <Watchlist
        onAdd={onAddWatchlist}
        onFollow={onFollowWatchlist}
        onOpenFixture={onOpenFixture}
        onOpenTeam={onOpenTeam}
        onRemove={onRemoveWatchlist}
        profile={profile}
        watchlist={watchlist}
      />
    </section>
  );
}

function FixtureBar({ fixtures, oddsMap, onAddWatchlist, onOpenFixture, profile, watchlist }) {
  return (
    <section className="fixture-bar" aria-label="Next fixtures">
      {fixtures.slice(0, 12).map((fixture) => (
        <article className="fixture-chip" key={fixture.id}>
          <button onClick={() => onOpenFixture(fixture)} type="button">
            <strong>{fixture.shortName}</strong>
            <span>{fixture.competition}</span>
            <small>{formatDateTime(fixture.date, profile.timezone)}</small>
            <OddsPreview fixture={fixture} odds={oddsMap[fixture.id]} />
          </button>
          <WatchButton item={fixtureToWatchItem(fixture)} onAdd={onAddWatchlist} profile={profile} watchlist={watchlist} />
        </article>
      ))}
      {!fixtures.length && <p className="notice">No upcoming fixtures loaded yet.</p>}
    </section>
  );
}

function FixtureMiniCard({ fixture, odds, onAddWatchlist, onOpenFixture, profile, watchlist }) {
  return (
    <article className="upcoming-card">
      <strong>{fixture.name}</strong>
      <span>{fixture.competition}</span>
      <small>{formatDateTime(fixture.date, profile.timezone)}</small>
      <small>{fixture.venue || 'Venue TBA'}</small>
      <OddsPreview fixture={fixture} odds={odds} />
      <div className="card-actions">
        <button onClick={() => onOpenFixture(fixture)} type="button">Fixture page</button>
        <WatchButton item={fixtureToWatchItem(fixture)} onAdd={onAddWatchlist} profile={profile} watchlist={watchlist} />
      </div>
    </article>
  );
}

function Schedule({ data, onAddWatchlist, onOpenFixture, profile, status, watchlist }) {
  const week = getCurrentWeek(profile.timezone);
  const byDay = groupFixturesByDay(data.fixtures, profile.timezone);

  return (
    <section className="page-view">
      <PageHeading eyebrow="Real fixtures" title="Schedule" meta={profile.timezone} />
      <StatusBlock status={status} />
      <div className="calendar">
        {week.map((day) => (
          <section className={day.isToday ? 'day-column today' : 'day-column'} key={day.isoDate}>
            <header>
              <span>{day.dayName}</span>
              <strong>{day.label}</strong>
            </header>
            <div className="timetable">
              {TIME_SLOTS.map((slot) => {
                const slotFixtures = (byDay[day.isoDate] || []).filter((fixture) => fixtureSlot(fixture, profile.timezone) === slot);
                return (
                  <div className={slotFixtures.length ? 'time-slot has-fixtures' : 'time-slot'} key={slot}>
                    <span className="slot-label">{slotLabel(slot)}</span>
                    <div className="slot-fixtures">
                      {slotFixtures.map((fixture) => (
                        <article className="match-card" key={fixture.id}>
                          <h3>{fixture.name}</h3>
                          <strong>{fixture.completed ? fixture.score || 'Final' : formatTime(fixture.date, profile.timezone)}</strong>
                          <p>{fixture.competition}</p>
                          <span>{fixture.venue || 'Venue TBA'}</span>
                          <OddsPreview fixture={fixture} odds={data.odds[fixture.id]} />
                          <div className="card-actions">
                            <button onClick={() => onOpenFixture(fixture)} type="button">Details</button>
                            <WatchButton item={fixtureToWatchItem(fixture)} onAdd={onAddWatchlist} profile={profile} watchlist={watchlist} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function FixtureDetail({ fixture, news, odds, onBack, onOpenTeam, profile }) {
  const detail = useFixtureDetail(fixture, news, profile.timezone);
  const relatedNews = newsForFixture(news, fixture).slice(0, 6);

  return (
    <section className="page-view detail-page">
      <button className="button secondary" onClick={onBack} type="button">Back</button>
      <article className="detail-hero">
        <p className="eyebrow">{fixture.competition}</p>
        <h2>{fixture.name}</h2>
        <p>{formatDateTime(fixture.date, profile.timezone)} · {fixture.venue || 'Venue TBA'}</p>
        <strong>{fixture.completed ? fixture.score || 'Final' : fixture.status || 'Upcoming'}</strong>
      </article>

      <div className="detail-grid">
        <DetailPanel title="Who to watch" loading={detail.loadingPlayers} error={detail.playerError}>
          <div className="player-grid compact-grid">
            {detail.players.map((player) => (
              <article className="player-card" key={player.id}>
                <PlayerAvatar player={player} />
                <h4>{player.name}</h4>
                <p>{player.position || player.team || 'Player'}</p>
                <span>{player.team}</span>
              </article>
            ))}
          </div>
        </DetailPanel>

        <DetailPanel title="Betting odds">
          <OddsTable odds={odds} fixture={fixture} />
        </DetailPanel>

        <DetailPanel title="Latest news">
          <NewsList articles={relatedNews} timezone={profile.timezone} />
        </DetailPanel>

        <DetailPanel title="Recent form" loading={detail.loadingForms} error={detail.formError}>
          <div className="form-grid">
            {[fixture.homeTeam, fixture.awayTeam].filter(Boolean).map((teamName) => (
              <article className="form-card" key={teamName}>
                <button onClick={() => onOpenTeam({ name: teamName, type: 'team' })} type="button">{teamName}</button>
                {(detail.forms[teamName] || []).slice(0, 5).map((item) => (
                  <span key={item.id}>{item.name}: {item.score || item.status || 'Played'}</span>
                ))}
                {!(detail.forms[teamName] || []).length && <span>No recent form returned.</span>}
              </article>
            ))}
          </div>
        </DetailPanel>
      </div>
    </section>
  );
}

function TeamPage({ fixtures, news, onBack, onOpenFixture, profile, team }) {
  const teamFixtures = fixtures.filter((fixture) => includesTeam(fixture, team.name));
  const teamNews = news.filter((article) => article.relatedTeams.includes(team.name)).slice(0, 8);

  return (
    <section className="page-view detail-page">
      <button className="button secondary" onClick={onBack} type="button">Back</button>
      <article className="detail-hero">
        <p className="eyebrow">{team.league || team.meta || 'Team page'}</p>
        <h2>{team.name}</h2>
        <p>{team.sport || 'Live sports'} · Fixtures and latest NewsAPI articles</p>
      </article>
      <div className="detail-grid">
        <DetailPanel title="Fixtures">
          <div className="match-list">
            {teamFixtures.map((fixture) => (
              <button className="team-fixture" key={fixture.id} onClick={() => onOpenFixture(fixture)} type="button">
                <strong>{fixture.name}</strong>
                <span>{fixture.competition} · {formatDateTime(fixture.date, profile.timezone)}</span>
              </button>
            ))}
            {!teamFixtures.length && <p className="notice">No fixtures returned for this team yet.</p>}
          </div>
        </DetailPanel>
        <DetailPanel title="Latest news">
          <NewsList articles={teamNews} timezone={profile.timezone} />
        </DetailPanel>
      </div>
    </section>
  );
}

function Watchlist({ onAdd, onFollow, onOpenFixture, onOpenTeam, onRemove, profile, watchlist }) {
  return (
    <aside className="watchlist">
      <div className="watchlist-head">
        <h2>Watchlist</h2>
        <span>{watchlist.length}</span>
      </div>
      <GlobalSearch onAdd={onAdd} profile={profile} watchlist={watchlist} />
      {watchlist.length ? (
        <div className="watchlist-items">
          {watchlist.map((item) => (
            <article className="watchlist-card clickable" key={item.id}>
              <button className="x-button" onClick={() => onRemove(item.id)} type="button" aria-label={`Remove ${item.name}`}>X</button>
              <button className="watch-main" onClick={() => (item.type === 'fixture' ? onOpenFixture(item.fixture) : onOpenTeam(item))} type="button">
                <span>{item.type}</span>
                <strong>{item.name}</strong>
                <p>{item.meta}</p>
              </button>
              <div className="watch-actions">
                {item.type !== 'fixture' && <button onClick={() => onFollow(item)} type="button">Follow</button>}
                <button onClick={() => (item.type === 'fixture' ? onOpenFixture(item.fixture) : onOpenTeam(item))} type="button">View fixtures</button>
                <button onClick={() => onOpenTeam(item.type === 'fixture' ? { name: item.fixture.homeTeam, type: 'team' } : item)} type="button">Latest news</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="watchlist-empty">Nothing added yet</p>
      )}
    </aside>
  );
}

function GlobalSearch({ onAdd, profile, watchlist }) {
  const [query, setQuery] = useState('');
  const search = useLiveSearch(query, 'all', sports);
  return (
    <div className="watch-search">
      <label htmlFor="watch-search">Search everything</label>
      <input id="watch-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Teams and players" type="search" />
      {query && (
        <SearchDropdown
          error={search.error}
          loading={search.loading}
          mode="all"
          onSelect={(item) => {
            onAdd(item);
            setQuery('');
          }}
          results={search.results.filter((item) => !isFollowing(item, profile) && !watchlist.some((entry) => entry.id === item.id))}
        />
      )}
    </div>
  );
}

function Players({ followedPlayerIds, onAddWatchlist, onFollowPlayer, profile, watchlist }) {
  const [query, setQuery] = useState('');
  const search = useLiveSearch(query, 'player', profile.sports);
  const suggestions = search.results.filter((player) => !followedPlayerIds.includes(player.id)).slice(0, 6);

  return (
    <section className="page-view players-page">
      <PageHeading eyebrow="TheSportsDB players" title="Players" />
      <div className="player-search">
        <label htmlFor="player-search">Search players</label>
        <input id="player-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search any player" type="search" />
        {query && <SearchDropdown error={search.error} loading={search.loading} mode="player" onSelect={onFollowPlayer} results={search.results} />}
      </div>
      <PlayerGrid title="Followed players" players={profile.players} followedPlayerIds={followedPlayerIds} onAddWatchlist={onAddWatchlist} onFollowPlayer={onFollowPlayer} profile={profile} watchlist={watchlist} />
      <PlayerGrid title={query ? 'Suggested from search' : 'Suggested players'} players={suggestions} followedPlayerIds={followedPlayerIds} onAddWatchlist={onAddWatchlist} onFollowPlayer={onFollowPlayer} profile={profile} watchlist={watchlist} />
    </section>
  );
}

function PlayerGrid({ title, players, followedPlayerIds, onAddWatchlist, onFollowPlayer, profile, watchlist }) {
  return (
    <section className="player-section">
      <h3>{title}</h3>
      {players.length ? (
        <div className="player-grid">
          {players.map((player) => (
            <article className="player-card" key={player.id}>
              <PlayerAvatar player={player} />
              <h4>{player.name}</h4>
              <p>{player.position || player.sport || 'Player'}</p>
              <span>{player.team || player.league || 'TheSportsDB'}</span>
              <div className="card-actions">
                <button onClick={() => onFollowPlayer(player)} type="button">{followedPlayerIds.includes(player.id) ? 'Following' : 'Follow'}</button>
                <WatchButton item={player} onAdd={onAddWatchlist} profile={profile} watchlist={watchlist} />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-card">Search to add players.</div>
      )}
    </section>
  );
}

function PlayerAvatar({ player }) {
  if (player.thumb) {
    return <img className="player-photo" src={player.thumb} alt={player.name} loading="lazy" />;
  }

  return <div className="avatar">{initials(player.name)}</div>;
}

function Filters({ categories: items, categoryFilter, followedTeams, setCategoryFilter, setTeamFilter, teamFilter }) {
  return (
    <div className="filters">
      <div>
        <p>Followed teams</p>
        <div className="chip-row">
          {['All', ...followedTeams].map((team) => (
            <button className={teamFilter === team ? 'chip is-active' : 'chip'} key={team} onClick={() => setTeamFilter(team)} type="button">{team}</button>
          ))}
        </div>
      </div>
      <div>
        <p>Categories</p>
        <div className="chip-row">
          {items.map((category) => (
            <button className={categoryFilter === category ? 'pill is-active' : 'pill'} key={category} onClick={() => setCategoryFilter(category)} type="button">{category}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ children, error, loading, title }) {
  return (
    <section className="detail-panel">
      <h3>{title}</h3>
      {loading && <p className="notice">Loading...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && children}
    </section>
  );
}

function NewsList({ articles, timezone }) {
  return articles.length ? (
    <div className="news-list-compact">
      {articles.map((article) => (
        <article className="fixture-news-card" key={article.id}>
          <strong>{article.title}</strong>
          <span>{article.source} · {timeAgo(article.publishedAt, timezone)}</span>
          {article.description && <p>{article.description}</p>}
          <a href={article.url} rel="noreferrer" target="_blank">
            Read article &rarr;
          </a>
        </article>
      ))}
    </div>
  ) : (
    <p className="notice">No matching NewsAPI articles returned yet.</p>
  );
}

function OddsPreview({ fixture, odds }) {
  const market = odds?.markets?.h2h?.[0];
  if (!market) return <span className="odds-preview">Odds unavailable</span>;
  return (
    <span className="odds-preview">
      {market.bookmaker}: {market.outcomes.slice(0, fixture.sport === 'Soccer' ? 3 : 2).map((item) => `${shortName(item.name)} ${item.price}`).join(' · ')}
    </span>
  );
}

function OddsTable({ odds, fixture }) {
  if (!odds?.markets) return <p className="notice">Odds unavailable for this fixture.</p>;
  return (
    <div className="odds-table">
      {['h2h', 'totals'].map((marketKey) => (
        <section key={marketKey}>
          <h4>{marketLabel(marketKey, fixture)}</h4>
          {(odds.markets[marketKey] || []).map((market) => (
            <article key={`${market.bookmaker}-${marketKey}`}>
              <strong>{market.bookmaker}</strong>
              <div>{market.outcomes.map((outcome) => <span key={`${market.bookmaker}-${marketKey}-${outcome.name}`}>{outcome.name}: {outcome.price}</span>)}</div>
            </article>
          ))}
          {!(odds.markets[marketKey] || []).length && <p>No {marketLabel(marketKey, fixture).toLowerCase()} market returned.</p>}
        </section>
      ))}
    </div>
  );
}

function StatusBlock({ status }) {
  if (status.loading) return <p className="notice status">Loading NewsAPI, ESPN, TheSportsDB, and Odds API data...</p>;
  if (status.errors.length) return <div className="status-list">{status.errors.map((error) => <p className="error-text" key={error}>{error}</p>)}</div>;
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
  const disabled = watchlist.some((entry) => entry.id === item.id) || isFollowing(item, profile);
  return <button disabled={disabled} onClick={() => onAdd(item)} type="button">{disabled ? 'Added' : 'Add to watchlist'}</button>;
}

function useLiveSearch(query, mode, selectedSports) {
  const [state, setState] = useState({ loading: false, error: '', results: [] });
  useEffect(() => {
    if (query.trim().length < 2) {
      setState({ loading: false, error: '', results: [] });
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      setState({ loading: true, error: '', results: [] });
      searchLive(query.trim(), mode, selectedSports)
        .then((results) => active && setState({ loading: false, error: '', results }))
        .catch((error) => active && setState({ loading: false, error: error.message || 'Search failed.', results: [] }));
    }, SEARCH_DELAY);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [mode, query, selectedSports]);
  return state;
}

function useFixtureDetail(fixture, news, timezone) {
  const [state, setState] = useState({ loadingPlayers: false, loadingForms: false, playerError: '', formError: '', players: [], forms: {} });
  useEffect(() => {
    let active = true;
    setState({ loadingPlayers: true, loadingForms: true, playerError: '', formError: '', players: [], forms: {} });
    Promise.allSettled([fetchKeyPlayers(fixture), fetchRecentForm(fixture)])
      .then(([playersResult, formsResult]) => {
        if (!active) return;
        setState({
          loadingPlayers: false,
          loadingForms: false,
          playerError: playersResult.status === 'rejected' ? playersResult.reason.message : '',
          formError: formsResult.status === 'rejected' ? formsResult.reason.message : '',
          players: playersResult.status === 'fulfilled' ? playersResult.value : [],
          forms: formsResult.status === 'fulfilled' ? formsResult.value : {},
        });
      });
    return () => {
      active = false;
    };
  }, [fixture, news, timezone]);
  return state;
}

async function loadDashboardData(profile) {
  const errors = [];
  const fixtureResult = await settle(fetchFixtures(profile));
  if (fixtureResult.error) errors.push(fixtureResult.error);
  const fixtures = fixtureResult.value || [];

  const newsResult = await settle(fetchNews(profile, fixtures));
  if (newsResult.error) errors.push(newsResult.error);
  const news = newsResult.value || [];

  const oddsResult = await settle(fetchOdds(fixtures, profile.sports));
  if (oddsResult.error) errors.push(oddsResult.error);
  const odds = oddsResult.value || {};

  return { data: { fixtures, news, odds, forms: {} }, errors };
}

async function fetchFixtures(profile) {
  const sportsDbRequests = profile.teams.flatMap((team) => [
    sportsDb('eventsnext.php', { id: team.id }).then((data) => (data.events || []).map((event) => normalizeSportsDbEvent(event, team, false))),
    sportsDb('eventslast.php', { id: team.id }).then((data) => (data.results || data.events || []).map((event) => normalizeSportsDbEvent(event, team, true))),
  ]);
  const espnRequests = profile.sports.flatMap((sport) =>
    (sport.espn || []).map((path) => fetchJson(`${ESPN_BASE}/${path}/scoreboard`).then((data) => (data.events || []).map((event) => normalizeEspnEvent(event, sport, path)))),
  );
  const settled = await Promise.allSettled([...sportsDbRequests, ...espnRequests]);
  const fixtures = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  return uniqueById(fixtures).sort((a, b) => fixtureTime(a) - fixtureTime(b));
}

async function fetchNews(profile, fixtures) {
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const teamNames = unique([
    ...profile.teams.map((team) => team.name),
    ...fixtures.slice(0, 10).flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam].filter(Boolean)),
    'FIFA World Cup 2026',
  ]).slice(0, 16);
  const queryGroups = teamNames.flatMap((teamName) => teamNewsQueries(teamName).map((query) => ({ teamName, query })));
  const newsRequests = queryGroups.slice(0, 36).map(({ teamName, query }) => {
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', query);
    url.searchParams.set('from', from);
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', '8');
    url.searchParams.set('apiKey', NEWS_API_KEY);
    return fetchJson(url.toString()).then((data) =>
      (data.articles || []).map((article, index) => normalizeArticle(article, `${teamName}-${index}`, teamNames)),
    );
  });
  const espnRequests = [
    'soccer/eng.1/news',
    'soccer/fifa.world/news',
    'soccer/ind.super/news',
    'soccer/ind.1/news',
    'basketball/nba/news',
    'football/nfl/news',
    'cricket/ipl/news',
    'rugby-league/nrl/news',
    'rugby-league/3/news',
  ].map((path) =>
    fetchJson(`${ESPN_BASE}/${path}`).then((data) =>
      (data.articles || []).map((article, index) => normalizeEspnArticle(article, `${path}-${index}`, teamNames)),
    ),
  );
  const settled = await Promise.allSettled([...newsRequests, ...espnRequests]);
  const articles = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  return dedupeArticles(articles)
    .filter((article) => article.url && new Date(article.publishedAt) >= new Date(from))
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

async function fetchOdds(fixtures, selectedSports) {
  const oddsSports = unique(selectedSports.flatMap((sport) => sport.odds || [])).slice(0, 8);
  const settled = await Promise.allSettled(
    oddsSports.map((sportKey) => {
      const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`);
      url.searchParams.set('apiKey', ODDS_API_KEY);
      url.searchParams.set('regions', 'uk,us,au');
      url.searchParams.set('markets', 'h2h,totals');
      url.searchParams.set('oddsFormat', 'decimal');
      return fetchJson(url.toString()).then((events) => ({ sportKey, events }));
    }),
  );
  const oddsEvents = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value.events || [] : []));
  return fixtures.reduce((map, fixture) => {
    const match = oddsEvents.find((event) => oddsMatchesFixture(event, fixture));
    return match ? { ...map, [fixture.id]: normalizeOdds(match) } : map;
  }, {});
}

async function searchLive(query, mode, selectedSports) {
  const requests = [];
  if (mode === 'team' || mode === 'all') requests.push(sportsDb('searchteams.php', { t: query }).then((data) => (data.teams || []).map(normalizeTeam)));
  if (mode === 'player' || mode === 'all') requests.push(sportsDb('searchplayers.php', { p: query }).then((data) => (data.player || []).map(normalizePlayer)));
  const settled = await Promise.allSettled(requests);
  const results = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
  const allowed = new Set((selectedSports || []).map((sport) => sport.apiSport));
  const filtered = allowed.size && mode !== 'all' ? results.filter((item) => allowed.has(item.sport)) : results;
  if (!filtered.length && settled.some((result) => result.status === 'rejected')) throw new Error('Live search is temporarily unavailable.');
  return uniqueById(filtered).slice(0, 10);
}

async function fetchKeyPlayers(fixture) {
  const teams = [fixture.homeTeam, fixture.awayTeam].filter(Boolean);
  const playerLists = await Promise.all(
    teams.map(async (teamName) => {
      const playersData = await sportsDb('searchplayers.php', { t: teamName });
      if (playersData.player?.length) {
        return playersData.player.slice(0, 4).map(normalizePlayer);
      }

      const teamData = await sportsDb('searchteams.php', { t: teamName });
      const team = teamData.teams?.[0];
      if (!team?.idTeam) return [];
      const rosterData = await sportsDb('lookup_all_players.php', { id: team.idTeam });
      return (rosterData.player || []).slice(0, 4).map(normalizePlayer);
    }),
  );
  return playerLists.flat().slice(0, 8);
}

async function fetchRecentForm(fixture) {
  const teams = [fixture.homeTeam, fixture.awayTeam].filter(Boolean);
  const entries = await Promise.all(
    teams.map(async (teamName) => {
      const teamData = await sportsDb('searchteams.php', { t: teamName });
      const team = teamData.teams?.[0];
      if (!team?.idTeam) return [teamName, []];
      const formData = await sportsDb('eventslast.php', { id: team.idTeam });
      return [teamName, (formData.results || []).map((event) => normalizeSportsDbEvent(event, normalizeTeam(team), true))];
    }),
  );
  return Object.fromEntries(entries);
}

function normalizeTeam(team) {
  return { id: team.idTeam, type: 'team', name: team.strTeam, sport: team.strSport, league: team.strLeague, meta: team.strLeague || team.strSport || 'Team' };
}

function normalizePlayer(player) {
  return {
    id: player.idPlayer,
    type: 'player',
    name: player.strPlayer,
    sport: player.strSport,
    team: player.strTeam,
    league: player.strTeam,
    position: player.strPosition,
    nationality: player.strNationality,
    thumb: player.strThumb || player.strCutout || player.strRender,
    meta: `${player.strPosition || 'Player'} - ${player.strTeam || player.strSport || 'TheSportsDB'}`,
  };
}

function normalizeSportsDbEvent(event, followedTeam, completedFallback) {
  const completed = event.intHomeScore !== null && event.intHomeScore !== undefined;
  return {
    id: `sportsdb-${event.idEvent}`,
    source: 'TheSportsDB',
    rawId: event.idEvent,
    sport: event.strSport || followedTeam.sport,
    name: event.strEvent,
    shortName: event.strEvent,
    homeTeam: event.strHomeTeam,
    awayTeam: event.strAwayTeam,
    competition: event.strLeague || followedTeam.league || event.strSport || 'Competition',
    date: event.strTimestamp || `${event.dateEvent || new Date().toISOString().slice(0, 10)}T${(event.strTime || '12:00:00').replace('+00:00', '')}Z`,
    venue: event.strVenue,
    completed: completed || completedFallback,
    score: completed ? `${event.intHomeScore} - ${event.intAwayScore}` : '',
    status: completed ? 'Final' : 'Upcoming',
  };
}

function normalizeEspnEvent(event, sport, path) {
  const competition = event.competitions?.[0];
  const competitors = competition?.competitors || [];
  const home = competitors.find((item) => item.homeAway === 'home') || competitors[0] || {};
  const away = competitors.find((item) => item.homeAway === 'away') || competitors[1] || {};
  const leagueName = path === 'soccer/fifa.world' ? 'FIFA World Cup 2026' : event.league?.name || sport.leagues?.[0] || sport.label;
  return {
    id: `espn-${event.id}`,
    source: 'ESPN',
    rawId: event.id,
    sport: sport.apiSport,
    name: event.name || `${home.team?.displayName} vs ${away.team?.displayName}`,
    shortName: event.shortName || event.name,
    homeTeam: home.team?.displayName || home.team?.name,
    awayTeam: away.team?.displayName || away.team?.name,
    competition: leagueName,
    date: event.date,
    venue: competition?.venue?.fullName,
    completed: Boolean(event.status?.type?.completed),
    score: event.status?.type?.completed ? `${home.score ?? ''} - ${away.score ?? ''}` : '',
    status: event.status?.type?.description || 'Scheduled',
  };
}

function normalizeArticle(article, index, terms) {
  const haystack = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  return {
    id: article.url || `article-${index}`,
    title: article.title,
    description: article.description,
    source: article.source?.name || 'NewsAPI',
    url: article.url,
    publishedAt: article.publishedAt,
    relatedTeams: terms.filter((term) => haystack.includes(term.toLowerCase())),
  };
}

function normalizeEspnArticle(article, index, terms) {
  const title = article.headline || article.title || 'ESPN sports news';
  const description = article.description || article.teaser || '';
  const haystack = `${title} ${description}`.toLowerCase();
  return {
    id: article.dataSourceIdentifier || article.id || article.links?.web?.href || `espn-${index}`,
    title,
    description,
    source: 'ESPN',
    url: article.links?.web?.href || article.link || article.url,
    publishedAt: article.published || article.lastModified || new Date().toISOString(),
    relatedTeams: terms.filter((term) => haystack.includes(term.toLowerCase())),
  };
}

function normalizeOdds(event) {
  const markets = { h2h: [], totals: [] };
  (event.bookmakers || []).forEach((bookmaker) => {
    (bookmaker.markets || []).forEach((market) => {
      if (!markets[market.key]) return;
      markets[market.key].push({
        bookmaker: bookmaker.title,
        outcomes: (market.outcomes || []).map((outcome) => ({ name: outcome.name, price: outcome.price, point: outcome.point })),
      });
    });
  });
  return { id: event.id, homeTeam: event.home_team, awayTeam: event.away_team, markets };
}

function fixtureToWatchItem(fixture) {
  return { id: fixture.id, type: 'fixture', name: fixture.name, meta: `${fixture.competition} · ${fixture.status}`, fixture };
}

function newsForFixture(news, fixture) {
  const fixtureTeams = [fixture.homeTeam, fixture.awayTeam].filter(Boolean);
  const matched = news.filter(
    (article) =>
      article.relatedTeams.some((team) => includesTeam(fixture, team)) ||
      fixtureTeams.some((team) => teamNewsQueries(team).some((query) => articleMatchesQuery(article, query))),
  );

  if (matched.length) return matched;

  return news.filter((article) => /espn|world cup|football|sports/i.test(`${article.source} ${article.title}`));
}

function oddsMatchesFixture(event, fixture) {
  const home = normalizeName(event.home_team);
  const away = normalizeName(event.away_team);
  return (home && normalizeName(fixture.homeTeam).includes(home)) || (away && normalizeName(fixture.awayTeam).includes(away)) || (normalizeName(fixture.homeTeam).includes(home) && normalizeName(fixture.awayTeam).includes(away));
}

function groupFixturesByDay(fixtures, timezone) {
  return fixtures.reduce((grouped, fixture) => {
    const day = isoInTimezone(fixture.date, timezone);
    return { ...grouped, [day]: [...(grouped[day] || []), fixture] };
  }, {});
}

function getCurrentWeek(timezone) {
  const today = new Date();
  const todayIso = isoInTimezone(today, timezone);
  const local = new Date(`${todayIso}T12:00:00Z`);
  const day = local.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(local);
  monday.setUTCDate(local.getUTCDate() + mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return {
      isoDate: iso,
      isToday: iso === todayIso,
      dayName: date.toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' }),
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
    };
  });
}

function fetchJson(url) {
  return fetch(url).then((response) => {
    if (!response.ok) throw new Error(`Request failed (${response.status})`);
    return response.json();
  });
}

function sportsDb(endpoint, params = {}) {
  const url = new URL(`${SPORTDB_BASE}/${endpoint}`);
  Object.entries(params).forEach(([key, value]) => value && url.searchParams.set(key, value));
  return fetchJson(url.toString());
}

function settle(promise) {
  return promise.then((value) => ({ value })).catch((error) => ({ error: error.message || String(error) }));
}

function loadProfile() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || 'null');
    return stored ? { ...emptyProfile, ...stored } : emptyProfile;
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

function isFollowing(item, profile) {
  if (item.type === 'team') return profile.teams.some((team) => team.id === item.id);
  if (item.type === 'player') return profile.players.some((player) => player.id === item.id);
  return false;
}

function addUnique(profile, key, item) {
  return profile[key].some((existing) => existing.id === item.id) ? profile : { ...profile, [key]: [...profile[key], item] };
}

function addUniqueItem(items, item) {
  return items.some((existing) => existing.id === item.id) ? items : [...items, item];
}

function uniqueById(items) {
  return items.filter((item, index, all) => item.id && all.findIndex((candidate) => candidate.id === item.id) === index);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function dedupeArticles(articles) {
  return articles.filter(
    (article, index, allArticles) =>
      article.url && allArticles.findIndex((candidate) => candidate.url === article.url) === index,
  );
}

function teamNewsQueries(teamName = '') {
  const aliases = {
    arsenal: ['Arsenal FC', 'Arsenal football', 'Gunners'],
    'man united': ['Manchester United', 'Man United football', 'Red Devils'],
    'manchester united': ['Manchester United', 'Man United football', 'Red Devils'],
    'golden state warriors': ['Golden State Warriors', 'Warriors NBA', 'Steph Curry Warriors'],
    india: ['India cricket', 'Team India cricket', 'BCCI'],
    'india cricket': ['India cricket', 'Team India cricket', 'BCCI'],
    'fifa world cup 2026': ['FIFA World Cup 2026', 'World Cup fixtures', 'FIFA World Cup news'],
  };
  const normalized = teamName.toLowerCase();
  return unique([teamName, ...(aliases[normalized] || [`${teamName} sports`, `${teamName} news`])]);
}

function articleMatchesQuery(article, query) {
  const haystack = `${article.title || ''} ${article.description || ''}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length > 2)
    .some((part) => haystack.includes(part));
}

function fixtureTime(fixture) {
  return new Date(fixture.date).getTime();
}

function fixtureSlot(fixture, timezone) {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: safeTimezone(timezone),
    }).format(new Date(fixture.date)),
  );
  if (hour < 6) return 6;
  if (hour >= 24) return 24;
  return Math.min(24, Math.floor(hour / 2) * 2);
}

function slotLabel(slot) {
  if (slot === 24) return 'Midnight';
  if (slot === 12) return '12pm';
  return slot > 12 ? `${slot - 12}pm` : `${slot}am`;
}

function includesTeam(fixture, teamName = '') {
  const needle = normalizeName(teamName);
  return normalizeName(fixture.homeTeam).includes(needle) || normalizeName(fixture.awayTeam).includes(needle) || normalizeName(fixture.name).includes(needle);
}

function normalizeName(name = '') {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function formatDateTime(value, timezone) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: safeTimezone(timezone) }).format(new Date(value));
}

function timeAgo(value) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatTime(value, timezone) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: safeTimezone(timezone) }).format(new Date(value));
}

function isoInTimezone(value, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: safeTimezone(timezone) }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function safeTimezone(timezone) {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return browserTimezone();
  }
}

function getTimezoneOptions() {
  const zones =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [
          'America/New_York',
          'America/Chicago',
          'America/Denver',
          'America/Los_Angeles',
          'America/Sao_Paulo',
          'Europe/London',
          'Europe/Paris',
          'Europe/Berlin',
          'Asia/Dubai',
          'Asia/Kolkata',
          'Asia/Tokyo',
          'Australia/Sydney',
          'Pacific/Auckland',
        ];

  return zones.map(formatTimezoneOption).sort((a, b) => a.label.localeCompare(b.label));
}

function formatTimezoneOption(value) {
  const city = value.split('/').pop().replaceAll('_', ' ');
  return {
    value,
    label: `${city} (${timezoneOffset(value)})`,
  };
}

function timezoneOffset(timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: safeTimezone(timezone),
    timeZoneName: 'shortOffset',
  }).formatToParts(new Date());
  return parts.find((part) => part.type === 'timeZoneName')?.value.replace('GMT', 'UTC') || 'UTC';
}

function initials(name = '') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function sportIcon(sport) {
  return sports.find((item) => item.apiSport === sport || item.label === sport)?.icon || (sport || 'SP').slice(0, 3).toUpperCase();
}

function shortName(name = '') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 3).toUpperCase();
}

function marketLabel(key, fixture) {
  if (key === 'h2h') return fixture.sport === 'Soccer' ? 'Match winner' : 'Winner';
  return 'Over/under 2.5';
}

export default App;
