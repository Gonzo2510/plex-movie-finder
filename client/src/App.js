import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { load } from 'cheerio';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [modalStep, setModalStep] = useState(1)

  const handleInputChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    await searchYts(searchTerm);
    setIsLoading(false); 
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
    if (password === 'password') {
      console.log('Success!');
      setShowModal(false);
    } else {
      console.log('Incorrect password');
    }
  };

  const handleModalClose = () => {
    setModalStep(1); // Reset the modal step to the initial state
    setPassword(''); // Clear the password field
    setConfirmed(false); // Reset the confirmed state
    setShowModal(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      handleModalClose();
    }
  };

  const handleConfirm = (isMovieOnPlex) => {
    if (isMovieOnPlex) {
      setModalStep(2); // Proceed to the password prompt
    } else {
      setModalStep(3); // Show the "Cool. Go check..." message and close the modal
    }
  };

  useEffect(() => {
    if (modalStep === 3) {
      const timeout = setTimeout(() => {
        setShowModal(false);
      }, 10000); // Close the modal after 10 seconds
      return () => clearTimeout(timeout);
    }
  }, [modalStep, setShowModal]);

  const movieRequest = () => {
    const form = document.getElementById('optionForm');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const option = document.getElementById('option').value;
    
        fetch('http://jagonz.duckdns.org:80/process_option', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ option: option })
        })
        .then(response => response.json())   
    
        .catch(error => console.error('Error:', error));
    });
  }


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
        <button type="submit" onClick={handleSubmit}>Search</button>
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
            onClick={handleImageClick} 
            className='movie-image'
            />
            <h2>{movie.title}</h2>
            <p>{movie.year}</p>
          </li>
        ))}
      </ul>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
          <button className="close-button" onClick={handleModalClose}>
              Cancel
            </button>
            {modalStep === 1 && (
              <>
                <h2>Confirm Movie Addition</h2>
                <p>Did you check if the moive is already on Plex?</p>
                <div className="options">
                  <button onClick={() => handleConfirm(true)}>Yes</button>
                  <button onClick={() => handleConfirm(false)}>No</button>
                </div>
              </>
            )}
            {modalStep === 3 && (
              <>
                <p>Password:</p>
                <input type="password" value={password} onChange={handlePasswordChange} />
                <button type="submit" onClick={handleSubmitPassword}>
                  Add to Plex
                </button>
              </>
            )}
            {modalStep === 2 && (
              <p>Go check. If it's not come back.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;