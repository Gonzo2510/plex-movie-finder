import React, { useState } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    searchYts(searchTerm);
  };

   
  const searchYts = async (searchTerm) => {
    const params = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      },
    };
    try {
      const url = `https://yts.mx/browse-movies/${searchTerm}/all/all/0/latest/0/all`;
      const response = await axios.get(url, params);
      const $ = load(response.data);
      const movies = [];

      $('.browse-movie-wrap').each((index, element) => {
        const title = $(element).find('.browse-movie-title').text();
        const year = $(element).find('.browse-movie-year').text();
        const image = $(element).find('img').attr('src');

        movies.push({ title, year, image });
      });

      setSearchResults(movies);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Plex Movie Finder</h1>
      </div>
      <div className="search-form">
        <input type="text" value={searchTerm} onChange={handleInputChange} placeholder="Movie title..." />
        <button type="submit" onClick={handleSubmit}>Search</button>
      </div>
      <ul className="movie-list">
        {searchResults.map((movie, index) => (
          <li key={index}>
            <img src={movie.image} alt={movie.title} />
            <h2>{movie.title}</h2>
            <p>{movie.year}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;