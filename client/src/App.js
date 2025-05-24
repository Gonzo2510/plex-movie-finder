import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextPageLink, setNextPageLink] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalState, setModalState] = useState({
    open: false,
    loading: false,
    links: [],
    error: null,
    step: null, // 'confirm' or 'quality'
    movie: null // store selected movie for modal
  });
  const [selectedMovieUrl, setSelectedMovieUrl] = useState(null);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState(0);

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
      const params = {};

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
    setModalState({
      open: true,
      loading: false,
      links: [],
      error: null,
      step: 'confirm',
      movie
    });
  };

  // Helper to sort links by hierarchy
  function sortLinks(links) {
    const priorities = [
      { regex: /1080.*web.*265/i, score: 1 },
      { regex: /1080/i, score: 2 },
      { regex: /720.*web.*265/i, score: 3 },
      { regex: /720/i, score: 4 }
    ];
    return [...links].sort((a, b) => {
      const getScore = (text) => {
        for (const p of priorities) {
          if (p.regex.test(text)) return p.score;
        }
        return 99;
      };
      return getScore(a.text) - getScore(b.text);
    });
  }

  const handleDownloadClick = async (moviePageUrl) => {
    setModalState(prev => ({
      ...prev,
      loading: true,
      links: [],
      error: null,
      step: 'quality'
    }));
    setSelectedMovieUrl(moviePageUrl);

    try {
      // Fetch the movie page HTML
      const res = await fetch(moviePageUrl);
      const html = await res.text();

      // Parse HTML and extract links, excluding subtitles
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const pTag = doc.querySelector('#movie-info > div.bottom-info > p');
      let links = [];
      if (pTag) {
        links = Array.from(pTag.querySelectorAll('a'))
          .filter(a => !a.textContent.toLowerCase().includes('subtitle'))
          .map(a => ({
            href: a.href,
            text: a.textContent
          }));
        links = sortLinks(links);
      }

      // Find the highest quality available
      let defaultIndex = 0;
      if (links.length > 0) {
        defaultIndex = 0; // Already sorted, so first is best
      }

      setSelectedQualityIndex(defaultIndex);

      setModalState(prev => ({
        ...prev,
        loading: false,
        links,
        error: null
      }));
    } catch (err) {
      setModalState(prev => ({
        ...prev,
        loading: false,
        links: [],
        error: 'Failed to load links.'
      }));
    }
  };

  // Called when user selects a link to actually download
  const handleSelectLink = async (linkUrl) => {
    setModalState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));
    try {
      // Send the selected link to the backend
      await fetch('http://localhost:5000/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl })
      });
      setModalState({
        open: false,
        loading: false,
        links: [],
        error: null,
        step: null,
        movie: null
      });
      // Optionally show a success message
    } catch (err) {
      setModalState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to send download request.'
      }));
    }
  };

  const closeModal = () => {
    setModalState({
      open: false,
      loading: false,
      links: [],
      error: null,
      step: null,
      movie: null
    });
    setSelectedMovie(null);
  };

  // Animate arrow
  const [arrowOffset, setArrowOffset] = useState(0);
  useEffect(() => {
    let direction = 1;
    let frame;
    function animate() {
      setArrowOffset(prev => {
        if (prev >= 10) direction = -1;
        if (prev <= 0) direction = 1;
        return prev + direction * 0.45; // arrow speed
      });
      frame = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(frame);
  }, [modalState.open, modalState.step]);

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
        <button className="search-button">Search</button>
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

      {modalState.open && (
        <div className="quality-modal">
          <div className="quality-modal-content" style={{ position: 'relative' }}>
            {/* Close (X) button */}
            <button
              className="quality-modal-close"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5em',
                cursor: 'pointer',
                color: '#888',
                zIndex: 1
              }}
              onClick={closeModal}
              aria-label="Close"
            >
              ×
            </button>
            {modalState.step === 'confirm' && modalState.movie && (
              <>
                <h2>{modalState.movie.title}</h2>
                <p>Would you like to add this movie to Plex?</p>
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={() => handleDownloadClick(modalState.movie.link)}
                    style={{ marginRight: '10px' }}
                  >
                    Yes
                  </button>
                  <button onClick={closeModal}>No</button>
                </div>
              </>
            )}
            {modalState.step === 'quality' && (
              modalState.loading ? (
                <div className="loading-dots" style={{ color: 'black', fontSize: '24px' }}>
                  Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
                </div>
              ) : modalState.error ? (
                <div style={{ color: 'red' }}>{modalState.error}</div>
              ) : (
                <>
                  <div>Select a quality to download:</div>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {modalState.links.map((link, idx) => (
                      <li
                        key={link.href}
                        style={{
                          margin: '10px 0',
                          display: 'flex',
                          alignItems: 'center',
                          fontWeight: idx === selectedQualityIndex ? 'bold' : 'normal'
                        }}
                        onClick={() => setSelectedQualityIndex(idx)}
                      >
                        {/* Animated Arrow */}
                        <span
                          style={{
                            display: 'inline-block',
                            width: '24px',
                            marginRight: '8px',
                            transform: `translateX(${idx === selectedQualityIndex ? arrowOffset : 0}px)`,
                            transition: idx === selectedQualityIndex ? 'none' : 'transform 0.5s'
                          }}
                        >
                          {idx === selectedQualityIndex ? '➔' : ''}
                        </span>
                        <button
                          onClick={() => handleSelectLink(link.href)}
                          style={{
                            padding: '10px 20px',
                            fontSize: '16px',
                            background: idx === selectedQualityIndex ? '#e0ffe0' : '',
                            border: idx === selectedQualityIndex ? '2px solid #2b923c' : '',
                            cursor: 'pointer'
                          }}
                        >
                          {link.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;