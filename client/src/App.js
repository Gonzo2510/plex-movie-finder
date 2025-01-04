import React, { useState, useRef } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPageLink, setNextPageLink] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const movieListRef = useRef(null);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (searchTerm.trim() === '') return;
    setSearchResults([]);
    setIsLoading(true);
    await searchYts(searchTerm);
  };

  const searchYts = async (term) => {
    if (!term.trim()) return;

    try {
      setIsLoading(true);
      const params = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        },
      };

      const encodedTerm = encodeURIComponent(term.trim());
      const url = `https://yts.mx/browse-movies/${encodedTerm}/all/all/0/latest/0/all`;
      console.log('Searching YTS:', url);
      const response = await axios.get(url, params);
      const $ = load(response.data);
      const movies = [];

      $('.browse-movie-wrap').each((index, element) => {
        const title = $(element).find('.browse-movie-title').text();
        const year = $(element).find('.browse-movie-year').text();
        const image = $(element).find('img').attr('src');
        const link = $(element).find('a').attr('href');
        movies.push({ title, year, image, link });
      });

      setSearchResults(movies);

      const nextPageElement = $('.tsc_pagination li:last-child a');
      const nextPage = nextPageElement.attr('href');
      if (nextPage) {
        setNextPageLink(`https://yts.mx${nextPage}`);
      } else {
        setNextPageLink(null);
      }

    } catch (error) {
      console.error('Error while searching YTS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = async () => {
    if (!nextPageLink) return;

    try {
      setIsLoading(true);
      const response = await axios.get(nextPageLink);
      const $ = load(response.data);
      const movies = [];

      $('.browse-movie-wrap').each((index, element) => {
        const title = $(element).find('.browse-movie-title').text();
        const year = $(element).find('.browse-movie-year').text();
        const image = $(element).find('img').attr('src');
        const link = $(element).find('a').attr('href');
        movies.push({ title, year, image, link });
      });

      const newSearchResults = [...searchResults, ...movies];
      setSearchResults(newSearchResults);

      const nextPageElement = $('.tsc_pagination li:last-child a');
      const nextPage = nextPageElement.attr('href');
      if (nextPage) {
        setNextPageLink(`https://yts.mx${nextPage}`);
      } else {
        setNextPageLink(null);
      }

      setTimeout(() => {
        if (movieListRef.current && newSearchResults.length > 0) {
          const firstNewMovieIndex = newSearchResults.length - movies.length;
          const firstNewMovie = movieListRef.current.children[firstNewMovieIndex];
          if (firstNewMovie) {
            firstNewMovie.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 0);

    } catch (error) {
      console.error('Error fetching next page:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleDownload = () => {
    // TODO: Implement Plex integration/add to Plex functionality here
    console.log('Add to Plex clicked for:', selectedMovie.title);
  };

  const closeModal = () => {
    setSelectedMovie(null);
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Plex Movie Finder</h1>
      </div>
      <div className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="Movie title..."
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSubmit(event);
            }
          }}
        />
        <button type="submit" onClick={handleSubmit}>
          Search
        </button>
      </div>
      {isLoading && (
        <div className="loading" style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      )}
      <ul className="movie-list" ref={movieListRef}>
        {searchResults.map((movie, index) => (
          <li key={index} onClick={() => handleMovieClick(movie)}>
            <img
              src={movie.image}
              alt={movie.title}
              className="movie-image"
            />
            <h2>{movie.title}</h2>
            <p>{movie.year}</p>
          </li>
        ))}
      </ul>

      {nextPageLink && (
        <div className="pagination-dock" style={{ position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}>
          <button onClick={handleNextPage}>Next</button>
        </div>
      )}

      {selectedMovie && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'white', padding: '20px', border: '1px solid #ccc', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)', borderRadius: '5px', textAlign: 'center' }}>
            <h2>{selectedMovie.title}</h2>
            <p>Would you like to add this movie to Plex?</p>
            <div style={{ marginTop: '20px' }}>
              <button onClick={handleDownload} style={{ marginRight: '10px' }}>Yes</button>
              <button onClick={closeModal}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;