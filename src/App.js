import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import { useKey } from "./useKey";
import { useLocalStorageState } from "./useLocalStorageState";
import { useMovies } from "./useMovies";

const average = (arr) =>
  arr.length === 0
    ? 0
    : arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "60660698";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoading, error } = useMovies(query);
  const [watched, setWatched] = useLocalStorageState([], "watched");

  function handleSelectMovie(id) {
    setSelectedId((selected) => (id === selected ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((m) => m.imdbID !== id));
  }

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
              />
            </>
          )}
        </Box>
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>⛔</span> {message}
    </p>
  );
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function Logo() {
  return (
    <div className="logo">
      <span>🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery("");
  });

  return (
    <input
      ref={inputEl}
      className="search"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search movies..."
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((o) => !o)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie key={movie.imdbID} movie={movie} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectMovie }) {
  const poster =
    movie.Poster !== "N/A"
      ? movie.Poster
      : "https://via.placeholder.com/300x445?text=No+Image";

  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={poster} alt={movie.Title} />
      <h3>{movie.Title}</h3>
      <p>🗓 {movie.Year}</p>
    </li>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched, watched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const countRef = useRef(0);
  useEffect(() => {
    if (userRating) countRef.current++;
  }, [userRating]);

  const isWatched = watched.map((m) => m.imdbID).includes(selectedId);
  const watchedUserRating = watched.find(
    (m) => m.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: posterRaw,
    Runtime: runtimeRaw,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  const poster =
    posterRaw && posterRaw !== "N/A"
      ? posterRaw
      : "https://via.placeholder.com/300x445?text=No+Image";

  useKey("Escape", onCloseMovie);

  useEffect(() => {
    async function getMovieDetails() {
      try {
        setIsLoading(true);

        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        if (!res.ok) throw new Error("Failed fetching movie");

        const data = await res.json();
        if (data.Response === "False") throw new Error(data.Error);

        setMovie(data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    getMovieDetails();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;
    document.title = `Movie | ${title}`;
    return () => (document.title = "usePopcorn");
  }, [title]);

  function handleAdd() {
    const runtime =
      runtimeRaw && runtimeRaw !== "N/A"
        ? Number(runtimeRaw.split(" ").at(0))
        : 0;

    const newMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime,
      userRating,
      countRatingDecisions: countRef.current,
    };

    onAddWatched(newMovie);
    onCloseMovie();
  }

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              ←
            </button>
            <img src={poster} alt={title} />

            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} • {runtimeRaw}
              </p>
              <p>{genre}</p>
              <p>⭐ {imdbRating} IMDb</p>
            </div>
          </header>

          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating maxRating={10} onSetRating={setUserRating} />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add
                    </button>
                  )}
                </>
              ) : (
                <p>You rated ⭐ {watchedUserRating}</p>
              )}
            </div>

            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((m) => m.imdbRating));
  const avgUserRating = average(watched.map((m) => m.userRating));
  const avgRuntime = average(watched.map((m) => m.runtime));

  return (
    <div className="summary">
      <h2>Stats for your watched list</h2>
      <div>
        <p><span>🎬</span> {watched.length} movies</p>
        <p><span>⭐</span> {avgImdbRating.toFixed(1)}</p>
        <p><span>🌟</span> {avgUserRating.toFixed(1)}</p>
        <p><span>⏳</span> {avgRuntime.toFixed(0)} min</p>
      </div>
    </div>
  );
}

function WatchedMoviesList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <li key={movie.imdbID}>
          <img src={movie.poster} alt={movie.title} />
          <h3>{movie.title}</h3>
          <div>
            <p><span>⭐</span> {movie.imdbRating}</p>
            <p><span>🌟</span> {movie.userRating}</p>
            <p><span>⏳</span> {movie.runtime} min</p>
          </div>
          <button className="btn-delete" onClick={() => onDeleteWatched(movie.imdbID)}>X</button>
        </li>
      ))}
    </ul>
  );
}
