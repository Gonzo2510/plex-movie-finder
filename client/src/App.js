import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationLinks, setPaginationLinks] = useState([]); // Store pagination links
  const [currentPage, setCurrentPage] = useState(1); // Track current page

  // Effect to search whenever currentPage changes
  useEffect(() => {
    if (searchTerm) {
      searchYts(searchTerm, currentPage);
    }
  }, [currentPage]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (searchTerm.trim() === '') return; // Prevent search if searchTerm is empty
    setCurrentPage(1); // Reset to the first page for new search
    setSearchResults([]); // Clear previous search results
    setPaginationLinks([]); // Clear previous pagination links
    setIsLoading(true); // Start loading
    searchYts(searchTerm, 1); // Search with term and page 1
  };

  const searchYts = async (term, page) => {
    if (!term.trim()) return; // Prevent API call if term is empty

    try {
      setIsLoading(true);
      const params = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        },
      };

      // Encode search term to make sure it's properly passed in URL
      const encodedTerm = encodeURIComponent(term.trim());
      const url = `https://yts.mx/browse-movies/${encodedTerm}/all/all/0/latest/0/all?page=${page}`;
      console.log('Searching YTS:', url);
      const response = await axios.get(url, params);
      const $ = load(response.data);
      const movies = [];

      // Scrape movie data
      $('.browse-movie-wrap').each((index, element) => {
        const title = $(element).find('.browse-movie-title').text();
        const year = $(element).find('.browse-movie-year').text();
        const image = $(element).find('img').attr('src');
        const link = $(element).find('a').attr('href');
        movies.push({ title, year, image, link });
      });

      // Scrape pagination links, filtering for only unique page numbers
      const pages = [];
      const seenPages = new Set(); // To track seen pages and avoid duplicates
      $('.tsc_pagination li').each((index, element) => {
        const pageNumber = $(element).find('a').text();
        const pageLink = $(element).find('a').attr('href');
        // Add only valid numeric page links, avoid 'Next' and 'Previous'
        if (pageLink && /^\d+$/.test(pageNumber) && !seenPages.has(pageNumber)) {
          pages.push({ pageNumber, pageLink });
          seenPages.add(pageNumber); // Add to seen pages to avoid duplicates
        }
      });

      // Only update results if we actually have new movies (to prevent stale results)
      if (movies.length > 0) {
        setSearchResults(movies);
      }

      setPaginationLinks(pages); // Store pagination links
    } catch (error) {
      console.error('Error while searching YTS:', error);
    } finally {
      setIsLoading(false); // Stop loading after fetching results
    }
  };

  // Handle pagination click
  const handlePageClick = (page) => {
    setCurrentPage(Number(page)); // Update current page
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
        <div className="loading">
          <h2>Loading...</h2>
        </div>
      )}
      <ul className="movie-list">
        {searchResults.map((movie, index) => (
          <li key={index}>
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

      {/* Render pagination */}
      {paginationLinks.length > 1 && (  // Check if more than one page link is available
        <div className="pagination-dock" style={{ position: 'fixed', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '10px' }}>
          {paginationLinks.map((page, index) => (
            <button
              key={index}
              onClick={() => handlePageClick(page.pageNumber)}
              disabled={currentPage === Number(page.pageNumber)}
            >
              {page.pageNumber}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
