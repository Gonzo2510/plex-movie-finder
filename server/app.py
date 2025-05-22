# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from qbittorrentapi import Client
import os
import subprocess
import time

app = Flask(__name__)
CORS(app)

# qBittorrent configuration
QB_HOST = os.environ.get('QB_HOST', 'localhost')
QB_PORT = os.environ.get('QB_PORT', '8080')
QB_USERNAME = os.environ.get('QB_USERNAME', 'Gonzo2510')
QB_PASSWORD = os.environ.get('QB_PASSWORD', 'Password1!')
QB_DOWNLOAD_LOCATION = os.environ.get('QB_DOWNLOAD_LOCATION', r'D:\Movies 3tb')

# Initialize qBittorrent client globally or within the request handler
# It's better to initialize it within the request handler for robustness,
# but for simplicity, we'll do it here. You might need error handling
# if the connection fails.
def launch_qbittorrent():
    """
    Attempt to launch qBittorrent (desktop client with Web UI enabled).
    Adjust the executable path as needed for your OS.
    """
    try:
        # Windows example path; adjust if needed
        qb_path = r"C:\Program Files\qBittorrent\qbittorrent.exe"
        subprocess.Popen([qb_path])
        print("Attempted to launch qBittorrent.")
        # Wait a few seconds for Web UI to start
        time.sleep(5)
    except Exception as e:
        print(f"Failed to launch qBittorrent: {e}")

try:
    qb = Client(
        host=f'http://{QB_HOST}:{QB_PORT}',
        username=QB_USERNAME,
        password=QB_PASSWORD
    )
    qb.auth_log_in()
    print("Successfully connected to qBittorrent Web UI.")
except Exception as e:
    print(f"Failed to connect to qBittorrent: {e}")
    launch_qbittorrent()
    # Try to connect again after launching
    try:
        qb = Client(
            host=f'http://{QB_HOST}:{QB_PORT}',
            username=QB_USERNAME,
            password=QB_PASSWORD
        )
        qb.auth_log_in()
        print("Successfully connected to qBittorrent Web UI after launching.")
    except Exception as e2:
        print(f"Still failed to connect to qBittorrent: {e2}")
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

    app.run(host='0.0.0.0', port=5000, debug=True)