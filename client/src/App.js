import React, { useState } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paginationLinks, setPaginationLinks] = useState([]); // Store pagination links
  const [currentPage, setCurrentPage] = useState(1); // Track current page

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    await searchYts(searchTerm, 1); // Start search on the first page
    setIsLoading(false);
  };

  const searchYts = async (searchTerm, page) => {
    const params = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      },
    };
    try {
      const url = `https://yts.mx/browse-movies/${searchTerm}/all/all/0/latest/0/all?page=${page}`;
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

      setSearchResults(movies);
      setPaginationLinks(pages); // Store pagination links
    } catch (error) {
      console.error(error);
    }
  };

  // Handle pagination click
  const handlePageClick = async (page) => {
    setIsLoading(true);
    await searchYts(searchTerm, page);
    setIsLoading(false);
    setCurrentPage(page);
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
