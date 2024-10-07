import React, { useState } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);

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

  const handleImageClick = () => {
    setShowModal(true);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleConfirmedChange = (event) => {
    setConfirmed(event.target.checked);
  };

  const handleSubmitPassword = (event) => {
    event.preventDefault();
    if (password === 'your_password_here') {
      console.log('Success!');
      setShowModal(false);
    } else {
      console.log('Incorrect password');
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
            <img src={movie.image} alt={movie.title} onClick={handleImageClick} />
            <h2>{movie.title}</h2>
            <p>{movie.year}</p>
          </li>
        ))}
      </ul>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Movie Addition</h2>
            <p>Movie already on Plex?</p>
            <input type="checkbox" checked={confirmed} onChange={handleConfirmedChange} />
            <p>Yes</p>
            <p>No</p>
            <p>Password:</p>
            <input type="password" value={password} onChange={handlePasswordChange} />
            <button type="submit" onClick={handleSubmitPassword}>Add to Plex</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;