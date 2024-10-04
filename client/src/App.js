import React, { useState } from 'react';
import axios from 'axios';
import cheerio from 'cheerio';

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


  // Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36
  
  const searchYts = async (searchTerm) => {
    try {
      const url = `https://yts.mx/browse-movies/${searchTerm}`;
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const movieTitles = [];

      $('div.browse-movie-wrap').each((index, element) => {
        const title = $(element).find('h2').text().trim();
        movieTitles.push(title);
      });

      setSearchResults(movieTitles);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Movie Finder</h1>
        <input type="text" value={searchTerm} onChange={handleInputChange} placeholder="Movie title..." />
        <button type="submit">Search</button>
      </form>
      <ul>
        {searchResults.map((title, index) => (
          <li key={index}>{title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;