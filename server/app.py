# app.py
from flask import Flask, request, jsonify
from qbittorrentapi import Client
import os

app = Flask(__name__)

# qBittorrent configuration
QB_HOST = os.environ.get('QB_HOST', 'localhost')
QB_PORT = os.environ.get('QB_PORT', '8080')
QB_USERNAME = os.environ.get('QB_USERNAME', 'Gonzo2510')
QB_PASSWORD = os.environ.get('QB_PASSWORD', 'Password1!')
QB_DOWNLOAD_LOCATION = os.environ.get('QB_DOWNLOAD_LOCATION', 'D:\Movies 3tb')

# Initialize qBittorrent client globally or within the request handler
# It's better to initialize it within the request handler for robustness,
# but for simplicity, we'll do it here. You might need error handling
# if the connection fails.
try:
    qb = Client(
        host=f'http://{QB_HOST}:{QB_PORT}',
        username=QB_USERNAME,
        password=QB_PASSWORD
    )
    # Test connection
    qb.auth_log_in()
    print("Successfully connected to qBittorrent Web UI.")
except Exception as e:
    print(f"Failed to connect to qBittorrent: {e}")
    qb = None # Set qb to None if connection fails

@app.route('/download', methods=['POST'])
def handle_download():
    if qb is None:
        return jsonify({'status': 'error', 'message': 'qBittorrent connection not established.'}), 500

    data = request.json
    if not data or 'url' not in data:
        return jsonify({'status': 'error', 'message': 'Missing download URL'}), 400

    download_url = data['url']
    print(f"Received download request for: {download_url}")

    try:
        # Add the torrent
        qb.torrents_add(
            urls=download_url,
            save_path=QB_DOWNLOAD_LOCATION,
            is_paused=False # Set to True if you want to manually start downloads
        )
        return jsonify({'status': 'success', 'message': 'Download started in qBittorrent', 'url': download_url})
    except Exception as e:
        print(f"Error adding torrent: {e}")
        return jsonify({'status': 'error', 'message': f'Failed to add torrent to qBittorrent: {e}'}), 500

@app.route('/')
def index():
    # Return a simple JSX-like string
    return '<div><h1>Server</h1></div>'

if __name__ == '__main__':
    # You might want to get these from environment variables or a config file
    # for better security and flexibility in a production environment.
    # Example for environment variables:
    # export QB_USERNAME="your_username"
    # export QB_PASSWORD="your_password"
    # export QB_DOWNLOAD_LOCATION="/path/to/your/plex/movies"
    # export QB_HOST="192.168.1.100" # If qbittorrent is on another machine

    app.run(host='0.0.0.0', port=5001, debug=True)