import { useState, useEffect } from "react";

const KEY = "60660698";

export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovies() {
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
          { signal: controller.signal }
        );

        if (!res.ok) throw new Error("Network error");

        const data = await res.json();

        // 🔴 OMDb error handling
        if (data.Response === "False") throw new Error(data.Error);

        setMovies(data.Search || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setMovies([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (query.length < 3) {
      setMovies([]);
      setError("");
      return;
    }

    fetchMovies();

    return () => controller.abort();
  }, [query]);

  return { movies, isLoading, error };
}
